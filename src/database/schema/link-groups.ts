import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const linkGroups = pgTable("link_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const links = pgTable("links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  groupId: text("group_id").notNull().references(() => linkGroups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const linkGroupsRelations = relations(linkGroups, ({ one, many }) => ({
  user: one(users, {
    fields: [linkGroups.userId],
    references: [users.id],
  }),
  links: many(links),
}));

export const linksRelations = relations(links, ({ one }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  group: one(linkGroups, {
    fields: [links.groupId],
    references: [linkGroups.id],
  }),
}));

export type LinkGroup = typeof linkGroups.$inferSelect;
export type NewLinkGroup = typeof linkGroups.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
