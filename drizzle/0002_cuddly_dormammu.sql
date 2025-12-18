CREATE TYPE "public"."widget_type" AS ENUM('clock', 'weather', 'system_stats', 'uptime_kuma', 'radarr', 'sonarr', 'lidarr', 'jellyfin', 'docker', 'iframe', 'bookmarks');--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "widget_type" NOT NULL,
	"integration_id" text,
	"position" jsonb DEFAULT '{"x":0,"y":0,"w":2,"h":2}'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;