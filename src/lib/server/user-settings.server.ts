import { createServerFn } from "@tanstack/react-start";
import { serverLogger } from "./logger";

// Create a child logger for user settings module
const log = serverLogger.child({ module: "user-settings" });

// Get user settings
export const getUserSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { userSettings } = await import("@/database/schema/user-settings");

    try {
      const session = await getOptionalSession();

      if (!session) {
        return { settings: null };
      }

      const db = await getDb();
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, session.user.id))
        .limit(1);

      return { settings: settings ?? null };
    } catch (error) {
      log.logError(error, "Error fetching user settings");
      return { settings: null };
    }
  }
);

type UpdateUserSettingsData = {
  data: {
    defaultView?: "grid" | "list" | "compact";
    gridColumns?: number;
    showHealthDots?: boolean;
    healthBarStyle?: "dot" | "border" | "none";
    theme?: string;
    customTheme?: Record<string, string>;
  };
};

// Create or update user settings
export const updateUserSettings = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateUserSettingsData) => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { userSettings } = await import("@/database/schema/user-settings");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { data } = ctx;

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (existing) {
      // Update
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
        .where(eq(userSettings.userId, session.user.id))
        .returning();
      return { settings: updated };
    } else {
      // Create
      const [created] = await db
        .insert(userSettings)
        .values({
          userId: session.user.id,
          defaultView: data.defaultView ?? "grid",
          gridColumns: data.gridColumns ?? 4,
          showHealthDots: data.showHealthDots ?? true,
          healthBarStyle: data.healthBarStyle ?? "dot",
          theme: data.theme ?? "system",
          customTheme: data.customTheme,
        })
        .returning();
      return { settings: created };
    }
  }
);
