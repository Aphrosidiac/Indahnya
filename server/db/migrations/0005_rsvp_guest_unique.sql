-- keep the newest reply per browser before the unique index can exist
DELETE FROM "rsvps" a USING "rsvps" b WHERE a."event_id" = b."event_id" AND a."guest_id" = b."guest_id" AND a."guest_id" IS NOT NULL AND (a."updated_at", a."id") < (b."updated_at", b."id");--> statement-breakpoint
DROP INDEX "rsvps_guest_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_guest_uq" ON "rsvps" USING btree ("event_id","guest_id") WHERE "rsvps"."guest_id" is not null;