"use server";

import { revalidatePath } from "next/cache";
import * as InternshipController from "@/controllers/internship.controller";
import * as DocumentController from "@/controllers/document.controller";

export async function createDraftAction(): Promise<void> {
  await InternshipController.createInternshipDraft();
  revalidatePath("/dev/student-backend");
}

export async function saveDraftAction(id: string, formData: FormData): Promise<void> {
  const input: Record<string, unknown> = Object.fromEntries(formData.entries());
  
  if (input.feeAmount) input.feeAmount = Number(input.feeAmount);
  if (input.stipendAmount) input.stipendAmount = Number(input.stipendAmount);
  if (input.hadMentor) input.hadMentor = input.hadMentor === "on";

  await InternshipController.saveInternshipDraft(id, input);
  revalidatePath("/dev/student-backend");
}

export async function submitAction(id: string, formData: FormData): Promise<void> {
  const input: Record<string, unknown> = Object.fromEntries(formData.entries());
  
  if (input.feeAmount) input.feeAmount = Number(input.feeAmount);
  if (input.stipendAmount) input.stipendAmount = Number(input.stipendAmount);
  input.hadMentor = input.hadMentor === "on";

  await InternshipController.submitInternship(id, input);
  revalidatePath("/dev/student-backend");
}

export async function respondAction(id: string, formData: FormData): Promise<void> {
  const input: Record<string, unknown> = Object.fromEntries(formData.entries());
  await InternshipController.respondToVerification(id, input);
  revalidatePath("/dev/student-backend");
}

export async function testUploadAction(formData: FormData): Promise<void> {
  const file = formData.get("file") as File;
  const internshipId = formData.get("internshipId") as string;
  
  if (!file || !internshipId) throw new Error("Missing file or internshipId");

  const input = {
    internshipId,
    docType: "Test Document",
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };

  await DocumentController.requestUploadUrl(input);
}
