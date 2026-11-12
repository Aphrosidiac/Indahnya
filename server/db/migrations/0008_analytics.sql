CREATE TABLE "collector_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"ok" boolean NOT NULL,
	"detail" text,
	"rows" integer DEFAULT 0 NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_daily" (
	"engine" text NOT NULL,
	"date" text NOT NULL,
	"query" text NOT NULL,
	"page" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "search_daily_engine_date_query_page_pk" PRIMARY KEY("engine","date","query","page")
);
--> statement-breakpoint
CREATE TABLE "traffic_cursor" (
	"id" text PRIMARY KEY NOT NULL,
	"inode" bigint NOT NULL,
	"offset" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_daily" (
	"date" text NOT NULL,
	"host" text NOT NULL,
	"grp" text NOT NULL,
	"class" text NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "traffic_daily_date_host_grp_class_pk" PRIMARY KEY("date","host","grp","class")
);
--> statement-breakpoint
CREATE TABLE "traffic_hits" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"host" text NOT NULL,
	"grp" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"ms" integer DEFAULT 0 NOT NULL,
	"country" text,
	"ref_host" text,
	"kind" text NOT NULL,
	"class" text NOT NULL,
	"agent" text,
	"verified" text DEFAULT 'n/a' NOT NULL,
	"visitor" text NOT NULL,
	"ip" text,
	"ua" text DEFAULT '' NOT NULL,
	"beacon" boolean DEFAULT false NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "traffic_salts" (
	"day" text PRIMARY KEY NOT NULL,
	"salt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_staff_ips" (
	"ip" text PRIMARY KEY NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_landing" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_ref_host" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_utm_source" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_channel" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_seen_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "search_daily_engine_idx" ON "search_daily" USING btree ("engine","date");--> statement-breakpoint
CREATE INDEX "traffic_hits_at_idx" ON "traffic_hits" USING btree ("at");--> statement-breakpoint
CREATE INDEX "traffic_hits_kind_idx" ON "traffic_hits" USING btree ("grp","kind","at");--> statement-breakpoint
CREATE INDEX "traffic_hits_class_idx" ON "traffic_hits" USING btree ("class","at");--> statement-breakpoint
CREATE INDEX "traffic_hits_visitor_idx" ON "traffic_hits" USING btree ("visitor","at");