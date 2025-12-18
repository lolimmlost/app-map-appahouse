CREATE TYPE "public"."health_check_type" AS ENUM('http', 'tcp', 'uptime_kuma');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('uptime_kuma', 'radarr', 'sonarr', 'lidarr', 'jellyfin', 'docker', 'proxmox', 'portainer');--> statement-breakpoint
CREATE TYPE "public"."health_bar_style" AS ENUM('dot', 'border', 'none');--> statement-breakpoint
CREATE TYPE "public"."view_type" AS ENUM('grid', 'list', 'compact');--> statement-breakpoint
CREATE TABLE "app_tags" (
	"app_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"local_url" text,
	"remote_url" text,
	"category_id" text,
	"user_id" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"health_check_enabled" boolean DEFAULT false,
	"health_check_type" "health_check_type" DEFAULT 'http',
	"health_check_url" text,
	"uptime_kuma_monitor_id" text,
	"docker_container_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280',
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text DEFAULT '#6b7280',
	"sort_order" integer DEFAULT 0,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "integration_type" NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"api_key" text,
	"username" text,
	"password" text,
	"enabled" boolean DEFAULT true,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system',
	"custom_theme" jsonb,
	"default_view" "view_type" DEFAULT 'grid',
	"grid_columns" integer DEFAULT 4,
	"show_health_dots" boolean DEFAULT true,
	"health_bar_style" "health_bar_style" DEFAULT 'dot',
	"sidebar_collapsed" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "app_tags" ADD CONSTRAINT "app_tags_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_tags" ADD CONSTRAINT "app_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;