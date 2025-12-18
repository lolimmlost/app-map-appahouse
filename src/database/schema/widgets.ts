import { pgTable, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { integrations } from "./integrations";

export const widgetTypeEnum = pgEnum("widget_type", [
  "clock",
  "weather",
  "system_stats",
  "uptime_kuma",
  "radarr",
  "sonarr",
  "lidarr",
  "jellyfin",
  "docker",
  "iframe",
  "bookmarks",
  "notes",
]);

export type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WidgetConfig = {
  // Clock widget
  timezone?: string;
  showSeconds?: boolean;
  format24h?: boolean;
  // Weather widget
  location?: string;
  units?: "metric" | "imperial";
  // Uptime Kuma widget
  statusPageSlug?: string;
  showOnlyDown?: boolean;
  // *arr widgets
  showQueue?: boolean;
  showCalendar?: boolean;
  maxItems?: number;
  // Jellyfin widget
  showNowPlaying?: boolean;
  showRecentlyAdded?: boolean;
  // Docker widget
  showContainers?: string[];
  // Iframe widget
  url?: string;
  // Bookmarks widget
  bookmarks?: Array<{ name: string; url: string; icon?: string }>;
  // Notes widget
  content?: string;
  // Generic
  title?: string;
  refreshInterval?: number;
};

export const widgets = pgTable("widgets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: widgetTypeEnum("type").notNull(),
  integrationId: text("integration_id").references(() => integrations.id, { onDelete: "set null" }),
  position: jsonb("position").$type<WidgetPosition>().notNull().default({ x: 0, y: 0, w: 2, h: 2 }),
  config: jsonb("config").$type<WidgetConfig>().default({}),
  sortOrder: integer("sort_order").default(0),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetsRelations = relations(widgets, ({ one }) => ({
  user: one(users, {
    fields: [widgets.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [widgets.integrationId],
    references: [integrations.id],
  }),
}));

export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;
