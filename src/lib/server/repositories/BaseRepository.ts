/**
 * Base Repository Pattern
 *
 * Provides a consistent interface for data access operations
 * with built-in user ownership filtering.
 *
 * All repositories extend this base class to get:
 * - Automatic userId filtering for multi-tenant data isolation
 * - Standard CRUD operations
 * - Transaction support
 * - Type-safe Drizzle ORM integration
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTable, TableConfig } from "drizzle-orm/pg-core";
import type { SQL, InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import type * as schema from "@/database/schema";

// Type for the database instance with schema
export type DatabaseInstance = NodePgDatabase<typeof schema>;

// Base type for tables with userId column
export interface UserOwnedTable extends PgTable<TableConfig> {
  userId: ReturnType<typeof import("drizzle-orm/pg-core").text>;
  id: ReturnType<typeof import("drizzle-orm/pg-core").text>;
}

// Options for findMany queries
export interface FindManyOptions<T> {
  where?: SQL;
  orderBy?: { column: keyof T; direction: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
}

// Options for findFirst queries
export interface FindFirstOptions<T> {
  where?: SQL;
  orderBy?: { column: keyof T; direction: "asc" | "desc" }[];
}

/**
 * Abstract Base Repository
 *
 * Provides common data access patterns for user-owned entities.
 * Subclasses must implement the abstract methods for entity-specific behavior.
 */
export abstract class BaseRepository<
  TTable extends UserOwnedTable,
  TSelect = InferSelectModel<TTable>,
  TInsert = InferInsertModel<TTable>
> {
  protected table: TTable;

  constructor(table: TTable) {
    this.table = table;
  }

  /**
   * Get the database instance lazily to avoid bundling on client
   */
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get the userId column for filtering
   */
  protected getUserIdColumn() {
    return this.table.userId;
  }

  /**
   * Get the id column for finding by id
   */
  protected getIdColumn() {
    return this.table.id;
  }

  /**
   * Build order by clause from options
   */
  protected buildOrderBy(orderBy: { column: string; direction: "asc" | "desc" }[]) {
    return orderBy.map(({ column, direction }) => {
      const col = (this.table as any)[column];
      return direction === "asc" ? asc(col) : desc(col);
    });
  }

  /**
   * Find all items for a user
   */
  async findAllForUser(userId: string, options?: FindManyOptions<TSelect>): Promise<TSelect[]> {
    const db = await this.getDb();

    let query = db
      .select()
      .from(this.table)
      .where(options?.where ? and(eq(this.getUserIdColumn(), userId), options.where) : eq(this.getUserIdColumn(), userId));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query as unknown as Promise<TSelect[]>;
  }

  /**
   * Find a single item by id for a user
   */
  async findByIdForUser(id: string, userId: string): Promise<TSelect | null> {
    const db = await this.getDb();

    const [result] = await db
      .select()
      .from(this.table)
      .where(and(eq(this.getIdColumn(), id), eq(this.getUserIdColumn(), userId)))
      .limit(1);

    return (result as TSelect) ?? null;
  }

  /**
   * Find the first item matching conditions for a user
   */
  async findFirstForUser(userId: string, where?: SQL): Promise<TSelect | null> {
    const db = await this.getDb();

    const [result] = await db
      .select()
      .from(this.table)
      .where(where ? and(eq(this.getUserIdColumn(), userId), where) : eq(this.getUserIdColumn(), userId))
      .limit(1);

    return (result as TSelect) ?? null;
  }

  /**
   * Create a new item for a user
   */
  async create(data: Omit<TInsert, "id" | "userId"> & { userId: string }): Promise<TSelect> {
    const db = await this.getDb();

    const [result] = await db
      .insert(this.table)
      .values(data as TInsert)
      .returning();

    return result as TSelect;
  }

  /**
   * Update an item for a user
   */
  async updateForUser(
    id: string,
    userId: string,
    data: Partial<Omit<TInsert, "id" | "userId">>
  ): Promise<TSelect | null> {
    const db = await this.getDb();

    const [result] = await db
      .update(this.table)
      .set(data as Partial<TInsert>)
      .where(and(eq(this.getIdColumn(), id), eq(this.getUserIdColumn(), userId)))
      .returning();

    return (result as TSelect) ?? null;
  }

  /**
   * Delete an item for a user
   */
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();

    const result = await db
      .delete(this.table)
      .where(and(eq(this.getIdColumn(), id), eq(this.getUserIdColumn(), userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Delete multiple items by ids for a user
   */
  async deleteManyForUser(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();

    const result = await db
      .delete(this.table)
      .where(and(inArray(this.getIdColumn(), ids), eq(this.getUserIdColumn(), userId)))
      .returning();

    return result.length;
  }

  /**
   * Count items for a user
   */
  async countForUser(userId: string, where?: SQL): Promise<number> {
    const db = await this.getDb();
    const { sql } = await import("drizzle-orm");

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(where ? and(eq(this.getUserIdColumn(), userId), where) : eq(this.getUserIdColumn(), userId));

    return Number(result?.count ?? 0);
  }

  /**
   * Check if an item exists for a user
   */
  async existsForUser(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { sql } = await import("drizzle-orm");

    const [result] = await db
      .select({ exists: sql<boolean>`1` })
      .from(this.table)
      .where(and(eq(this.getIdColumn(), id), eq(this.getUserIdColumn(), userId)))
      .limit(1);

    return !!result;
  }

  /**
   * Update multiple items by ids for a user
   */
  async updateManyForUser(
    ids: string[],
    userId: string,
    data: Partial<Omit<TInsert, "id" | "userId">>
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const db = await this.getDb();

    const result = await db
      .update(this.table)
      .set(data as Partial<TInsert>)
      .where(and(inArray(this.getIdColumn(), ids), eq(this.getUserIdColumn(), userId)))
      .returning();

    return result.length;
  }

  /**
   * Find multiple items by ids for a user
   */
  async findManyByIdsForUser(ids: string[], userId: string): Promise<TSelect[]> {
    if (ids.length === 0) return [];

    const db = await this.getDb();

    const result = await db
      .select()
      .from(this.table)
      .where(and(inArray(this.getIdColumn(), ids), eq(this.getUserIdColumn(), userId)));

    return result as TSelect[];
  }
}
