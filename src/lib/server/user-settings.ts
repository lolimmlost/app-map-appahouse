import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/database/db";
import { userSettings, type UserSettings } from "@/database/schema/user-settings";
import { auth } from "@/lib/auth";

// Get user settings
export const getUserSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const request = getRequest();
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        return { settings: null };
      }

      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, session.user.id))
        .limit(1);

      return { settings: settings ?? null };
    } catch (error) {
      console.error("Error fetching user settings:", error);
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
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

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
