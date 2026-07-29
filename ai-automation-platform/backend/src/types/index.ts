import type { UserRole } from "@prisma/client";

/** Authenticated user attached to Express request after JWT verification */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Standard API success response envelope */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Pagination query parameters */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Paginated response metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
