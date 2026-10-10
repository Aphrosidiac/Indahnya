ALTER TABLE "payments" RENAME COLUMN "stripe_session_id" TO "chip_purchase_id";--> statement-breakpoint
ALTER INDEX "payments_session_uq" RENAME TO "payments_purchase_uq";--> statement-breakpoint
DROP INDEX "payments_intent_idx";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stripe_payment_intent";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "method" text;
