import { createCourse } from "../../../lib/crm/actions";
import { listCourses } from "../../../lib/crm/queries";
import { requireActiveMembership } from "../../../lib/auth/session";
import { hasPermission } from "../../../lib/permissions/permissions";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type Props = { searchParams: Promise<{ error?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const { membership } = await requireActiveMembership();
  const [courses, params] = await Promise.all([
    listCourses(membership.instituteId),
    searchParams,
  ]);
  const canManage = hasPermission(membership.role, "courses.manage");

  return (
    <div className="stack">
      <header className="pageHeader"><div><p className="eyebrow">CATALOG</p><h1>Courses</h1><p>Programs available to admissions counsellors.</p></div></header>
      {params.error ? <p className="authAlert error">{params.error}</p> : null}

      {canManage ? (
        <section className="formCard">
          <h2>Add course</h2>
          <form action={createCourse} className="crmForm">
            <label>Course name<input name="name" required placeholder="JEE 2027" /></label>
            <label>Code<input name="code" placeholder="JEE27" /></label>
            <label>Fee (INR)<input name="feeInr" type="number" min="0" defaultValue="0" required /></label>
            <label>Duration<input name="durationText" placeholder="12 months" /></label>
            <div className="span2"><button className="primary" type="submit">Create course</button></div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Course</th><th>Code</th><th>Fee</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td><strong>{course.name}</strong></td>
                  <td>{course.code ?? "—"}</td>
                  <td>{money.format(course.feeInr)}</td>
                  <td>{course.durationText ?? "—"}</td>
                  <td><span className="pill">{course.active ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 ? <div className="emptyState">No courses yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
