CREATE TYPE "public"."share_type" AS ENUM('app', 'category');--> statement-breakpoint
CREATE TYPE "public"."sharing_permission" AS ENUM('view', 'view_health', 'view_urls', 'edit', 'full');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('active', 'resolved', 'acknowledged', 'silenced');--> statement-breakpoint
CREATE TYPE "public"."alert_trigger_type" AS ENUM('status_change', 'consecutive_failures', 'response_time', 'integration_status');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'webhook', 'in_app');--> statement-breakpoint
CREATE TABLE "health_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"response_time" integer,
	"error" text,
	"last_checked" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"share_type" "share_type" DEFAULT 'app' NOT NULL,
	"app_id" text,
	"category_id" text,
	"owner_id" text NOT NULL,
	"shared_with_id" text NOT NULL,
	"permission" "sharing_permission" DEFAULT 'view' NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_see_health" boolean DEFAULT false NOT NULL,
	"can_access_remote_url" boolean DEFAULT false NOT NULL,
	"can_access_local_url" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_app_share" UNIQUE("app_id","shared_with_id"),
	CONSTRAINT "unique_category_share" UNIQUE("category_id","shared_with_id")
);
--> statement-breakpoint
CREATE TABLE "app_access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"access_type" text DEFAULT 'click'
);
--> statement-breakpoint
CREATE TABLE "app_usage_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	"total_health_checks" integer DEFAULT 0,
	"successful_health_checks" integer DEFAULT 0,
	"failed_health_checks" integer DEFAULT 0,
	"total_response_time" integer DEFAULT 0,
	"min_response_time" integer,
	"max_response_time" integer,
	"uptime_percentage" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_history" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"response_time" integer,
	"error" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"alert_rule_id" text,
	"alert_name" text NOT NULL,
	"trigger_type" "alert_trigger_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"app_id" text,
	"app_name" text,
	"integration_id" text,
	"integration_name" text,
	"status" "alert_status" DEFAULT 'active',
	"message" text NOT NULL,
	"details" jsonb,
	"resolved_at" timestamp,
	"resolved_by" text,
	"acknowledged_at" timestamp,
	"notifications_sent" jsonb,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true,
	"trigger_type" "alert_trigger_type" NOT NULL,
	"app_id" text,
	"integration_id" text,
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"severity" "alert_severity" DEFAULT 'warning',
	"channels" jsonb DEFAULT '{"inApp":true}'::jsonb,
	"cooldown_minutes" integer DEFAULT 15,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"alert_history_id" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "alert_severity" DEFAULT 'info',
	"link_type" text,
	"link_id" text,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"dismissed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"global_enabled" boolean DEFAULT true,
	"email_enabled" boolean DEFAULT false,
	"email_address" text,
	"email_verified" boolean DEFAULT false,
	"webhook_enabled" boolean DEFAULT false,
	"webhook_url" text,
	"webhook_secret" text,
	"webhook_headers" jsonb,
	"in_app_enabled" boolean DEFAULT true,
	"in_app_sound" boolean DEFAULT true,
	"quiet_hours_enabled" boolean DEFAULT false,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"timezone" text DEFAULT 'UTC',
	"digest_enabled" boolean DEFAULT false,
	"digest_frequency" text DEFAULT 'daily',
	"last_digest_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "health_check_ttl" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "health_cache" ADD CONSTRAINT "health_cache_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_cache" ADD CONSTRAINT "health_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_shares" ADD CONSTRAINT "app_shares_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_shares" ADD CONSTRAINT "app_shares_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_shares" ADD CONSTRAINT "app_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_shares" ADD CONSTRAINT "app_shares_shared_with_id_users_id_fk" FOREIGN KEY ("shared_with_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_access_log" ADD CONSTRAINT "app_access_log_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_access_log" ADD CONSTRAINT "app_access_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_usage_metrics" ADD CONSTRAINT "app_usage_metrics_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_usage_metrics" ADD CONSTRAINT "app_usage_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_history" ADD CONSTRAINT "health_history_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_history" ADD CONSTRAINT "health_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_alert_history_id_alert_history_id_fk" FOREIGN KEY ("alert_history_id") REFERENCES "public"."alert_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_shares_owner_idx" ON "app_shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "app_shares_shared_with_idx" ON "app_shares" USING btree ("shared_with_id");--> statement-breakpoint
CREATE INDEX "app_shares_app_idx" ON "app_shares" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "app_shares_category_idx" ON "app_shares" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "app_access_log_app_id_idx" ON "app_access_log" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "app_access_log_user_id_idx" ON "app_access_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_access_log_accessed_at_idx" ON "app_access_log" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "app_access_log_user_app_idx" ON "app_access_log" USING btree ("user_id","app_id");--> statement-breakpoint
CREATE INDEX "app_usage_metrics_app_id_idx" ON "app_usage_metrics" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "app_usage_metrics_user_id_idx" ON "app_usage_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_usage_metrics_date_idx" ON "app_usage_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "app_usage_metrics_user_date_idx" ON "app_usage_metrics" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "app_usage_metrics_app_date_idx" ON "app_usage_metrics" USING btree ("app_id","date");--> statement-breakpoint
CREATE INDEX "health_history_app_id_idx" ON "health_history" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "health_history_user_id_idx" ON "health_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "health_history_checked_at_idx" ON "health_history" USING btree ("checked_at");--> statement-breakpoint
CREATE INDEX "health_history_app_checked_at_idx" ON "health_history" USING btree ("app_id","checked_at");--> statement-breakpoint
CREATE INDEX "alert_history_user_id_idx" ON "alert_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_history_alert_rule_id_idx" ON "alert_history" USING btree ("alert_rule_id");--> statement-breakpoint
CREATE INDEX "alert_history_status_idx" ON "alert_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alert_history_triggered_at_idx" ON "alert_history" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_rules_app_id_idx" ON "alert_rules" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "alert_rules_enabled_idx" ON "alert_rules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "in_app_notifications_user_id_idx" ON "in_app_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "in_app_notifications_read_idx" ON "in_app_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "in_app_notifications_created_at_idx" ON "in_app_notifications" USING btree ("created_at");