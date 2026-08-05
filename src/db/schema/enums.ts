import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "faculty", "admin"]);

/** Pre-internship approval lifecycle. */
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "clarification_requested",
  "approved",
  "rejected",
]);

/** Post-internship publication lifecycle. Public only when `verified`. */
export const experienceStatusEnum = pgEnum("experience_status", [
  "draft",
  "submitted",
  "changes_requested",
  "verified",
  "rejected",
]);

/** One vocabulary for both review stages. */
export const reviewActionEnum = pgEnum("review_action", [
  "approve", // application
  "request_clarification", // application
  "verify", // experience
  "request_changes", // experience
  "reject", // both
  "respond", // the student's reply in a clarification thread
]);

/** How a student's advisor was decided. */
export const assignmentSourceEnum = pgEnum("assignment_source", [
  "direct", // student_profiles.advisor_override_id
  "class", // classes.advisor_id
  "manual", // admin filled it in after the fact
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

export const applicationSourceEnum = pgEnum("application_source", [
  "company_website",
  "email",
  "referral",
  "linkedin",
  "job_portal",
  "college",
  "other",
]);

export const evidenceKindEnum = pgEnum("evidence_kind", [
  "offer_letter",
  "completion_certificate",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type ExperienceStatus = (typeof experienceStatusEnum.enumValues)[number];
export type ReviewAction = (typeof reviewActionEnum.enumValues)[number];
export type AssignmentSource = (typeof assignmentSourceEnum.enumValues)[number];
export type WorkMode = (typeof workModeEnum.enumValues)[number];
