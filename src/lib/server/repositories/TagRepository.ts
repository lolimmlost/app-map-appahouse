/**
 * Tag Repository
 *
 * Provides data access operations for tags.
 * Tags are used to label and organize apps.
 */

import { eq, and, asc } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";
import type { Tag, NewTag } from "@/database/schema/apps";

export class TagRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all tags for a user
   */
  async findAll(userId: string): Promise<Tag[]> {
    const db = await this.getDb();
    const { tags } = await import("@/database/schema");

    return db.query.tags.findMany({
      where: eq(tags.userId, userId),
      orderBy: [asc(tags.name)],
    });
  }

  /**
   * Get a single tag by ID
   */
  async findById(id: string, userId: string): Promise<Tag | null> {
    const db = await this.getDb();
    const { tags } = await import("@/database/schema");

    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);

    return tag ?? null;
  }

  /**
   * Create a new tag
   */
  async create(data: Omit<NewTag, "id" | "createdAt"> & { userId: string }): Promise<Tag> {
    const db = await this.getDb();
    const { tags } = await import("@/database/schema");

    const [created] = await db
      .insert(tags)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Update a tag
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewTag, "id" | "userId" | "createdAt">>
  ): Promise<Tag | null> {
    const db = await this.getDb();
    const { tags } = await import("@/database/schema");

    const [updated] = await db
      .update(tags)
      .set(data)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete a tag
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { tags } = await import("@/database/schema");

    const result = await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();

    return result.length > 0;
  }
}

// Singleton instance
let tagRepository: TagRepository | null = null;

export function getTagRepository(): TagRepository {
  if (!tagRepository) {
    tagRepository = new TagRepository();
  }
  return tagRepository;
}
