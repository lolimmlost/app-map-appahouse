CREATE TYPE "public"."dependency_type" AS ENUM('required', 'optional', 'weak');--> statement-breakpoint
CREATE TABLE "app_dependencies" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"depends_on_app_id" text NOT NULL,
	"dependency_type" "dependency_type" DEFAULT 'required' NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_page_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"status_page_id" text NOT NULL,
	"app_id" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"display_name" text,
	"public_description" text,
	"visible" boolean DEFAULT true NOT NULL,
	"group_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_app_per_page" UNIQUE("status_page_id","app_id")
);
--> statement-breakpoint
CREATE TABLE "status_page_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"status_page_id" text NOT NULL,
	"app_id" text,
	"title" text NOT NULL,
	"message" text,
	"severity" text DEFAULT 'minor' NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"updates" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"password" text,
	"access_token" text NOT NULL,
	"branding" jsonb DEFAULT '{}'::jsonb,
	"display_options" jsonb DEFAULT '{"showResponseTime":true,"showUptime":true,"showLastChecked":true,"showIncidents":true,"uptimePercentPeriod":"30d","groupByCategory":true,"layout":"list","refreshInterval":60}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_slug_per_user" UNIQUE("user_id","slug")
);
--> statement-breakpoint
ALTER TABLE "app_dependencies" ADD CONSTRAINT "app_dependencies_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_dependencies" ADD CONSTRAINT "app_dependencies_depends_on_app_id_apps_id_fk" FOREIGN KEY ("depends_on_app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_dependencies" ADD CONSTRAINT "app_dependencies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_page_apps" ADD CONSTRAINT "status_page_apps_status_page_id_status_pages_id_fk" FOREIGN KEY ("status_page_id") REFERENCES "public"."status_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_page_apps" ADD CONSTRAINT "status_page_apps_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_page_incidents" ADD CONSTRAINT "status_page_incidents_status_page_id_status_pages_id_fk" FOREIGN KEY ("status_page_id") REFERENCES "public"."status_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_page_incidents" ADD CONSTRAINT "status_page_incidents_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_pages" ADD CONSTRAINT "status_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "status_page_apps_page_idx" ON "status_page_apps" USING btree ("status_page_id");--> statement-breakpoint
CREATE INDEX "status_page_apps_app_idx" ON "status_page_apps" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "status_page_incidents_page_idx" ON "status_page_incidents" USING btree ("status_page_id");--> statement-breakpoint
CREATE INDEX "status_page_incidents_app_idx" ON "status_page_incidents" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "status_page_incidents_status_idx" ON "status_page_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "status_pages_user_idx" ON "status_pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_pages_slug_idx" ON "status_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_pages_access_token_idx" ON "status_pages" USING btree ("access_token");