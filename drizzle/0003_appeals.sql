--
-- Appeals. `rejected` stops being terminal: a student may contest a rejection
-- once, with extra proof, and an administrator rules on it.
--
-- Additive only, and there is nothing to backfill. `appeal_count` defaults to 0
-- and `appealed_at` stays null on every existing row, which is exactly "nobody
-- has appealed anything yet" — so both CHECKs below validate the existing table
-- without touching a row.
--
-- TWO THINGS HERE LOOK ODD AND ARE LOAD-BEARING.
--
-- 1. The CHECKs compare `status::text`, not `status`. drizzle runs every
--    pending migration inside ONE transaction, and Postgres refuses to use an
--    enum label in the same transaction that added it ("unsafe use of new value
--    of enum type"). The cast sidesteps the literal.
--
-- 2. `internships_appeal_idx` is composite, not the partial index this query
--    actually wants. An index predicate must be IMMUTABLE, and the `::text`
--    trick from (1) is rejected there because `enum_out` is only STABLE — enum
--    labels can be renamed. Leading the index with `status` covers the same
--    query without needing a predicate at all.
--
ALTER TYPE "public"."internship_status" ADD VALUE 'appealed';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'appeal';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'uphold_appeal';--> statement-breakpoint
ALTER TYPE "public"."verification_action" ADD VALUE 'overturn_appeal';--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "appealed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "appeal_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "internships_appeal_idx" ON "internships" USING btree ("status","appealed_at");--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_appeal_dated_ck" CHECK ("internships"."status"::text <> 'appealed' or "internships"."appealed_at" is not null);--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_appeal_count_ck" CHECK ("internships"."appeal_count" >= 0 and "internships"."appeal_count" <= 1);
