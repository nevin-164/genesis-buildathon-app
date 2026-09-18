import "server-only";

import type { InternshipDetail } from "@/types/contracts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package D (AI internship report).
 *
 * `report.controller.ts` already calls this. Package D replaces the body.
 *
 * Nobody outside package D edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the only file that may import `@anthropic-ai/sdk` — the same rule
 * that confines the Supabase client to `storage.service.ts`. The LLM call is
 * I/O, so it belongs in the service layer; the controller authorises, loads,
 * validates and acts, and knows nothing about which model ran.
 */

/** Bump when the prompt changes materially. Stored on the row. */
export const REPORT_PROMPT_VERSION = 1;

/**
 * Claude Opus 5. Recorded on every generated row so two reports written weeks
 * apart can be told apart.
 */
export const REPORT_MODEL = "claude-opus-5";

export type GeneratedReport = {
  /** Markdown. Rendered as markdown — never injected as raw HTML. */
  content: string;
  model: string;
  promptVersion: number;
};

/**
 * Writes the report from the internship the student already submitted and
 * their advisor already verified.
 *
 * With ANTHROPIC_API_KEY blank this returns a clearly-marked placeholder rather
 * than throwing, so the screen stays demonstrable for the rest of the team.
 * Keep that branch.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The model is given ONLY the fields on this row. It must not invent a grade, a
 * supervisor's name, a company address or a certificate number — the whole
 * premise of InternLens is that a verified record says exactly what was
 * verified, and a report that embellishes it is worse than no report.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Shape of the real body:
 *
 *   const client = new Anthropic();            // reads ANTHROPIC_API_KEY
 *   const response = await client.messages.create({
 *     model: REPORT_MODEL,
 *     max_tokens: 16000,
 *     thinking: { type: "adaptive" },
 *     system: REPORT_SYSTEM_PROMPT,            // the rules above, stated to the model
 *     messages: [{ role: "user", content: facts }],
 *   });
 *   const text = response.content
 *     .filter((b) => b.type === "text")
 *     .map((b) => b.text)
 *     .join("");
 *
 * `response.content` is a discriminated union — narrow on `.type` before
 * reading `.text`, and skip `thinking` blocks. Check `stop_reason` too: a
 * `max_tokens` stop means a truncated report, which should be an error rather
 * than a half-written document saved to the database.
 */
export async function generateInternshipReport(
  internship: InternshipDetail,
): Promise<GeneratedReport> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      content: [
        "# Internship report",
        "",
        "_Report generation is not configured on this deployment._",
        "",
        `**Role.** ${internship.roleTitle} at ${internship.companyName}.`,
        `**Duration.** ${internship.durationWeeks} weeks.`,
        "",
        "Set `ANTHROPIC_API_KEY` to generate the full report.",
      ].join("\n"),
      model: "placeholder",
      promptVersion: REPORT_PROMPT_VERSION,
    };
  }

  throw new Error(
    "ai.service: not implemented — package D owns src/services/ai.service.ts",
  );
}
