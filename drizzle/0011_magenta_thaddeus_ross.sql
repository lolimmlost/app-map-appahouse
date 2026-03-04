CREATE TYPE "public"."api_key_scope" AS ENUM('read:apps', 'read:health', 'write:apps', 'read:categories', 'write:categories', 'read:integrations', 'write:integrations', 'trigger:health', 'read:analytics', 'admin');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"scopes" text DEFAULT 'read:apps,read:health' NOT NULL,
	"rate_limit_per_minute" integer DEFAULT 60,
	"rate_limit_per_hour" integer DEFAULT 1000,
	"enabled" boolean DEFAULT true,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"last_used_ip" text,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_type" text NOT NULL,
	"request_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "api_request_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer,
	"response_time" integer,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_rate_limits" ADD CONSTRAINT "api_rate_limits_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;