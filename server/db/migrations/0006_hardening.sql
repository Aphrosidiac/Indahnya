CREATE TABLE "heartbeats" (
	"name" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNLOGGED TABLE "rate_limits" (
	"key" text NOT NULL,
	"bucket" bigint NOT NULL,
	"n" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_bucket_pk" PRIMARY KEY("key","bucket")
);
--> statement-breakpoint
CREATE TABLE "slug_history" (
	"slug" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "jobs_queue_idx";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "purge_after" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "purge_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "lane" text DEFAULT 'photo' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "mid_key" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "upload_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "needs_refund" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_payment_intent" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "slug_history" ADD CONSTRAINT "slug_history_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "slug_history_event_idx" ON "slug_history" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_members_user_idx" ON "event_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "jobs" USING btree ("lane","priority","run_after") WHERE "jobs"."done_at" is null;--> statement-breakpoint
CREATE INDEX "jobs_ref_idx" ON "jobs" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "media_event_status_id_idx" ON "media" USING btree ("event_id","status","id");--> statement-breakpoint
CREATE INDEX "media_guest_idx" ON "media" USING btree ("guest_id","status");--> statement-breakpoint
CREATE INDEX "messages_guest_idx" ON "messages" USING btree ("guest_id","status");--> statement-breakpoint
CREATE INDEX "payments_event_idx" ON "payments" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "payments_intent_idx" ON "payments" USING btree ("stripe_payment_intent");--> statement-breakpoint
CREATE INDEX "reactions_guest_idx" ON "reactions" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "rsvps_guest_idx" ON "rsvps" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tables_event_idx" ON "tables" USING btree ("event_id");--> statement-breakpoint
-- sessions and sign-in links are now looked up by the SHA-256 of their token: the raw ones stored so far can never match again
DELETE FROM "sessions";--> statement-breakpoint
DELETE FROM "login_tokens";--> statement-breakpoint
-- majlis deleted before the 7-day undo existed were purged at once; keep that for them
UPDATE "events" SET "purge_after" = "deleted_at" WHERE "deleted_at" IS NOT NULL AND "purge_after" IS NULL;--> statement-breakpoint
UPDATE "jobs" SET "lane" = 'maint' WHERE "kind" IN ('purge_event', 'kad_gc');--> statement-breakpoint
UPDATE "jobs" SET "lane" = 'video' FROM "media" WHERE "jobs"."kind" = 'process_media' AND "jobs"."ref" = "media"."id" AND "media"."kind" = 'video';