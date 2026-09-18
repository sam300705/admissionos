import Link from "next/link";
import { requireActiveMembership } from "../../../lib/auth/session";
import { completeFollowUp } from "../../../lib/crm/actions";
import { listFollowUps } from "../../../lib/crm/queries";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

type Props = { searchParams: Promise<{ error?: string }> };

export default async function FollowUpsPage({ searchParams }: Props) {
  const { user, membership } = await requireActiveMembership();
  const [items, params] = await Promise.all([
    listFollowUps(membership.instituteId),
    searchParams,
  ]);

  return (
    <div className="stack">
      <header className="pageHeader"><div><p className="eyebrow">TASK QUEUE</p><h1>Follow-ups</h1><p>Scheduled admission actions across the pipeline.</p></div></header>
      {params.error ? <p className="authAlert error">{params.error}</p> : null}

      <section className="panel">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Due</th><th>Enquiry</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead>
            <tbody>
              {items.map((item) => {
                const canComplete =
                  membership.role === "owner" ||
                  membership.role === "admin" ||
                  (membership.role === "counsellor" && item.assignedTo === user.id);
                return (
                  <tr key={item.id}>
                    <td className="nowrap">{dateTime.format(new Date(item.dueAt))}</td>
                    <td><Link className="rowLink" href={`/enquiries/${item.enquiryId}`}>Open enquiry</Link></td>
                    <td><span className="pill">{item.status}</span></td>
                    <td>{item.notes ?? "—"}</td>
                    <td>
                      {item.status === "scheduled" && canComplete ? (
                        <form action={completeFollowUp}>
                          <input type="hidden" name="followUpId" value={item.id} />
                          <button className="secondary" type="submit">Complete</button>
                        </form>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 ? <div className="emptyState">No follow-ups yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
