# AdmissionOS

AdmissionOS is a demo-first admissions CRM for coaching institutes, training centers, and education teams. It helps staff track enquiries, counselling progress, course interest, payment status, and follow-ups from one dashboard.

## Current MVP

- Admissions dashboard with enquiry and conversion KPIs
- Search and status filtering
- Add-student/enquiry workflow
- Course, counsellor, fee, source, and follow-up tracking
- Responsive UI built with Next.js + TypeScript
- PostgreSQL production schema in `db/schema.sql`
- Demo data included so the app runs without external services

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production roadmap

The checked-in PostgreSQL schema is the persistence contract for the next production phase: authentication, institute workspaces, database-backed enquiries, fee schedules, reminders, activity logs, role-based access, and reporting.

## Stack

Next.js, React, TypeScript, PostgreSQL-ready data model.

> This repository currently ships a functional portfolio/demo MVP. Demo records are stored in browser state and reset on refresh; production persistence is intentionally separated into the database schema for the next integration step.
