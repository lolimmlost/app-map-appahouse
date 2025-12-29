-- Add app access log table for tracking individual app access events
CREATE TABLE IF NOT EXISTS "app_access_log" (
  "id" text PRIMARY KEY,
  "app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessed_at" timestamp DEFAULT now() NOT NULL,
  "access_type" text DEFAULT 'click' CHECK ("access_type" IN ('click', 'open_local', 'open_remote'))
);

-- Create indexes for app_access_log
CREATE INDEX IF NOT EXISTS "app_access_log_app_id_idx" ON "app_access_log"("app_id");
CREATE INDEX IF NOT EXISTS "app_access_log_user_id_idx" ON "app_access_log"("user_id");
CREATE INDEX IF NOT EXISTS "app_access_log_accessed_at_idx" ON "app_access_log"("accessed_at");
CREATE INDEX IF NOT EXISTS "app_access_log_user_app_idx" ON "app_access_log"("user_id", "app_id");

-- Add app usage metrics table for aggregated daily metrics
CREATE TABLE IF NOT EXISTS "app_usage_metrics" (
  "id" text PRIMARY KEY,
  "app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
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

-- Create indexes for app_usage_metrics
CREATE INDEX IF NOT EXISTS "app_usage_metrics_app_id_idx" ON "app_usage_metrics"("app_id");
CREATE INDEX IF NOT EXISTS "app_usage_metrics_user_id_idx" ON "app_usage_metrics"("user_id");
CREATE INDEX IF NOT EXISTS "app_usage_metrics_date_idx" ON "app_usage_metrics"("date");
CREATE INDEX IF NOT EXISTS "app_usage_metrics_user_date_idx" ON "app_usage_metrics"("user_id", "date");
CREATE INDEX IF NOT EXISTS "app_usage_metrics_app_date_idx" ON "app_usage_metrics"("app_id", "date");

-- Create unique constraint for app+user+date combination
CREATE UNIQUE INDEX IF NOT EXISTS "app_usage_metrics_app_user_date_idx" ON "app_usage_metrics"("app_id", "user_id", "date");

-- Add health history table for tracking health check trends
CREATE TABLE IF NOT EXISTS "health_history" (
  "id" text PRIMARY KEY,
  "app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" text NOT NULL CHECK ("status" IN ('online', 'offline', 'unknown')),
  "response_time" integer,
  "error" text,
  "checked_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for health_history
CREATE INDEX IF NOT EXISTS "health_history_app_id_idx" ON "health_history"("app_id");
CREATE INDEX IF NOT EXISTS "health_history_user_id_idx" ON "health_history"("user_id");
CREATE INDEX IF NOT EXISTS "health_history_checked_at_idx" ON "health_history"("checked_at");
CREATE INDEX IF NOT EXISTS "health_history_app_checked_at_idx" ON "health_history"("app_id", "checked_at");
