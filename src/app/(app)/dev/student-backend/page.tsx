import { notFound } from "next/navigation";
import * as InternshipController from "@/controllers/internship.controller";
import * as ExploreController from "@/controllers/explore.controller";
import * as Actions from "./actions";
import type { CompanyOption, InternshipListItem } from "@/types/contracts";

export default async function DevStudentBackendPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  let dashboard = null;
  let myInternships: InternshipListItem[] = [];
  let companies: CompanyOption[] = [];
  let errorMsg: string | null = null;

  try {
    dashboard = await InternshipController.getStudentDashboard();
    myInternships = await InternshipController.listMyInternships();
    companies = await ExploreController.listExploreCompanies();
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-3xl font-bold">Student Backend - Dev Panel</h1>

      {errorMsg ? (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded">
          <strong>Authentication Error:</strong> {errorMsg}
          <p className="text-sm mt-2 text-red-600">Please sign in as a student using DEV_FAKE_ROLE=student or the local login.</p>
        </div>
      ) : (
        <>
          <section className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold">1. Dashboard</h2>
            <div className="flex items-center gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 text-sm rounded border">Next Action: {dashboard?.nextAction}</span>
              <form action={Actions.createDraftAction}>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                  Create Draft
                </button>
              </form>
            </div>
            <pre className="bg-slate-900 text-green-400 p-4 text-xs overflow-auto rounded max-h-64">
              {JSON.stringify(dashboard?.internship, null, 2)}
            </pre>
          </section>

          <section className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold">2. My Internships List</h2>
            {myInternships.length === 0 ? (
              <p className="text-slate-500 italic">No internships found.</p>
            ) : (
              <div className="space-y-2">
                {myInternships.map(i => (
                  <div key={i.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <strong className="block">{i.roleTitle}</strong>
                      <span className="text-sm text-slate-500">{i.companyName}</span>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono border">{i.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold">3. Companies with Verified Internships</h2>
            {companies.length === 0 ? (
              <p className="text-slate-500 italic">No verified internships exist yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {companies.map(c => (
                  <div key={c.id} className="text-sm border p-2 rounded bg-slate-50">{c.name}</div>
                ))}
              </div>
            )}
          </section>

          {dashboard?.internship && (
            <section className="space-y-4 border p-6 rounded-lg bg-white shadow-sm border-blue-200">
              <h2 className="text-xl font-semibold text-blue-900">4. Form Tester (ID: {dashboard.internship.id})</h2>
              
              <div className="grid grid-cols-2 gap-8">
                <form action={Actions.saveDraftAction.bind(null, dashboard.internship.id)} className="space-y-3 flex flex-col">
                  <h3 className="font-medium text-slate-700">Save Draft (Loose)</h3>
                  <input name="roleTitle" placeholder="Role Title" className="border p-2 rounded text-sm" />
                  <input name="domain" placeholder="Domain (e.g. software_engineering)" className="border p-2 rounded text-sm" />
                  <input name="workMode" placeholder="Work Mode (remote/hybrid/onsite)" className="border p-2 rounded text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" name="startDate" className="border p-2 rounded text-sm" />
                    <input type="date" name="endDate" className="border p-2 rounded text-sm" />
                  </div>
                  <textarea name="workSummary" placeholder="Summary..." className="border p-2 rounded text-sm h-24" />
                  <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-sm transition-colors">
                    Test saveInternshipDraft()
                  </button>
                </form>

                <form action={Actions.submitAction.bind(null, dashboard.internship.id)} className="space-y-3 flex flex-col">
                  <h3 className="font-medium text-slate-700">Submit (Strict validation)</h3>
                  <p className="text-xs text-slate-500 mb-2">Requires all fields to be populated according to submitSchema rules.</p>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors mt-auto">
                    Test submitInternship()
                  </button>
                </form>
              </div>
            </section>
          )}

          {dashboard?.internship && (
            <section className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
              <h2 className="text-xl font-semibold">5. Document Upload Tester</h2>
              <form action={Actions.testUploadAction} className="flex gap-4 items-center">
                <input type="hidden" name="internshipId" value={dashboard.internship.id} />
                <input type="file" name="file" className="text-sm" />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors">
                  Request Upload URL
                </button>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  );
}
