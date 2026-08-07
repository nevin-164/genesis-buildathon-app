import { notFound } from "next/navigation";
import * as InternshipController from "@/controllers/internship.controller";
import * as ExploreController from "@/controllers/explore.controller";
import * as Actions from "./actions";

export default async function DevStudentBackendPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  let dashboard = null;
  let myInternships: any[] = [];
  let companies: any[] = [];
  let errorMsg = null;
  let devCompanyId = "";

  try {
    dashboard = await InternshipController.getStudentDashboard();
    myInternships = await InternshipController.listMyInternships();
    companies = await ExploreController.listExploreCompanies();
    
    // Quick hack for dev testing: give the form a valid company UUID
    const { getOrCreatePlaceholder } = await import("@/models/company.model");
    devCompanyId = await getOrCreatePlaceholder();
  } catch (e: any) {
    errorMsg = e.message;
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
              
              <div className="grid grid-cols-1 gap-8">
                <form className="space-y-3 flex flex-col bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm max-w-xl">
                  <h3 className="font-medium text-slate-700 mb-2">Test Form (Save Draft / Submit)</h3>
                  
                  <input name="roleTitle" placeholder="Role Title" defaultValue="Frontend Intern" className="border p-2 rounded text-sm" required />
                  
                  <select name="domain" className="border p-2 rounded text-sm bg-white" required>
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile App</option>
                    <option value="ml">Machine Learning</option>
                    <option value="other">Other</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <select name="workMode" className="border p-2 rounded text-sm bg-white" required>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-Site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <input name="location" placeholder="City (if onsite)" defaultValue="Kochi" className="border p-2 rounded text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" name="startDate" defaultValue="2023-01-01" className="border p-2 rounded text-sm" required />
                    <input type="date" name="endDate" defaultValue="2023-06-01" className="border p-2 rounded text-sm" required />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" name="feeAmount" placeholder="Fee (0 for free)" defaultValue="0" className="border p-2 rounded text-sm" required />
                    <input type="number" name="stipendAmount" placeholder="Stipend Amount" defaultValue="10000" className="border p-2 rounded text-sm" required />
                  </div>

                  <select name="workNature" className="border p-2 rounded text-sm bg-white" required>
                    <option value="real_work">Real Work</option>
                    <option value="guided_project">Guided Project</option>
                    <option value="training_only">Training Only</option>
                  </select>

                  <textarea name="workSummary" placeholder="Summary..." defaultValue="This is a test summary that is very long to bypass the 120 character limit. I learned a lot of things during this internship. We used React and Next.js and it was fantastic. My mentor helped me understand the codebase and taught me how to write good code." className="border p-2 rounded text-sm h-24" required />

                  <div className="flex gap-4">
                    <label className="text-sm flex items-center gap-1">
                      <input type="checkbox" name="hadMentor" defaultChecked /> Had Mentor
                    </label>
                    <select name="mentorFrequency" className="border p-2 rounded text-sm bg-white">
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  
                  <input type="hidden" name="companyId" value={devCompanyId} />

                  <div className="flex gap-3 pt-4 mt-4 border-t">
                    <button type="submit" formAction={Actions.saveDraftAction.bind(null, dashboard.internship.id)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-sm transition-colors flex-1">
                      Test saveInternshipDraft()
                    </button>
                    <button type="submit" formAction={Actions.submitAction.bind(null, dashboard.internship.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors flex-1 font-medium">
                      Test submitInternship()
                    </button>
                  </div>
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
