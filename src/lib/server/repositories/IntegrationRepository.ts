/**
 * Integration Repository
 *
 * Provides data access operations for integrations.
 * Integrations connect to external services like Uptime Kuma, Radarr, etc.
 */

import { eq, and, asc } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";
import type { Integration, NewIntegration } from "@/database/schema/integrations";

export class IntegrationRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get all integrations for a user
   */
  async findAll(userId: string): Promise<Integration[]> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    return db.query.integrations.findMany({
      where: eq(integrations.userId, userId),
      orderBy: [asc(integrations.name)],
    });
  }

  /**
   * Get a single integration by ID
   */
  async findById(id: string, userId: string): Promise<Integration | null> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .limit(1);

    return integration ?? null;
  }

  /**
   * Get enabled integrations for a user
   */
  async findEnabled(userId: string): Promise<Integration[]> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    return db.query.integrations.findMany({
      where: and(eq(integrations.userId, userId), eq(integrations.enabled, true)),
      orderBy: [asc(integrations.name)],
    });
  }

  /**
   * Get integrations by type
   */
  async findByType(userId: string, type: string): Promise<Integration[]> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    return db.query.integrations.findMany({
      where: and(eq(integrations.userId, userId), eq(integrations.type, type as any)),
      orderBy: [asc(integrations.name)],
    });
  }

  /**
   * Get integrations for alert rule selection (simplified columns)
   */
  async findForAlertRules(userId: string): Promise<Pick<Integration, "id" | "name" | "type" | "enabled">[]> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    return db.query.integrations.findMany({
      where: eq(integrations.userId, userId),
      orderBy: [asc(integrations.name)],
      columns: {
        id: true,
        name: true,
        type: true,
        enabled: true,
      },
    });
  }

  /**
   * Create a new integration
   */
  async create(data: Omit<NewIntegration, "id" | "createdAt" | "updatedAt"> & { userId: string }): Promise<Integration> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    const [created] = await db
      .insert(integrations)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Update an integration
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewIntegration, "id" | "userId" | "createdAt">>
  ): Promise<Integration | null> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    const [updated] = await db
      .update(integrations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete an integration
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const { integrations } = await import("@/database/schema/integrations");

    const result = await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Toggle integration enabled status
   */
  async toggleEnabled(id: string, userId: string, enabled: boolean): Promise<Integration | null> {
    return this.update(id, userId, { enabled });
  }
}

// Singleton instance
let integrationRepository: IntegrationRepository | null = null;

export function getIntegrationRepository(): IntegrationRepository {
  if (!integrationRepository) {
    integrationRepository = new IntegrationRepository();
  }
  return integrationRepository;
}
