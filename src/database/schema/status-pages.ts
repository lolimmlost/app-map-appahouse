import { pgTable, text, boolean, timestamp, integer, jsonb, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { apps } from "./apps";

/**
 * Status Pages - Public-facing status pages for health monitoring
 * Similar to Uptime Kuma's status page feature
 */
export const statusPages = pgTable("status_pages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Basic info
  title: text("title").notNull(),
  slug: text("slug").notNull(), // URL-friendly identifier
  description: text("description"), // Public description shown on page

  // Owner
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Access control
  isPublic: boolean("is_public").notNull().default(true),
  password: text("password"), // Optional password protection (hashed)

  // Unique access token for sharing
  accessToken: text("access_token").notNull().$defaultFn(() => crypto.randomUUID()),

  // Branding/customization
  branding: jsonb("branding").$type<{
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string; // Hex color
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    showPoweredBy?: boolean;
    customCss?: string;
    headerText?: string;
    footerText?: string;
  }>().default({}),

  // Display options
  displayOptions: jsonb("display_options").$type<{
    showResponseTime?: boolean;
    showUptime?: boolean;
    showLastChecked?: boolean;
    showIncidents?: boolean;
    uptimePercentPeriod?: "24h" | "7d" | "30d" | "90d";
    groupByCategory?: boolean;
    layout?: "list" | "grid" | "compact";
    refreshInterval?: number; // seconds
  }>().default({
    showResponseTime: true,
    showUptime: true,
    showLastChecked: true,
    showIncidents: true,
    uptimePercentPeriod: "30d",
    groupByCategory: true,
    layout: "list",
    refreshInterval: 60,
  }),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("status_pages_user_idx").on(table.userId),
  slugIdx: index("status_pages_slug_idx").on(table.slug),
  accessTokenIdx: index("status_pages_access_token_idx").on(table.accessToken),
  uniqueSlugPerUser: unique("unique_slug_per_user").on(table.userId, table.slug),
}));

/**
 * Status Page Apps - Junction table linking apps to status pages
 */
export const statusPageApps = pgTable("status_page_apps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  statusPageId: text("status_page_id").notNull().references(() => statusPages.id, { onDelete: "cascade" }),
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),

  // Display order on the status page
  sortOrder: integer("sort_order").default(0),

  // Override the app name for public display
  displayName: text("display_name"),

  // Optional custom description for this status page
  publicDescription: text("public_description"),

  // Show/hide this app on the status page
  visible: boolean("visible").notNull().default(true),

  // Group name for organizing apps (optional)
  groupName: text("group_name"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusPageIdx: index("status_page_apps_page_idx").on(table.statusPageId),
  appIdx: index("status_page_apps_app_idx").on(table.appId),
  uniqueAppPerPage: unique("unique_app_per_page").on(table.statusPageId, table.appId),
}));

/**
 * Status Page Incidents - Track incidents/events on status pages
 */
export const statusPageIncidents = pgTable("status_page_incidents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  statusPageId: text("status_page_id").notNull().references(() => statusPages.id, { onDelete: "cascade" }),

  // Affected app (optional - can be a general incident)
  appId: text("app_id").references(() => apps.id, { onDelete: "set null" }),

  // Incident details
  title: text("title").notNull(),
  message: text("message"),
  severity: text("severity", { enum: ["minor", "major", "critical"] }).notNull().default("minor"),
  status: text("status", { enum: ["investigating", "identified", "monitoring", "resolved"] }).notNull().default("investigating"),

  // Timeline
  startedAt: timestamp("started_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),

  // Updates history
  updates: jsonb("updates").$type<Array<{
    id: string;
    message: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    createdAt: string;
  }>>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusPageIdx: index("status_page_incidents_page_idx").on(table.statusPageId),
  appIdx: index("status_page_incidents_app_idx").on(table.appId),
  statusIdx: index("status_page_incidents_status_idx").on(table.status),
}));

// Relations
export const statusPagesRelations = relations(statusPages, ({ one, many }) => ({
  user: one(users, {
    fields: [statusPages.userId],
    references: [users.id],
  }),
  apps: many(statusPageApps),
  incidents: many(statusPageIncidents),
}));

export const statusPageAppsRelations = relations(statusPageApps, ({ one }) => ({
  statusPage: one(statusPages, {
    fields: [statusPageApps.statusPageId],
    references: [statusPages.id],
  }),
  app: one(apps, {
    fields: [statusPageApps.appId],
    references: [apps.id],
  }),
}));

export const statusPageIncidentsRelations = relations(statusPageIncidents, ({ one }) => ({
  statusPage: one(statusPages, {
    fields: [statusPageIncidents.statusPageId],
    references: [statusPages.id],
  }),
  app: one(apps, {
    fields: [statusPageIncidents.appId],
    references: [apps.id],
  }),
}));

// Type exports
export type StatusPage = typeof statusPages.$inferSelect;
export type NewStatusPage = typeof statusPages.$inferInsert;
export type StatusPageApp = typeof statusPageApps.$inferSelect;
export type NewStatusPageApp = typeof statusPageApps.$inferInsert;
export type StatusPageIncident = typeof statusPageIncidents.$inferSelect;
export type NewStatusPageIncident = typeof statusPageIncidents.$inferInsert;

// Branding type for external use
export interface StatusPageBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  showPoweredBy?: boolean;
  customCss?: string;
  headerText?: string;
  footerText?: string;
}

// Display options type for external use
export interface StatusPageDisplayOptions {
  showResponseTime?: boolean;
  showUptime?: boolean;
  showLastChecked?: boolean;
  showIncidents?: boolean;
  uptimePercentPeriod?: "24h" | "7d" | "30d" | "90d";
  groupByCategory?: boolean;
  layout?: "list" | "grid" | "compact";
  refreshInterval?: number;
}
