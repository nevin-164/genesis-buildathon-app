import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/dal";
import * as DocumentModel from "@/models/document.model";
import * as InternshipModel from "@/models/internship.model";
import * as StorageService from "@/services/storage.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse(null, { status: 404 });
  }

  const { id } = await params;

  const doc = await DocumentModel.findById(id);
  if (!doc) {
    return new NextResponse(null, { status: 404 });
  }

  const internship = await InternshipModel.findById(doc.internshipId);
  if (!internship) {
    return new NextResponse(null, { status: 404 });
  }

  const isOwner = internship.studentId === session.id;
  const isAssignedFaculty = internship.assignedFacultyId === session.id;
  const isAdmin = session.role === "admin";

  if (!isOwner && !isAssignedFaculty && !isAdmin) {
    // Deliberately 404 instead of 403 to prevent enumeration of document IDs
    return new NextResponse(null, { status: 404 });
  }

  try {
    const signedUrl = await StorageService.createSignedDownloadUrl(doc.storagePath, 60);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
