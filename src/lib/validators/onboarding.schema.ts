import { z } from "zod";

export const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("student"),
    registerNumber: z.string().trim().min(1, { message: "Enter your register number." }),
    classId: z.uuid({ message: "Choose your class." }),
  }),
  z.object({
    role: z.literal("faculty"),
  }),
]);
