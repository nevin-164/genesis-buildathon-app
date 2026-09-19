--
-- Appeals. `rejected` stops being terminal: a student may contest a rejection
-- once, with extra proof, and an administrator rules on it.
--
-- Every predicate below compares `status::text` rather than the enum value.
-- drizzle-kit runs a migration inside ONE transaction, and Postgres refuses to
-- use an enum label in the same transaction that added it ("unsafe use of new
-- value of enum type"). The cast is what lets the ALTER TYPE and the CHECK that
-- depends on it ship together instead of as two migrations.
--
-- No backfill needed: `appeal_count` defaults to 0 and `appealed_at` is null on
-- every existing row, which is exactly "nobody has appealed anything yet".
--
ALTER TYPE "public"."internship_status" ADD VALUE 'appealed';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'appeal';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'uphold_appeal';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'overturn_appeal';--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "appealed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "appeal_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "internships_appeal_idx" ON "internships" USING btree ("appealed_at") WHERE status::text = 'appealed';--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_appeal_dated_ck" CHECK ("internships"."status"::text <> 'appealed' or "internships"."appealed_at" is not null);--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_appeal_count_ck" CHECK ("internships"."appeal_count" >= 0 and "internships"."appeal_count" <= 1);
