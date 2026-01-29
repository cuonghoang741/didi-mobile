
export interface TabBarIconProps {
  color: string;
  size: number;
  focused: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface PaginationResponse<T> {
  items: T[];
  meta: Pagination;
}
