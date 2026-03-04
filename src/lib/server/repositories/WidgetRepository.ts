/**
 * Widget Repository
 *
 * Provides data access operations for widgets.
 * Widgets display data from integrations on the dashboard.
 */

import { eq, and, asc } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";
import type { Widget, NewWidget, WidgetPosition, WidgetConfig } from "@/database/schema/widgets";
import type { Integration } from "@/database/schema/integrations";

// Widget with relations
export interface WidgetWithRelations extends Widget {
  integration: Integration | null;
}

export class WidgetRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all widgets for a user with integration relations
   */
  async findAll(userId: string): Promise<WidgetWithRelations[]> {
    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    return db.query.widgets.findMany({
      where: eq(widgets.userId, userId),
      orderBy: [asc(widgets.sortOrder)],
      with: {
        integration: true,
      },
    });
  }

  /**
   * Get a single widget by ID
   */
  async findById(id: string, userId: string): Promise<Widget | null> {
    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const [widget] = await db
      .select()
      .from(widgets)
      .where(and(eq(widgets.id, id), eq(widgets.userId, userId)))
      .limit(1);

    return widget ?? null;
  }

  /**
   * Create a new widget
   */
  async create(data: {
    type: Widget["type"];
    userId: string;
    integrationId?: string | null;
    position?: WidgetPosition;
    config?: WidgetConfig;
    sortOrder?: number;
  }): Promise<Widget> {
    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const [created] = await db
      .insert(widgets)
      .values({
        type: data.type,
        userId: data.userId,
        integrationId: data.integrationId,
        position: data.position || { x: 0, y: 0, w: 2, h: 2 },
        config: data.config || {},
        sortOrder: data.sortOrder || 0,
      })
      .returning();

    return created;
  }

  /**
   * Update a widget
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewWidget, "id" | "userId" | "createdAt">>
  ): Promise<Widget | null> {
    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const [updated] = await db
      .update(widgets)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(widgets.id, id), eq(widgets.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Update widget positions (for drag and drop)
   */
  async updatePositions(
    updates: Array<{ id: string; position: WidgetPosition; sortOrder: number }>,
    userId: string
  ): Promise<boolean> {
    if (updates.length === 0) return true;

    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const now = new Date();

    await db.transaction(async (tx) => {
      await Promise.all(
        updates.map((item) =>
          tx
            .update(widgets)
            .set({
              position: item.position,
              sortOrder: item.sortOrder,
              updatedAt: now,
            })
            .where(and(eq(widgets.id, item.id), eq(widgets.userId, userId)))
        )
      );
    });

    return true;
  }

  /**
   * Update widget sort order
   */
  async updateSortOrder(orderedIds: string[], userId: string): Promise<number> {
    if (orderedIds.length === 0) return 0;

    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const now = new Date();

    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(widgets)
            .set({ sortOrder: index, updatedAt: now })
            .where(and(eq(widgets.id, id), eq(widgets.userId, userId)))
        )
      );
    });

    return orderedIds.length;
  }

  /**
   * Delete a widget
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { widgets } = await import("@/database/schema");

    const result = await db
      .delete(widgets)
      .where(and(eq(widgets.id, id), eq(widgets.userId, userId)))
      .returning();

    return result.length > 0;
  }
}

// Singleton instance
let widgetRepository: WidgetRepository | null = null;

export function getWidgetRepository(): WidgetRepository {
  if (!widgetRepository) {
    widgetRepository = new WidgetRepository();
  }
  return widgetRepository;
}
