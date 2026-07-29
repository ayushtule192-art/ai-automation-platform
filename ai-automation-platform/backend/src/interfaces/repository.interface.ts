/** Generic repository contract for data access layer */
export interface IRepository<T, CreateInput, UpdateInput, WhereInput = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findMany(where?: WhereInput): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: WhereInput): Promise<number>;
}

/** Pagination options for repository queries */
export interface RepositoryPaginationOptions {
  skip: number;
  take: number;
  orderBy?: Record<string, "asc" | "desc">;
}

/** Paginated repository result */
export interface RepositoryPaginatedResult<T> {
  data: T[];
  total: number;
}
