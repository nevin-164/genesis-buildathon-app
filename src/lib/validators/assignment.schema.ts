import { z } from "zod";

import { optionalUuid, uuid } from "./fields";

/**
 * Advisor routing. Two of these are preventive (they change who *future*
 * internships go to) and one is a repair (it fixes a single stuck row).
 */

/** Blank means "remove the advisor", which is a legitimate thing to want. */
export const classAdvisorSchema = z.object({
  classId: uuid("Choose a class."),
  advisorId: optionalUuid("Choose a valid faculty member."),
});

/** Blank clears the override, and the student falls back to their class advisor. */
export const advisorOverrideSchema = z.object({
  studentId: uuid("Choose a student."),
  advisorId: optionalUuid("Choose a valid faculty member."),
});

/** Blank removes the student from their class, which is representable on purpose. */
export const moveStudentSchema = z.object({
  studentId: uuid("Choose a student."),
  classId: optionalUuid("Choose a valid class."),
});

/** The repair tool. Unlike the two above, a faculty member is mandatory. */
export const assignInternshipSchema = z.object({
  internshipId: uuid("Choose an internship."),
  facultyId: uuid("Choose a faculty member."),
});

export type ClassAdvisorInput = z.output<typeof classAdvisorSchema>;
export type AdvisorOverrideInput = z.output<typeof advisorOverrideSchema>;
export type MoveStudentInput = z.output<typeof moveStudentSchema>;
export type AssignInternshipInput = z.output<typeof assignInternshipSchema>;
