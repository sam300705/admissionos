"use client";

import { FormEvent, useMemo, useState } from "react";

type Status = "New Enquiry" | "Counselling" | "Demo Scheduled" | "Application" | "Admitted" | "Lost";
type Payment = "Not Started" | "Partial" | "Paid";

type Student = {
  id: number;
  name: string;
  phone: string;
  email: string;
  course: string;
  source: string;
  counsellor: string;
  status: Status;
  payment: Payment;
  fee: number;
  paid: number;
  followUp: string;
};

const seedStudents: Student[] = [
  { id: 1, name: "Ishita Verma", phone: "+91 98990 10001", email: "ishita@example.com", course: "JEE 2027", source: "Website", counsellor: "Sambhav", status: "Counselling", payment: "Not Started", fee: 85000, paid: 0, followUp: "Today, 5:00 PM" },
  { id: 2, name: "Arjun Rao", phone: "+91 98990 10002", email: "arjun@example.com", course: "NEET 2027", source: "Referral", counsellor: "Riya", status: "Demo Scheduled", payment: "Not Started", fee: 92000, paid: 0, followUp: "Tomorrow, 12:00 PM" },
  { id: 3, name: "Mehak Jain", phone: "+91 98990 10003", email: "mehak@example.com", course: "Class 10 Boards", source: "Instagram", counsellor: "Sambhav", status: "Application", payment: "Partial", fee: 48000, paid: 15000, followUp: "Sep 19, 3:30 PM" },
  { id: 4, name: "Vivaan Kapoor", phone: "+91 98990 10004", email: "vivaan@example.com", course: "CUET 2027", source: "Walk-in", counsellor: "Riya", status: "Admitted", payment: "Paid", fee: 65000, paid: 65000, followUp: "Orientation pending" },
  { id: 5, name: "Sara Khan", phone: "+91 98990 10005", email: "sara@example.com", course: "JEE 2027", source: "Google Ads", counsellor: "Sambhav", status: "New Enquiry", payment: "Not Started", fee: 85000, paid: 0, followUp: "Today, 7:00 PM" },
];

const statuses: Array<"All" | Status> = ["All", "New Enquiry", "Counselling", "Demo Scheduled", "Application", "Admitted", "Lost"];
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Home() {
  const [students, setStudents] = useState(seedStudents);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((student) => {
      const matchesSearch = !q || [student.name, student.phone, student.email, student.course, student.source].some((value) => value.toLowerCase().includes(q));
      return matchesSearch && (status === "All" || student.status === status);
    });
  }, [students, search, status]);

  const openEnquiries = students.filter((s) => !["Admitted", "Lost"].includes(s.status)).length;
  const admitted = students.filter((s) => s.status === "Admitted").length;
  const totalFees = students.reduce((sum, s) => sum + s.fee, 0);
  const collected = students.reduce((sum, s) => sum + s.paid, 0);

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fee = Number(form.get("fee") || 0);
    const newStudent: Student = {
      id: Date.now(),
      name: String(form.get("name") || "New enquiry"),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      course: String(form.get("course") || "General Programme"),
      source: String(form.get("source") || "Website"),
      counsellor: "Sambhav",
      status: "New Enquiry",
      payment: "Not Started",
      fee,
      paid: 0,
      followUp: "Not scheduled",
    };
    setStudents((current) => [newStudent, ...current]);
    setShowForm(false);
    event.currentTarget.reset();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">AO</div><div><strong>AdmissionOS</strong><span>Admissions CRM</span></div></div>
        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#enquiries">Enquiries</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#fees">Fees</a>
          <a href="#followups">Follow-ups</a>
        </nav>
        <div className="sidebarFoot">Demo institute<br/><strong>BrightPath Academy</strong></div>
      </aside>

      <section className="workspace" id="dashboard">
        <header className="topbar">
          <div><p className="eyebrow">ADMISSIONS OPERATIONS</p><h1>Admissions command center</h1><p>Track every enquiry from first call to confirmed admission.</p></div>
          <button className="primary" onClick={() => setShowForm(true)}>+ Add enquiry</button>
        </header>

        <div className="metrics">
          <article><span>Open enquiries</span><strong>{openEnquiries}</strong><small>Currently moving through the funnel</small></article>
          <article><span>Admissions</span><strong>{admitted}</strong><small>Confirmed in demo data</small></article>
          <article><span>Fee potential</span><strong>{money.format(totalFees)}</strong><small>Expected value of all enquiries</small></article>
          <article><span>Collected</span><strong>{money.format(collected)}</strong><small>{totalFees ? Math.round((collected / totalFees) * 100) : 0}% of tracked fee potential</small></article>
        </div>

        <section className="panel" id="enquiries">
          <div className="panelHead">
            <div><p className="eyebrow">ENQUIRY PIPELINE</p><h2>Students & prospects</h2></div>
            <div className="filters">
              <input aria-label="Search enquiries" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, course, phone..." />
              <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
          </div>

          <div className="tableWrap">
            <table>
              <thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Fee</th><th>Payment</th><th>Next follow-up</th></tr></thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.name}</strong><span>{student.phone}</span><span>{student.source}</span></td>
                    <td><strong>{student.course}</strong><span>Counsellor: {student.counsellor}</span></td>
                    <td><span className="pill status">{student.status}</span></td>
                    <td><strong>{money.format(student.fee)}</strong><span>Paid: {money.format(student.paid)}</span></td>
                    <td><span className={`pill ${student.payment.toLowerCase().replace(" ", "-")}`}>{student.payment}</span></td>
                    <td><strong>{student.followUp}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty">No enquiries match your filters.</div>}
          </div>
        </section>

        <section className="twoCol" id="pipeline">
          <article className="panel compact"><p className="eyebrow">FUNNEL SNAPSHOT</p><h2>Stage distribution</h2>{statuses.slice(1, -1).map((item) => { const count = students.filter((student) => student.status === item).length; return <div className="progressRow" key={item}><span>{item}</span><div><i style={{ width: `${Math.min(100, count * 35)}%` }} /></div><strong>{count}</strong></div>; })}</article>
          <article className="panel compact" id="followups"><p className="eyebrow">FOLLOW-UPS</p><h2>Needs attention</h2>{students.filter((student) => student.status !== "Admitted").slice(0, 4).map((student) => <div className="follow" key={student.id}><div><strong>{student.name}</strong><span>{student.course} · {student.status}</span></div><b>{student.followUp}</b></div>)}</article>
        </section>
      </section>

      {showForm && <div className="modalBackdrop" role="presentation" onMouseDown={() => setShowForm(false)}><form className="modal" onSubmit={addStudent} onMouseDown={(e) => e.stopPropagation()}><div className="modalHead"><div><p className="eyebrow">NEW PROSPECT</p><h2>Add enquiry</h2></div><button type="button" className="iconBtn" onClick={() => setShowForm(false)}>×</button></div><label>Name<input name="name" required placeholder="Student name" /></label><div className="formGrid"><label>Phone<input name="phone" required placeholder="+91..." /></label><label>Email<input name="email" type="email" placeholder="name@example.com" /></label><label>Course<input name="course" required placeholder="JEE 2027 / NEET 2027" /></label><label>Source<input name="source" placeholder="Website / Referral" /></label><label>Expected fee (INR)<input name="fee" type="number" min="0" placeholder="85000" /></label></div><button className="primary full" type="submit">Save enquiry</button></form></div>}
    </main>
  );
}
