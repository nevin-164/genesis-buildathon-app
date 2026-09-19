--
-- Company verdicts. The student who wrote the Reality Card says, in the same
-- breath, whether they would send a junior to that company at all.
--
-- Additive, and there is nothing to backfill. NULL is a real answer here and it
-- means "this card was written before we asked" — which is exactly right for
-- every existing row, and which the roll-up skips rather than counting as
-- either a recommendation or a warning.
--
-- The index is PARTIAL, which the appeal queue in 0003 could not be. The
-- obstacle there was never the predicate itself but its timing: an index
-- predicate must be IMMUTABLE, and `status = 'appealed'` could not be written
-- in the very migration that added the `appealed` label. `'verified'` has
-- existed since 0000_init, so it can be used freely here.
--
-- It covers the only query this column serves — count `recommends_company`
-- grouped by `company_id`, over published rows — without a heap fetch.
--
ALTER TABLE "internships" ADD COLUMN "recommends_company" boolean;--> statement-breakpoint
CREATE INDEX "internships_company_verdict_idx" ON "internships" USING btree ("company_id","recommends_company") WHERE status = 'verified';
