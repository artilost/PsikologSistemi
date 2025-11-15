export interface BaseRepository<T, CreateInput = any, UpdateInput = any> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with pagination
   */
  findAll(page?: number, limit?: number): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Create new entity
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Update existing entity
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete entity (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete entity
   */
  softDelete(id: string): Promise<void>;

  /**
   * Restore soft-deleted entity
   */
  restore(id: string): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<boolean>;
}

