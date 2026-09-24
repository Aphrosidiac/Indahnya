ALTER TABLE "messages" ADD COLUMN "audio_key" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "audio_src_key" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "duration_sec" integer;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "phone_key" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "source" text DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "rsvps_guest_idx" ON "rsvps" USING btree ("event_id","guest_id");--> statement-breakpoint
CREATE INDEX "rsvps_phone_idx" ON "rsvps" USING btree ("event_id","phone_key");