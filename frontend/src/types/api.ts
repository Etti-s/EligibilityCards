export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: string[] | null;
}

export class ApiError extends Error {
  status: number;
  errors?: string[];
  data?: unknown;

  constructor(message: string, status: number, errors?: string[], data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}
