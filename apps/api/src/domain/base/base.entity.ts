export abstract class BaseEntity {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  constructor(id: string, createdAt?: Date, updatedAt?: Date, deletedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._deletedAt = deletedAt;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined && this._deletedAt !== null;
  }

  /**
   * Mark entity as updated
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Soft delete entity
   */
  delete(): void {
    if (this._deletedAt) {
      throw new Error('Entity already deleted');
    }
    this._deletedAt = new Date();
    this.touch();
  }

  /**
   * Restore soft-deleted entity
   */
  restore(): void {
    if (!this._deletedAt) {
      throw new Error('Entity is not deleted');
    }
    this._deletedAt = undefined;
    this.touch();
  }

  /**
   * Check equality by ID
   */
  equals(entity: BaseEntity): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (!(entity instanceof this.constructor)) {
      return false;
    }
    return this._id === entity._id;
  }
}

