import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { apps } from "./apps";
import { users } from "./auth";

/**
 * Dependency type enum - defines the strength/importance of the dependency
 * - required: App cannot function without the dependency
 * - optional: App can function but with reduced functionality
 * - weak: App has minimal dependency (informational)
 */
export const dependencyTypeEnum = pgEnum("dependency_type", ["required", "optional", "weak"]);

/**
 * App Dependencies table - tracks which apps depend on other apps
 * For example, Overseerr depends on Radarr and Sonarr
 */
export const appDependencies = pgTable("app_dependencies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // The app that has the dependency (dependent)
  appId: text("app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  // The app that is depended upon (dependency)
  dependsOnAppId: text("depends_on_app_id").notNull().references(() => apps.id, { onDelete: "cascade" }),
  // Type of dependency
  dependencyType: dependencyTypeEnum("dependency_type").default("required").notNull(),
  // Optional description of why this dependency exists
  description: text("description"),
  // User who owns this dependency relationship
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appDependenciesRelations = relations(appDependencies, ({ one }) => ({
  // The app that has dependencies
  app: one(apps, {
    fields: [appDependencies.appId],
    references: [apps.id],
    relationName: "appDependencies",
  }),
  // The app that is depended upon
  dependsOnApp: one(apps, {
    fields: [appDependencies.dependsOnAppId],
    references: [apps.id],
    relationName: "appDependents",
  }),
  user: one(users, {
    fields: [appDependencies.userId],
    references: [users.id],
  }),
}));

export type AppDependency = typeof appDependencies.$inferSelect;
export type NewAppDependency = typeof appDependencies.$inferInsert;
export type DependencyType = "required" | "optional" | "weak";
