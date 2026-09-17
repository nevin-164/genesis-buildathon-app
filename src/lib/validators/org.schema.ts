import { z } from "zod";

import { text, upperCode, uuid, year } from "./fields";

/**
 * The department → batch → class tree.
 *
 * Uniqueness is not checked here — it is a unique index in Postgres, and
 * `rethrowAsFieldError` turns the violation into a field error. A read-then-write
 * check in the controller would still lose a race with a second admin.
 */

export const departmentSchema = z.object({
  code: upperCode(2, 10, "Code must be 2 to 10 characters."),
  name: text(2, 120, "Name must be 2 to 120 characters."),
});

export const batchSchema = z
  .object({
    departmentId: uuid("Choose a department."),
    name: text(2, 40, "Name must be 2 to 40 characters."),
    startYear: year(),
    endYear: year(),
  })
  .superRefine((value, ctx) => {
    if (value.endYear <= value.startYear) {
      ctx.addIssue({
        code: "custom",
        path: ["endYear"],
        message: "End year must be after the start year.",
      });
    }
  });

/**
 * A class cannot exist without a faculty advisor. It is the level that decides
 * who reviews its students' work, so a class with nobody on it is a class whose
 * students cannot submit — the database enforces this too.
 */
export const classSchema = z.object({
  batchId: uuid("Choose a batch."),
  name: text(1, 40, "Name must be 1 to 40 characters."),
  advisorId: uuid("Choose a faculty advisor."),
});

export const classUpdateSchema = z.object({
  name: text(1, 40, "Name must be 1 to 40 characters."),
  advisorId: uuid("Choose a faculty advisor."),
});

export type DepartmentInput = z.output<typeof departmentSchema>;
export type BatchInput = z.output<typeof batchSchema>;
export type ClassInput = z.output<typeof classSchema>;
export type ClassUpdateInput = z.output<typeof classUpdateSchema>;
