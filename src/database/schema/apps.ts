import { pgTable, text, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { categories } from "./categories";

export const healthCheckTypeEnum = pgEnum("health_check_type", ["http", "tcp", "uptime_kuma"]);

export const apps = pgTable("apps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  localUrl: text("local_url"),
  remoteUrl: text("remote_url"),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0),
  healthCheckEnabled: boolean("health_check_enabled").default(false),
  healthCheckType: healthCheckTypeEnum("health_check_type").default("http"),
  healthCheckUrl: text("health_check_url"),
  uptimeKumaMonitorId: text("uptime_kuma_monitor_id"),
  dockerContainerId: text("docker_container_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appsRelations = relations(apps, ({ one, many }) => ({
  category: one(categories, {
    fields: [apps.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [apps.userId],
    references: [users.id],
  }),
  tags: many(appTags),
}));

export const appTags = pgTable("app_tags", {
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const tags = pgTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  color: text("color").default("#6b7280"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  apps: many(appTags),
}));

export const appTagsRelations = relations(appTags, ({ one }) => ({
  app: one(apps, {
    fields: [appTags.appId],
    references: [apps.id],
  }),
  tag: one(tags, {
    fields: [appTags.tagId],
    references: [tags.id],
  }),
}));

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
