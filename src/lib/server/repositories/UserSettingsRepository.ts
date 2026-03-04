/**
 * User Settings Repository
 *
 * Provides data access operations for user settings.
 * Settings store UI preferences like theme, view mode, etc.
 */

import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "./BaseRepository";

// Define the settings type locally to avoid circular imports
export interface UserSettings {
  id: string;
  userId: string;
  defaultView: "grid" | "list" | "compact";
  gridColumns: number;
  showHealthDots: boolean;
  healthBarStyle: "dot" | "border" | "none";
  theme: string;
  customTheme: Record<string, string> | null;
  createdAt: Date;
}

export interface NewUserSettings {
  userId: string;
  defaultView?: "grid" | "list" | "compact";
  gridColumns?: number;
  showHealthDots?: boolean;
  healthBarStyle?: "dot" | "border" | "none";
  theme?: string;
  customTheme?: Record<string, string> | null;
}

export class UserSettingsRepository {
  protected async getDb(): Promise<DatabaseInstance> {
    const { getDb } = await import("../get-db");
    return getDb();
  }

  /**
   * Get settings for a user
   */
  async findByUserId(userId: string): Promise<UserSettings | null> {
    const db = await this.getDb();
    const { userSettings } = await import("@/database/schema/user-settings");

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return (settings as UserSettings) ?? null;
  }

  /**
   * Update or create user settings
   */
  async upsert(
    userId: string,
    data: Partial<Omit<NewUserSettings, "userId">>
  ): Promise<UserSettings> {
    const db = await this.getDb();
    const { userSettings } = await import("@/database/schema/user-settings");

    const existing = await this.findByUserId(userId);

    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({
          defaultView: data.defaultView,
          gridColumns: data.gridColumns,
          showHealthDots: data.showHealthDots,
          healthBarStyle: data.healthBarStyle,
          theme: data.theme,
          customTheme: data.customTheme,
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      return updated as UserSettings;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({
          userId,
          defaultView: data.defaultView ?? "grid",
          gridColumns: data.gridColumns ?? 4,
          showHealthDots: data.showHealthDots ?? true,
          healthBarStyle: data.healthBarStyle ?? "dot",
          theme: data.theme ?? "system",
          customTheme: data.customTheme,
        })
        .returning();

      return created as UserSettings;
    }
  }

  /**
   * Update a specific setting
   */
  async updateSetting<K extends keyof Omit<NewUserSettings, "userId">>(
    userId: string,
    key: K,
    value: NewUserSettings[K]
  ): Promise<UserSettings | null> {
    const db = await this.getDb();
    const { userSettings } = await import("@/database/schema/user-settings");

    const existing = await this.findByUserId(userId);

    if (!existing) return null;

    const [updated] = await db
      .update(userSettings)
      .set({ [key]: value })
      .where(eq(userSettings.userId, userId))
      .returning();

    return (updated as UserSettings) ?? null;
  }
}

// Singleton instance
let userSettingsRepository: UserSettingsRepository | null = null;

export function getUserSettingsRepository(): UserSettingsRepository {
  if (!userSettingsRepository) {
    userSettingsRepository = new UserSettingsRepository();
  }
  return userSettingsRepository;
}
