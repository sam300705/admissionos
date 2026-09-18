create table public.courses (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  code text,
  fee_inr bigint not null default 0 check (fee_inr >= 0),
  duration_text text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, institute_id)
);

create unique index courses_institute_name_unique
  on public.courses (institute_id, lower(name));

create index courses_institute_active_idx
  on public.courses (institute_id, active, name);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  course_id uuid,
  student_name text not null check (char_length(trim(student_name)) between 2 and 160),
  phone text not null check (char_length(trim(phone)) between 5 and 30),
  email text,
  source text,
  status text not null default 'new_enquiry'
    check (status in (
      'new_enquiry',
      'contacted',
      'counselling',
      'demo_scheduled',
      'application',
      'admitted',
      'lost'
    )),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, institute_id),
  foreign key (course_id, institute_id)
    references public.courses(id, institute_id)
    on delete restrict
);

create index enquiries_institute_status_idx
  on public.enquiries (institute_id, status, created_at desc);

create index enquiries_institute_assigned_idx
  on public.enquiries (institute_id, assigned_to, status);

create index enquiries_institute_course_idx
  on public.enquiries (institute_id, course_id);

create table public.enquiry_activities (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  enquiry_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  activity_type text not null check (
    activity_type in (
      'created',
      'note',
      'status_changed',
      'assignment_changed',
      'follow_up_scheduled',
      'follow_up_completed'
    )
  ),
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (enquiry_id, institute_id)
    references public.enquiries(id, institute_id)
    on delete cascade
);

create index enquiry_activities_enquiry_created_idx
  on public.enquiry_activities (institute_id, enquiry_id, created_at desc);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  enquiry_id uuid not null,
  assigned_to uuid not null references auth.users(id) on delete restrict,
  due_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (enquiry_id, institute_id)
    references public.enquiries(id, institute_id)
    on delete cascade
);

create index follow_ups_institute_due_idx
  on public.follow_ups (institute_id, status, due_at);

create index follow_ups_assignee_due_idx
  on public.follow_ups (institute_id, assigned_to, status, due_at);

create trigger courses_touch_updated_at
before update on public.courses
for each row execute function private.touch_updated_at();

create trigger enquiries_touch_updated_at
before update on public.enquiries
for each row execute function private.touch_updated_at();

create trigger follow_ups_touch_updated_at
before update on public.follow_ups
for each row execute function private.touch_updated_at();

create or replace function private.is_active_institute_member(
  target_institute_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institute_memberships as membership
    where membership.institute_id = target_institute_id
      and membership.user_id = target_user_id
      and membership.status = 'active'
  );
$$;

revoke execute on function private.is_active_institute_member(uuid, uuid) from public;
grant execute on function private.is_active_institute_member(uuid, uuid) to authenticated;

create or replace function private.can_manage_enquiry(
  target_enquiry_id uuid,
  target_institute_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enquiries as enquiry
    where enquiry.id = target_enquiry_id
      and enquiry.institute_id = target_institute_id
      and (
        private.has_institute_role(
          target_institute_id,
          array['owner', 'admin']::text[]
        )
        or (
          enquiry.assigned_to = (select auth.uid())
          and private.has_institute_role(
            target_institute_id,
            array['counsellor']::text[]
          )
        )
      )
  );
$$;

revoke execute on function private.can_manage_enquiry(uuid, uuid) from public;
grant execute on function private.can_manage_enquiry(uuid, uuid) to authenticated;

alter table public.courses enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_activities enable row level security;
alter table public.follow_ups enable row level security;

revoke all on table public.courses from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;
revoke all on table public.enquiry_activities from anon, authenticated;
revoke all on table public.follow_ups from anon, authenticated;

grant select, insert, update, delete on table public.courses to authenticated;
grant select, insert, update, delete on table public.enquiries to authenticated;
grant select, insert on table public.enquiry_activities to authenticated;
grant select, insert, update, delete on table public.follow_ups to authenticated;

create policy "active members read courses"
on public.courses
for select
to authenticated
using (
  institute_id in (select private.active_institute_ids())
);

create policy "owners and admins create courses"
on public.courses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
);

create policy "owners and admins update courses"
on public.courses
for update
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
)
with check (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
);

create policy "owners and admins delete courses"
on public.courses
for delete
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
);

create policy "active members read enquiries"
on public.enquiries
for select
to authenticated
using (
  institute_id in (select private.active_institute_ids())
);

create policy "authorized staff create enquiries"
on public.enquiries
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (
      private.has_institute_role(
        institute_id,
        array['owner', 'admin']::text[]
      )
      and (
        assigned_to is null
        or private.is_active_institute_member(institute_id, assigned_to)
      )
    )
    or (
      assigned_to = (select auth.uid())
      and private.has_institute_role(
        institute_id,
        array['counsellor']::text[]
      )
    )
  )
);

create policy "authorized staff update enquiries"
on public.enquiries
for update
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
  or (
    assigned_to = (select auth.uid())
    and private.has_institute_role(
      institute_id,
      array['counsellor']::text[]
    )
  )
)
with check (
  (
    private.has_institute_role(
      institute_id,
      array['owner', 'admin']::text[]
    )
    and (
      assigned_to is null
      or private.is_active_institute_member(institute_id, assigned_to)
    )
  )
  or (
    assigned_to = (select auth.uid())
    and private.has_institute_role(
      institute_id,
      array['counsellor']::text[]
    )
  )
);

create policy "owners and admins delete enquiries"
on public.enquiries
for delete
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
);

create policy "active members read enquiry activities"
on public.enquiry_activities
for select
to authenticated
using (
  institute_id in (select private.active_institute_ids())
);

create policy "authorized staff append enquiry activities"
on public.enquiry_activities
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and private.can_manage_enquiry(enquiry_id, institute_id)
);

create policy "active members read follow ups"
on public.follow_ups
for select
to authenticated
using (
  institute_id in (select private.active_institute_ids())
);

create policy "authorized staff create follow ups"
on public.follow_ups
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_manage_enquiry(enquiry_id, institute_id)
  and private.is_active_institute_member(institute_id, assigned_to)
  and (
    private.has_institute_role(
      institute_id,
      array['owner', 'admin']::text[]
    )
    or (
      assigned_to = (select auth.uid())
      and private.has_institute_role(
        institute_id,
        array['counsellor']::text[]
      )
    )
  )
);

create policy "authorized staff update follow ups"
on public.follow_ups
for update
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
  or (
    assigned_to = (select auth.uid())
    and private.has_institute_role(
      institute_id,
      array['counsellor']::text[]
    )
  )
)
with check (
  private.is_active_institute_member(institute_id, assigned_to)
  and (
    private.has_institute_role(
      institute_id,
      array['owner', 'admin']::text[]
    )
    or (
      assigned_to = (select auth.uid())
      and private.has_institute_role(
        institute_id,
        array['counsellor']::text[]
      )
    )
  )
);

create policy "owners and admins delete follow ups"
on public.follow_ups
for delete
to authenticated
using (
  private.has_institute_role(
    institute_id,
    array['owner', 'admin']::text[]
  )
);
