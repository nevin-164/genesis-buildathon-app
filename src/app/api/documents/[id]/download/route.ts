import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/dal";
import { checkRateLimit } from "@/lib/rate-limit";
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

  /*
   * Limited per signed-in user, after authorisation rather than before it.
   *
   * Every request that reaches this line mints a signed Supabase URL, which is
   * the expensive part and the part worth rationing. Limiting before the
   * ownership check would instead let an unauthorised prober consume somebody
   * else's budget.
   */
  const gate = await checkRateLimit({
    key: `document-download:user:${session.id}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!gate.ok) {
    return new NextResponse(null, {
      status: 429,
      headers: { "retry-after": String(gate.retryAfterSeconds) },
    });
  }

  try {
    const signedUrl = await StorageService.createSignedDownloadUrl(doc.storagePath, 60);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    // The reader gets nothing useful either way, but a silent 500 is not
    // diagnosable — signing fails for real reasons (missing bucket, expired
    // service key) and they need to reach the log.
    console.error("[documents/download]", error);
    return new NextResponse(null, { status: 500 });
  }
}
