import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const integrationTypeEnum = pgEnum("integration_type", [
  "uptime_kuma",
  "radarr",
  "sonarr",
  "lidarr",
  "jellyfin",
  "docker",
  "proxmox",
  "portainer",
  "glances",
  "truenas",
]);

export const integrations = pgTable("integrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: integrationTypeEnum("type").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  apiKey: text("api_key"),
  username: text("username"),
  password: text("password"),
  enabled: boolean("enabled").default(true),
  allowInsecure: boolean("allow_insecure").default(false),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
