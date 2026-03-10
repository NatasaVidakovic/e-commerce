export type FilterOperationType =
  | 'Contains'
  | 'StartsWith'
  | 'EndsWith'
  | 'Equal'
  | 'NotEqual'
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'LessThan'
  | 'LessThanOrEqual'
  | 'AdvancedFilter';

export type FilterDataType =
  | 'String'
  | 'Decimal'
  | 'Int32'
  | 'Boolean'
  | 'DateTime';

export interface FilterViewModel {
  propertyName: string;
  firstLevel: string;
  secondLevel: string;
  operationType: FilterOperationType;
  dataType: FilterDataType;
  value: any;
  defaultFilter: boolean;
  multipleValues: boolean;
}

export interface BaseDataViewModelRequest {
  currentPage: number;
  pageSize: number;
  column: string;
  accessor: string;
  ascending: boolean;
  descending: boolean;
  filters: FilterViewModel[][];
}

export interface BaseDataViewModelResponse<T> extends BaseDataViewModelRequest {
  pageCount: number;
  dataCount: number;
  loadedDataCount: number;
  data: T[];
}

export type DynamicFilterControlType = 'text' | 'number' | 'select' | 'date' | 'dateRange';

export interface DynamicFilterDefinition {
  key: string;
  label: string;
  controlType: DynamicFilterControlType;

  propertyName: string;
  firstLevel?: string;
  secondLevel?: string;
  operationType: FilterOperationType;
  dataType: FilterDataType;

  options?: string[];
  multiple?: boolean;
}

export interface DynamicSortOption {
  label: string;
  column: string;
  ascending: boolean;
  descending: boolean;
}
