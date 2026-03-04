-- Add app dependencies feature
-- This migration creates the app_dependencies table for tracking app-to-app dependencies

-- Create the dependency type enum
DO $$ BEGIN
    CREATE TYPE "dependency_type" AS ENUM ('required', 'optional', 'weak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the app_dependencies table
CREATE TABLE IF NOT EXISTS "app_dependencies" (
    "id" text PRIMARY KEY NOT NULL,
    "app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
    "depends_on_app_id" text NOT NULL REFERENCES "apps"("id") ON DELETE CASCADE,
    "dependency_type" "dependency_type" DEFAULT 'required' NOT NULL,
    "description" text,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    -- Prevent duplicate dependencies
    CONSTRAINT "unique_app_dependency" UNIQUE ("app_id", "depends_on_app_id"),
    -- Prevent self-references
    CONSTRAINT "no_self_dependency" CHECK ("app_id" != "depends_on_app_id")
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS "idx_app_dependencies_app_id" ON "app_dependencies"("app_id");
CREATE INDEX IF NOT EXISTS "idx_app_dependencies_depends_on_app_id" ON "app_dependencies"("depends_on_app_id");
CREATE INDEX IF NOT EXISTS "idx_app_dependencies_user_id" ON "app_dependencies"("user_id");
