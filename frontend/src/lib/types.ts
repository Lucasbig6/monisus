export interface Dashboard {
  id: number;
  dashboard_title: string;
  slug?: string;
  published?: boolean;
  created_on?: string;
  changed_on?: string;
  json_metadata?: string;
  position_json?: string;
}

export interface Chart {
  id: number;
  slice_name: string;
  viz_type?: string;
  datasource_id?: number;
  datasource_type?: string;
  params?: string;
}

export interface User {
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface PaginatedResponse<T> {
  count: number;
  result: T[];
}
