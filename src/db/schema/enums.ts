import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "faculty", "admin"]);

/**
 * The identity providers a user may link. Adding one is a migration, which is
 * the point — a provider is a redirect URI, a client secret and a callback
 * handler, not a string someone can pass in.
 */
export const oauthProviderEnum = pgEnum("oauth_provider", ["google", "github"]);

/** The one lifecycle. Public only when `verified`. */
export const internshipStatusEnum = pgEnum("internship_status", [
  "draft",
  "submitted",
  "changes_requested",
  "verified",
  "rejected",
]);

/** Everything that can happen in a verification thread. */
export const verificationActionEnum = pgEnum("verification_action", [
  "verify", // the advisor publishes it
  "request_changes", // back to the student, reason required
  "reject", // reason required
  "respond", // the student's reply, reason required
]);

/**
 * How a student's advisor was decided.
 *
 * Only `class` is ever written now — resolution is one hop, student → class →
 * advisor. `direct` (a per-student override) and `manual` (an admin attaching
 * one after the fact) belong to rows created before those routes existed, and
 * the values stay so that history keeps reading correctly.
 */
export const assignmentSourceEnum = pgEnum("assignment_source", [
  "direct", // historical: the dropped student_profiles.advisor_override_id
  "class", // classes.advisor_id — the only source written today
  "manual", // historical: the removed admin repair queue
]);

export const workModeEnum = pgEnum("work_mode", ["remote", "hybrid", "onsite"]);

export const workNatureEnum = pgEnum("work_nature", [
  "training_only",
  "guided_project",
  "real_work",
]);

export const mentorFrequencyEnum = pgEnum("mentor_frequency", [
  "daily",
  "weekly",
  "occasional",
  "never",
]);

/**
 * How the student applied TO THE COMPANY — not an internal approval stage.
 * There is no approval stage; this is a Reality Card field, and one of the most
 * useful ones, because it tells a junior how people actually get in.
 */
export const applicationSourceEnum = pgEnum("application_source", [
  "company_website",
  "email",
  "referral",
  "linkedin",
  "job_portal",
  "college",
  "other",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type OAuthProvider = (typeof oauthProviderEnum.enumValues)[number];
export type InternshipStatus = (typeof internshipStatusEnum.enumValues)[number];
export type VerificationAction = (typeof verificationActionEnum.enumValues)[number];
export type AssignmentSource = (typeof assignmentSourceEnum.enumValues)[number];
export type WorkMode = (typeof workModeEnum.enumValues)[number];
export type WorkNature = (typeof workNatureEnum.enumValues)[number];
export type MentorFrequency = (typeof mentorFrequencyEnum.enumValues)[number];
export type ApplicationSource = (typeof applicationSourceEnum.enumValues)[number];
