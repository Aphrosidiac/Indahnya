ALTER TABLE "events" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
UPDATE "events" SET "deleted_at" = coalesce("purged_at", now()) WHERE "slug" LIKE 'deleted-%';
