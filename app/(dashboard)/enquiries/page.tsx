import Link from "next/link";
import { requireActiveMembership } from "../../../lib/auth/session";
import { createEnquiry } from "../../../lib/crm/actions";
import { ENQUIRY_STATUS_LABELS } from "../../../lib/crm/domain";
import { listCourses, listEnquiries } from "../../../lib/crm/queries";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function EnquiriesPage({ searchParams }: Props) {
  const { membership } = await requireActiveMembership();
  const [courses, enquiries, params] = await Promise.all([
    listCourses(membership.instituteId),
    listEnquiries(membership.instituteId),
    searchParams,
  ]);
  const canCreate = membership.role !== "finance";

  return (
    <div className="stack">
      <header className="pageHeader"><div><p className="eyebrow">PIPELINE</p><h1>Enquiries</h1><p>Every prospect in the institute admissions pipeline.</p></div></header>
      {params.error ? <p className="authAlert error">{params.error}</p> : null}

      {canCreate ? (
        <section className="formCard">
          <h2>Add enquiry</h2>
          <form action={createEnquiry} className="crmForm">
            <label>Student name<input name="studentName" required /></label>
            <label>Phone<input name="phone" required /></label>
            <label>Email<input name="email" type="email" /></label>
            <label>Course<select name="courseId" defaultValue=""><option value="">No course selected</option>{courses.filter((course) => course.active).map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
            <label>Source<input name="source" placeholder="Website / Referral / Walk-in" /></label>
            <label>Assignment<select name="assignment" defaultValue={membership.role === "counsellor" ? "self" : "unassigned"}><option value="self">Assign to me</option>{membership.role !== "counsellor" ? <option value="unassigned">Leave unassigned</option> : null}</select></label>
            <div className="span2"><button className="primary" type="submit">Create enquiry</button></div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Student</th><th>Status</th><th>Phone</th><th>Source</th><th>Assignment</th></tr></thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td><Link className="rowLink" href={`/enquiries/${enquiry.id}`}>{enquiry.studentName}</Link><span>{enquiry.email ?? "No email"}</span></td>
                  <td><span className="pill status">{ENQUIRY_STATUS_LABELS[enquiry.status]}</span></td>
                  <td>{enquiry.phone}</td>
                  <td>{enquiry.source ?? "—"}</td>
                  <td>{enquiry.assignedTo ? "Assigned" : "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {enquiries.length === 0 ? <div className="emptyState">No enquiries yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
