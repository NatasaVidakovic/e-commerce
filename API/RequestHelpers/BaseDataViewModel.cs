using API.Mappings;
using Core.DTOs;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace API.RequestHelpers
{
    /// <summary>
    /// Base clas for data view models.
    /// </summary>
    /// <typeparam name="T"> Class that inherit BaseDto. </typeparam>
    /// <typeparam name="D"> Class that inherit BaseEntity. </typeparam>
    /// <typeparam name="M"> Class used for mappings. </typeparam>
    public class BaseDataViewModel<T, D, M> where T : BaseDto
        where D : IDtoConvertible
        where M : BaseMapping<T,D>
    {
        #region PROPERTIES

#pragma warning disable 1591
       public M? Mapper { get; set; }

        public int CurrentPage { get; set; }

        public int PageCount { get; set; }

        public int DataCount { get; set; }

        public int LoadedDataCount { get; set; }

        public int PageSize { get; set; }

        public string Column { get; set; } = string.Empty;

        public string Accessor { get; set; } = string.Empty;

        public bool Ascending { get; set; }

        public bool Descending { get; set; }

        public List<T> Data { get; set; } = new List<T>();

        public string RequestItem { get; set; } = string.Empty;

        public int? DiscardEditedItemId { get; set; }

        public int? BackToPageItemId { get; set; }

        public int? RoutingFormItemId { get; set; }

        public int? ItemIndex { get; set; }

        public T FormData { get; set; } = null;
        [FromQuery(Name = "Filters")]
        public List<List<FilterViewModel>> Filters { get; set; } = [];

        //         public List<Column> Columns { get; set; }

        public List<T> AllData { get; set; } = [];

        [JsonIgnore]
        public IQueryable<D>? InitialQuery { get; set; } = null;

        //[JsonIgnore]
        //public Expression<Func<D, T>> SelectExpression { get; set; }



#pragma warning restore 1591

        #endregion
        #region METHODS

        /// <summary>
        /// Peerform skip take and order operations on current model based on frontend request.
        /// </summary>
        /// <returns> Query with specified parameters or throws argument exception. </returns>
        public IQueryable<D> PerformSkipTakeAndOrder()
        {
            var isAscendingOrder = IsAscendingOrder();
            var isDescendingOrder = IsDescendingOrder();

            if (isAscendingOrder)
            {
                return GridDataOrderBy(string.IsNullOrEmpty(Column) ? "Id" : Column, false).
                    Skip((CurrentPage - 1) * PageSize).Take(PageSize);
            }
            else if (isDescendingOrder)
            {
                return GridDataOrderBy(string.IsNullOrEmpty(Column) ? "Id" : Column, true)
                    .Skip((CurrentPage - 1) * PageSize).Take(PageSize);
            }
            else
                throw new ArgumentException("Ordering not supported!");
        }

        /// <summary>
        /// Peerforms order operations on current model based on frontend request.
        /// </summary>
        /// <returns> Query with specified parameters or throws argument exception. </returns>
        public IQueryable<D> PerformOrder()
        {
            var isAscendingOrder = IsAscendingOrder();
            var isDescendingOrder = IsDescendingOrder();

            if (isAscendingOrder)
                return GridDataOrderBy(string.IsNullOrEmpty(Column) ? "Id" : Column, false);
            else if (isDescendingOrder)
                return GridDataOrderBy(string.IsNullOrEmpty(Column) ? "Id" : Column, true);
            else
                throw new ArgumentException("Ordering not supported!");
        }

        /// <summary>
        /// Include order operation for grid select query.
        /// </summary>
        /// <param name="ordering"> Data view field that we use for ordering. </param>
        /// <param name="isDesc"> Ordering direction. </param>
        /// <returns> Queri with ordering expression. </returns>
        public IQueryable<D> GridDataOrderBy(string ordering, bool isDesc)
        {
            MethodCallExpression resultExp = GenerateMethodCall((isDesc ? "OrderByDescending" : "OrderBy"), ordering);

            return InitialQuery.Provider.CreateQuery<D>(resultExp);
        }

        /// <summary>
        /// Method for generating expression method call for ordering purposes.
        /// </summary>
        /// <param name="methodName"> Name of applied method. </param>
        /// <param name="fieldName"> Name of field used in ordering. </param>
        /// <returns> Ordering expression. </returns>
        private MethodCallExpression GenerateMethodCall(string methodName, string fieldName)
        {
            Type type = typeof(D);

            var parameter = Expression.Parameter(type, "p");
            PropertyInfo property;
            Expression propertyAccess;
            if (fieldName.Contains('.') || fieldName.Contains('?'))
            {
                string[] childProperties = fieldName.Split(new char[] { '?', '.' }).Where(t => t != "").ToArray();
                property = typeof(D).GetProperty(childProperties[0]);
                propertyAccess = Expression.MakeMemberAccess(parameter, property);
                for (int i = 1; i < childProperties.Length; i++)
                {
                    property = property.PropertyType.GetProperty(childProperties[i]);
                    propertyAccess = Expression.MakeMemberAccess(propertyAccess, property);
                }
            }
            else
            {
                property = typeof(D).GetProperty(fieldName);
                propertyAccess = Expression.MakeMemberAccess(parameter, property);
            }

            LambdaExpression selector = Expression.Lambda(propertyAccess, parameter);
            MethodCallExpression resultExp = Expression.Call(typeof(Queryable), methodName,
                                            new Type[] { type, property.PropertyType },
                                            InitialQuery.Expression, Expression.Quote(selector));
            return resultExp;
        }

        private void HandleNextItem()
        {
            if (RequestItem == "NEXT")
            {
                var data = Data.Where(x => x.Id == FormData.Id).FirstOrDefault();

                if (data == null) return;

                var index = Data.IndexOf(data);

                if (index == Data.Count - 1 && CurrentPage < PageCount)
                {
                    CurrentPage += 1;
                    Data = PerformSkipTakeAndOrder().Select(b => Mapper.ToDto(b)).ToList();
                    FormData = Data.ElementAt(0);
                    ItemIndex = 0;
                }

                if (index < Data.Count - 1)
                {
                    FormData = Data.ElementAt(index + 1);
                    ItemIndex = index + 1;
                }

                Data = null;
            }
        }

        private void HandlePreviousItem()
        {
            if (RequestItem == "PREVIOUS")
            {
                var data = Data.Where(x => x.Id == FormData.Id).FirstOrDefault();

                if (data == null) return;

                var index = Data.IndexOf(data);

                if (index == 0 && CurrentPage > 1)
                {
                    CurrentPage -= 1;
                    Data = PerformSkipTakeAndOrder().Select(b => Mapper.ToDto(b)).ToList();
                    FormData = Data.ElementAt(Data.Count - 1);
                    ItemIndex = Data.Count - 1;
                }

                if (index > 0)
                {
                    FormData = Data.ElementAt(index - 1);
                    ItemIndex = index - 1;
                }

                Data = null;
            }
        }

        private void HandleFirstItem()
        {
            if (RequestItem == "FIRST")
            {
                if (Data == null || Data.Count == 0) return;

                CurrentPage = 1;
                Data = PerformSkipTakeAndOrder().Select(b => Mapper.ToDto(b)).ToList();
                FormData = Data.ElementAt(0);
                ItemIndex = 0;

                Data = null;
            }
        }

        private void HandleLastItem()
        {
            if (RequestItem == "LAST")
            {
                if (Data == null || Data.Count == 0) return;

                CurrentPage = PageCount;
                Data = PerformSkipTakeAndOrder().Select(b => Mapper.ToDto(b)).ToList();
                FormData = Data.ElementAt(Data.Count - 1);
                ItemIndex = Data.Count - 1;

                Data = null;
            }
        }

        /// <summary>
        /// Method for fetching end data view result based on filters, ordering, skip and take,
        /// all data count and preparing response model with page navigation informations.
        /// </summary>
        /// <param name="defaultFiltering"> Bool field represening is default filter active. </param>
        public void GetResult(bool defaultFiltering = true)
        {
             if (defaultFiltering) DefaultApplyFilters();
            CalculatePaging();

            var isDiscardEditedItem = DiscardEditedItemId != null && DiscardEditedItemId > 0;
            var isBackToPageItem = BackToPageItemId != null && BackToPageItemId > 0;
            var isRoutingFormItemId = RoutingFormItemId != null && RoutingFormItemId > 0;

            if (isDiscardEditedItem || isBackToPageItem || isRoutingFormItemId)
            {
                FormData = InitialQuery
                    .Select(b => Mapper.ToDto(b))
                    .Where(x => x.Id == (isDiscardEditedItem
                                            ? (int)DiscardEditedItemId
                                            : isRoutingFormItemId
                                                ? (int)RoutingFormItemId
                                                : (int)BackToPageItemId))
                    .FirstOrDefault();

                LoadedDataCount = PerformSkipTakeAndOrder().Count();

                // if (FormData == null) IsSuccessfull = false;
            }

            if (isDiscardEditedItem || isRoutingFormItemId) return;

            Data = PerformSkipTakeAndOrder().Select(b => Mapper.ToDto(b)).ToList();
            LoadedDataCount = Data.Count;

            HandleNextItem();
            HandlePreviousItem();
            HandleFirstItem();
            HandleLastItem();
        }

        /// <summary>
        /// Gets all data based on filters.
        /// </summary>
        /// <param name="defaultFiltering"> Bool field represening is default filter active. </param>
        public void GetAllData(bool defaultFiltering = true)
        {
            if (defaultFiltering) DefaultApplyFilters();
            AllData = PerformOrder().Select(b => Mapper.ToDto(b)).ToList();
        }

        /// <summary>
        /// Calculate page count.
        /// </summary>
        public void CalculatePaging()
        {
            DataCount = InitialQuery.Count();

            if (DataCount == 0)
            {
                PageCount = 1;
                CurrentPage = 1;
            }
            else PageCount = (int)Math.Ceiling((decimal)DataCount / PageSize);
        }

        /// <summary>
        /// Applies all filters to data set based on frontend filters
        /// </summary>
         public void DefaultApplyFilters()
        {
            if (Filters != null && Filters.Count > 0 && Filters.ElementAt(0).Count > 0)
            {
                var filters = new List<List<ScriptFilterModel>>();

                foreach (var item in Filters)
                {
                    var list = new List<ScriptFilterModel>();

                    foreach (var f in item)
                    {
                        if (!f.DefaultFilter)
                        {
                            list.Add(new ScriptFilterModel()
                            {
                                PropertyName = f.PropertyName,
                                StringDataType = f.DataType,
                                DataType = Type.GetType("System." + f.DataType),
                                LevelOneProxyPropertyName = f.FirstLevel,
                                LevelTwoProxyPropertyName = f.SecondLevel,
                                Value = f.Value,
                                OperationType = ScriptDynamicFiltering.GetOperationTypeByString(f.OperationType),
                                AdvancedFilter =
                                        new OneToManyContains
                                            (f.PropertyName, f.FirstLevel, f.SecondLevel, Type.GetType("System." + f.DataType), f.Value),
                                DefaultFilter = f.DefaultFilter,
                                MultipleValues = f.MultipleValues
                            });
                        }
                    }

                    if (list.Count != 0)
                    {
                        filters.Add(list);
                    }
                }

                if (filters.Any())
                {
                    InitialQuery = ScriptDynamicFiltering.ApplyIQueryable(filters, InitialQuery);
                }
            }
        }

        /// <summary>
        /// Calculate is ascending order of columns based on frontend data.
        /// </summary>
        /// <returns> Bool true if is ascending. </returns>
        public bool IsAscendingOrder() => !string.IsNullOrEmpty(Column) && Ascending;

        /// <summary>
        /// Calculate is descending order of columns based on frontend data.
        /// </summary>
        /// <returns> Bool true if is descending. </returns>
        public bool IsDescendingOrder() => string.IsNullOrEmpty(Column) || (!string.IsNullOrEmpty(Column) && Descending);

        #endregion
    }
}
