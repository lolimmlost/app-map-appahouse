import { pgTable, text, boolean, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const viewTypeEnum = pgEnum("view_type", ["grid", "list", "compact"]);
export const healthBarStyleEnum = pgEnum("health_bar_style", ["dot", "border", "none"]);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system"),
  customTheme: jsonb("custom_theme"),
  defaultView: viewTypeEnum("default_view").default("grid"),
  gridColumns: integer("grid_columns").default(4),
  showHealthDots: boolean("show_health_dots").default(true),
  healthBarStyle: healthBarStyleEnum("health_bar_style").default("dot"),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  searxngEnabled: boolean("searxng_enabled").default(false),
  searxngUrl: text("searxng_url"),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
