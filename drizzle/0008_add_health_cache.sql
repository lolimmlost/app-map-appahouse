-- Add healthCheckTTL column to apps table
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "health_check_ttl" integer DEFAULT 60;

-- Create health_cache table
CREATE TABLE IF NOT EXISTS "health_cache" (
  "id" text PRIMARY KEY,
  "app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" text NOT NULL CHECK ("status" IN ('online', 'offline', 'unknown')),
  "response_time" integer,
  "error" text,
  "last_checked" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "health_cache_app_id_idx" ON "health_cache"("app_id");
CREATE INDEX IF NOT EXISTS "health_cache_user_id_idx" ON "health_cache"("user_id");
CREATE INDEX IF NOT EXISTS "health_cache_expires_at_idx" ON "health_cache"("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "health_cache_app_user_idx" ON "health_cache"("app_id", "user_id");
