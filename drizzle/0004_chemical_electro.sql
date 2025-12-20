ALTER TYPE "public"."integration_type" ADD VALUE 'truenas';--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "truenas_app_id" text;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "discovery_source" text;