create extension if not exists pgcrypto;

create table institutes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'counsellor' check (role in ('owner','admin','counsellor','finance')),
  created_at timestamptz not null default now(),
  unique (institute_id, email)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  name text not null,
  fee_inr integer not null default 0 check (fee_inr >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  counsellor_id uuid references staff(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  student_name text not null,
  phone text not null,
  email text,
  source text,
  status text not null default 'New Enquiry' check (status in ('New Enquiry','Counselling','Demo Scheduled','Application','Admitted','Lost')),
  expected_fee_inr integer not null default 0 check (expected_fee_inr >= 0),
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  amount_inr integer not null check (amount_inr > 0),
  payment_method text,
  reference text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table enquiry_activities (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  actor_id uuid references staff(id) on delete set null,
  activity_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index enquiries_institute_status_idx on enquiries(institute_id, status);
create index enquiries_followup_idx on enquiries(institute_id, next_follow_up_at);
create index payments_enquiry_paid_idx on payments(enquiry_id, paid_at desc);
create index enquiry_activity_idx on enquiry_activities(enquiry_id, created_at desc);
