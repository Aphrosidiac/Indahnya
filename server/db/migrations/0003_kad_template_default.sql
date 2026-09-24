ALTER TABLE "kad" ALTER COLUMN "template" SET DEFAULT 'garden';--> statement-breakpoint
-- kads nobody has touched yet take the new default template too
UPDATE "kad" SET "template" = 'garden' WHERE "template" = 'minimal' AND "fields" = '{}'::jsonb;
