/**
 * Saved View Repository
 *
 * Provides data access operations for saved search views.
 * Views store filter configurations for quick access.
 */

import { eq, and, asc } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";
import type { SavedView, NewSavedView } from "@/types/database";

export class SavedViewRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all saved views for a user
   */
  async findAll(userId: string): Promise<SavedView[]> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    return db.query.savedViews.findMany({
      where: eq(savedViews.userId, userId),
      orderBy: [asc(savedViews.name)],
    });
  }

  /**
   * Get a single saved view by ID
   */
  async findById(id: string, userId: string): Promise<SavedView | null> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    const [view] = await db
      .select()
      .from(savedViews)
      .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
      .limit(1);

    return view ?? null;
  }

  /**
   * Get the default saved view for a user
   */
  async findDefault(userId: string): Promise<SavedView | null> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    const [view] = await db
      .select()
      .from(savedViews)
      .where(and(eq(savedViews.userId, userId), eq(savedViews.isDefault, true)))
      .limit(1);

    return view ?? null;
  }

  /**
   * Create a new saved view
   */
  async create(data: Omit<NewSavedView, "id" | "createdAt" | "updatedAt"> & { userId: string }): Promise<SavedView> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    // If this view is being set as default, unset existing defaults
    if (data.isDefault) {
      await db
        .update(savedViews)
        .set({ isDefault: false })
        .where(eq(savedViews.userId, data.userId));
    }

    const [created] = await db
      .insert(savedViews)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Update a saved view
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewSavedView, "id" | "userId" | "createdAt">>
  ): Promise<SavedView | null> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    // If this view is being set as default, unset existing defaults
    if (data.isDefault) {
      await db
        .update(savedViews)
        .set({ isDefault: false })
        .where(eq(savedViews.userId, userId));
    }

    const [updated] = await db
      .update(savedViews)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete a saved view
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    const result = await db
      .delete(savedViews)
      .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Set a view as default (or clear default if id is null)
   */
  async setDefault(id: string | null, userId: string): Promise<SavedView | null> {
    const db = await this.getDb();
    const { savedViews } = await import("@/database/schema");

    // Unset all defaults for this user
    await db
      .update(savedViews)
      .set({ isDefault: false })
      .where(eq(savedViews.userId, userId));

    if (!id) return null;

    // Set the specified view as default
    const [updated] = await db
      .update(savedViews)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
      .returning();

    return updated ?? null;
  }
}

// Singleton instance
let savedViewRepository: SavedViewRepository | null = null;

export function getSavedViewRepository(): SavedViewRepository {
  if (!savedViewRepository) {
    savedViewRepository = new SavedViewRepository();
  }
  return savedViewRepository;
}
