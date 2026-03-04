/**
 * Category Repository
 *
 * Provides data access operations for categories.
 * Categories are used to organize apps into groups.
 */

import { eq, and, asc } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";
import type { Category, NewCategory } from "@/database/schema/categories";

export class CategoryRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all categories for a user
   */
  async findAll(userId: string): Promise<Category[]> {
    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    return db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
    });
  }

  /**
   * Get a single category by ID
   */
  async findById(id: string, userId: string): Promise<Category | null> {
    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return category ?? null;
  }

  /**
   * Create a new category
   */
  async create(data: Omit<NewCategory, "id" | "createdAt"> & { userId: string }): Promise<Category> {
    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    const [created] = await db
      .insert(categories)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewCategory, "id" | "userId" | "createdAt">>
  ): Promise<Category | null> {
    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    const [updated] = await db
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete a category
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Update sort order for categories
   */
  async updateSortOrder(orderedIds: string[], userId: string): Promise<number> {
    if (orderedIds.length === 0) return 0;

    const db = await this.getDb();
    const { categories } = await import("@/database/schema");

    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(categories)
            .set({ sortOrder: index })
            .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        )
      );
    });

    return orderedIds.length;
  }
}

// Singleton instance
let categoryRepository: CategoryRepository | null = null;

export function getCategoryRepository(): CategoryRepository {
  if (!categoryRepository) {
    categoryRepository = new CategoryRepository();
  }
  return categoryRepository;
}
