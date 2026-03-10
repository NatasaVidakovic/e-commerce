using System;
using System.Collections.Generic;

namespace Core.DTOs;

public class BaseDataViewModelRequest
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public string Column { get; set; } = string.Empty;
    public string Accessor { get; set; } = string.Empty;
    public bool Ascending { get; set; }
    public bool Descending { get; set; }
    public List<List<FilterViewModel>> Filters { get; set; } = new();
}

public class FilterViewModel
{
    public string PropertyName { get; set; } = string.Empty;
    public string FirstLevel { get; set; } = string.Empty;
    public string SecondLevel { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public object Value { get; set; } = string.Empty;
    public bool DefaultFilter { get; set; }
    public bool MultipleValues { get; set; }
}

public class BaseDataViewModelResponse<T> : BaseDataViewModelRequest
{
    public int PageCount { get; set; }
    public int DataCount { get; set; }
    public int LoadedDataCount { get; set; }
    public List<T> Data { get; set; } = new();
}
