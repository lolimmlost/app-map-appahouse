import { pgTable, text, boolean, timestamp, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./auth";
import { apps } from "./apps";
import { categories } from "./categories";

// Permission levels for shared apps
export const sharingPermissionEnum = pgEnum("sharing_permission", [
  "view",        // Can view the app details only
  "view_health", // Can view + see health status
  "view_urls",   // Can view + access remote URL
  "edit",        // Can edit app details (but not delete or share)
  "full",        // Full access including delete (but not share)
]);

// Types of shares - app or category
export const shareTypeEnum = pgEnum("share_type", ["app", "category"]);

// App sharing table - tracks shared apps/categories between users
export const appShares = pgTable("app_shares", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // The type of share (app or category)
  shareType: shareTypeEnum("share_type").notNull().default("app"),

  // The app being shared (nullable if sharing a category)
  appId: text("app_id").references(() => apps.id, { onDelete: "cascade" }),

  // The category being shared (nullable if sharing an app)
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }),

  // The user who owns the app/category and is sharing it
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // The user who the app/category is shared with
  sharedWithId: text("shared_with_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Permission level
  permission: sharingPermissionEnum("permission").notNull().default("view"),

  // Granular permissions (override the permission level)
  canView: boolean("can_view").notNull().default(true),
  canEdit: boolean("can_edit").notNull().default(false),
  canSeeHealth: boolean("can_see_health").notNull().default(false),
  canAccessRemoteUrl: boolean("can_access_remote_url").notNull().default(false),
  canAccessLocalUrl: boolean("can_access_local_url").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for efficient lookups
  ownerIdx: index("app_shares_owner_idx").on(table.ownerId),
  sharedWithIdx: index("app_shares_shared_with_idx").on(table.sharedWithId),
  appIdx: index("app_shares_app_idx").on(table.appId),
  categoryIdx: index("app_shares_category_idx").on(table.categoryId),
  // Unique constraint for app shares (app_id + shared_with_id must be unique when app_id is not null)
  uniqueAppShare: unique("unique_app_share").on(table.appId, table.sharedWithId),
  // Unique constraint for category shares (category_id + shared_with_id must be unique when category_id is not null)
  uniqueCategoryShare: unique("unique_category_share").on(table.categoryId, table.sharedWithId),
}));

// Relations for app shares
export const appSharesRelations = relations(appShares, ({ one }) => ({
  app: one(apps, {
    fields: [appShares.appId],
    references: [apps.id],
  }),
  category: one(categories, {
    fields: [appShares.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [appShares.ownerId],
    references: [users.id],
    relationName: "shareOwner",
  }),
  sharedWith: one(users, {
    fields: [appShares.sharedWithId],
    references: [users.id],
    relationName: "shareRecipient",
  }),
}));

// Type exports
export type AppShare = typeof appShares.$inferSelect;
export type NewAppShare = typeof appShares.$inferInsert;
export type SharingPermission = "view" | "view_health" | "view_urls" | "edit" | "full";

// Helper type for granular permissions
export interface GranularPermissions {
  canView: boolean;
  canEdit: boolean;
  canSeeHealth: boolean;
  canAccessRemoteUrl: boolean;
  canAccessLocalUrl: boolean;
  canDelete: boolean;
}

// Permission level presets
export const PERMISSION_PRESETS: Record<SharingPermission, GranularPermissions> = {
  view: {
    canView: true,
    canEdit: false,
    canSeeHealth: false,
    canAccessRemoteUrl: false,
    canAccessLocalUrl: false,
    canDelete: false,
  },
  view_health: {
    canView: true,
    canEdit: false,
    canSeeHealth: true,
    canAccessRemoteUrl: false,
    canAccessLocalUrl: false,
    canDelete: false,
  },
  view_urls: {
    canView: true,
    canEdit: false,
    canSeeHealth: true,
    canAccessRemoteUrl: true,
    canAccessLocalUrl: true,
    canDelete: false,
  },
  edit: {
    canView: true,
    canEdit: true,
    canSeeHealth: true,
    canAccessRemoteUrl: true,
    canAccessLocalUrl: true,
    canDelete: false,
  },
  full: {
    canView: true,
    canEdit: true,
    canSeeHealth: true,
    canAccessRemoteUrl: true,
    canAccessLocalUrl: true,
    canDelete: true,
  },
};
