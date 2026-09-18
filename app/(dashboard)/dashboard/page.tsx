import Link from "next/link";
import { requireActiveMembership } from "../../../lib/auth/session";
import { ENQUIRY_STATUS_LABELS } from "../../../lib/crm/domain";
import { getDashboardData } from "../../../lib/crm/queries";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function DashboardPage() {
  const { membership } = await requireActiveMembership();
  const data = await getDashboardData(membership.instituteId);

  return (
    <div className="stack">
      <header className="pageHeader">
        <div>
          <p className="eyebrow">ADMISSIONS OPERATIONS</p>
          <h1>Dashboard</h1>
          <p>Live tenant-scoped CRM data from Supabase.</p>
        </div>
        <Link className="primary" href="/enquiries">Open enquiries</Link>
      </header>

      <section className="cardGrid">
        <article className="card"><span>Open enquiries</span><strong className="metric">{data.metrics.open}</strong></article>
        <article className="card"><span>Admissions</span><strong className="metric">{data.metrics.admitted}</strong></article>
        <article className="card"><span>Active courses</span><strong className="metric">{data.metrics.activeCourses}</strong></article>
        <article className="card"><span>Scheduled follow-ups</span><strong className="metric">{data.metrics.scheduledFollowUps}</strong></article>
      </section>

      <section className="panel">
        <div className="panelHead"><div><p className="eyebrow">RECENT</p><h2>Latest enquiries</h2></div><Link className="secondary" href="/enquiries">View all</Link></div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Student</th><th>Status</th><th>Phone</th><th>Created</th></tr></thead>
            <tbody>
              {data.enquiries.slice(0, 6).map((enquiry) => (
                <tr key={enquiry.id}>
                  <td><Link className="rowLink" href={`/enquiries/${enquiry.id}`}>{enquiry.studentName}</Link><span>{enquiry.source ?? "No source"}</span></td>
                  <td><span className="pill status">{ENQUIRY_STATUS_LABELS[enquiry.status]}</span></td>
                  <td>{enquiry.phone}</td>
                  <td>{dateTime.format(new Date(enquiry.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.enquiries.length === 0 ? <div className="emptyState">No enquiries yet.</div> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead"><div><p className="eyebrow">NEXT ACTIONS</p><h2>Upcoming follow-ups</h2></div><Link className="secondary" href="/follow-ups">View all</Link></div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Due</th><th>Enquiry</th><th>Notes</th></tr></thead>
            <tbody>
              {data.followUps.filter((item) => item.status === "scheduled").slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td className="nowrap">{dateTime.format(new Date(item.dueAt))}</td>
                  <td><Link className="rowLink" href={`/enquiries/${item.enquiryId}`}>Open enquiry</Link></td>
                  <td>{item.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
