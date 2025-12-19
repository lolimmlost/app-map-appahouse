ALTER TYPE "public"."integration_type" ADD VALUE 'glances';--> statement-breakpoint
ALTER TYPE "public"."widget_type" ADD VALUE 'notes';--> statement-breakpoint
ALTER TABLE "app_tags" ADD CONSTRAINT "app_tags_app_id_tag_id_pk" PRIMARY KEY("app_id","tag_id");--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "pinned" boolean DEFAULT false;