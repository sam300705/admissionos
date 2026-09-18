import { notFound } from "next/navigation";
import { requireActiveMembership } from "../../../../lib/auth/session";
import {
  addEnquiryNote,
  scheduleFollowUp,
  updateEnquiryStatus,
} from "../../../../lib/crm/actions";
import {
  canManageEnquiry,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
} from "../../../../lib/crm/domain";
import {
  getEnquiry,
  listActivities,
  listCourses,
  listFollowUps,
} from "../../../../lib/crm/queries";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EnquiryDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { user, membership } = await requireActiveMembership();
  const enquiry = await getEnquiry(membership.instituteId, id);

  if (!enquiry) notFound();

  const [activities, followUps, courses] = await Promise.all([
    listActivities(membership.instituteId, id),
    listFollowUps(membership.instituteId, id),
    listCourses(membership.instituteId),
  ]);

  const canManage = canManageEnquiry(membership.role, user.id, enquiry.assignedTo);
  const course = courses.find((item) => item.id === enquiry.courseId);

  return (
    <div className="stack">
      <header className="pageHeader">
        <div><p className="eyebrow">ENQUIRY</p><h1>{enquiry.studentName}</h1><p>{enquiry.phone} · {enquiry.email ?? "No email"} · {course?.name ?? "No course selected"}</p></div>
        <span className="pill status">{ENQUIRY_STATUS_LABELS[enquiry.status]}</span>
      </header>
      {query.error ? <p className="authAlert error">{query.error}</p> : null}

      <div className="detailGrid">
        <div className="stack">
          {canManage ? (
            <section className="formCard">
              <h2>Update pipeline</h2>
              <form action={updateEnquiryStatus} className="actions">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <select className="statusSelect" name="status" defaultValue={enquiry.status}>
                  {ENQUIRY_STATUSES.map((status) => <option key={status} value={status}>{ENQUIRY_STATUS_LABELS[status]}</option>)}
                </select>
                <button className="primary" type="submit">Update status</button>
              </form>
            </section>
          ) : null}

          <section className="panel">
            <p className="eyebrow">ACTIVITY</p>
            <h2>Timeline</h2>
            <div className="timeline">
              {activities.map((activity) => (
                <article key={activity.id}>
                  <strong>{activity.activityType.replaceAll("_", " ")}</strong>
                  {activity.body ? <p>{activity.body}</p> : null}
                  <small>{dateTime.format(new Date(activity.createdAt))}</small>
                </article>
              ))}
              {activities.length === 0 ? <p className="muted">No activity yet.</p> : null}
            </div>
          </section>

          {canManage ? (
            <section className="formCard">
              <h2>Add note</h2>
              <form action={addEnquiryNote} className="crmForm">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <label className="span2">Note<textarea name="body" required /></label>
                <div className="span2"><button className="primary" type="submit">Save note</button></div>
              </form>
            </section>
          ) : null}
        </div>

        <aside className="stack">
          <section className="panel">
            <p className="eyebrow">DETAILS</p>
            <h2>Prospect</h2>
            <p><strong>Source</strong><br /><span className="muted">{enquiry.source ?? "—"}</span></p>
            <p><strong>Assignment</strong><br /><span className="muted">{enquiry.assignedTo ? enquiry.assignedTo === user.id ? "You" : "Team member" : "Unassigned"}</span></p>
            <p><strong>Created</strong><br /><span className="muted">{dateTime.format(new Date(enquiry.createdAt))}</span></p>
          </section>

          {canManage ? (
            <section className="formCard">
              <h2>Schedule follow-up</h2>
              <form action={scheduleFollowUp} className="crmForm">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <label className="span2">Due at<input name="dueAt" type="datetime-local" required /></label>
                <label className="span2">Notes<textarea name="notes" /></label>
                <div className="span2"><button className="primary" type="submit">Schedule</button></div>
              </form>
            </section>
          ) : null}

          <section className="panel">
            <h2>Follow-ups</h2>
            {followUps.map((item) => (
              <p key={item.id}><strong>{dateTime.format(new Date(item.dueAt))}</strong><br /><span className="muted">{item.status} · {item.notes ?? "No notes"}</span></p>
            ))}
            {followUps.length === 0 ? <p className="muted">None scheduled.</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
