import { z } from "zod";

import { uuid } from "./fields";

/**
 * Advisor routing. Both of these are preventive — they change who *future*
 * internships go to, and never touch one already submitted.
 *
 * Neither id is optional. "No advisor" and "no class" used to be expressible
 * here and are now refused by the database itself; a blank select is a
 * mis-filled form, not a request to clear the column.
 */

export const classAdvisorSchema = z.object({
  classId: uuid("Choose a class."),
  advisorId: uuid("Choose a faculty member."),
});

export const moveStudentSchema = z.object({
  studentId: uuid("Choose a student."),
  classId: uuid("Choose a class."),
});

export type ClassAdvisorInput = z.output<typeof classAdvisorSchema>;
export type MoveStudentInput = z.output<typeof moveStudentSchema>;
