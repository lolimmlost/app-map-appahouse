import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

// Type for the filter configuration stored in savedViews
export type SearchViewFilters = {
  searchQuery?: string;
  categoryIds?: string[];
  tagIds?: string[];
  healthStatus?: "all" | "enabled" | "disabled";
  pinnedOnly?: boolean;
  discoverySource?: string | null;
};

export const savedViews = pgTable("saved_views", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").$type<SearchViewFilters>().notNull(),
  isDefault: boolean("is_default").default(false),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savedViewsRelations = relations(savedViews, ({ one }) => ({
  user: one(users, {
    fields: [savedViews.userId],
    references: [users.id],
  }),
}));

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;
