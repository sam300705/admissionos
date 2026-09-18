create or replace function private.log_enquiry_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_actor uuid;
begin
  event_actor := coalesce((select auth.uid()), new.created_by);

  if tg_op = 'INSERT' then
    insert into public.enquiry_activities (
      institute_id,
      enquiry_id,
      actor_id,
      activity_type,
      body
    )
    values (
      new.institute_id,
      new.id,
      event_actor,
      'created',
      'Enquiry created'
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.enquiry_activities (
      institute_id,
      enquiry_id,
      actor_id,
      activity_type,
      body,
      metadata
    )
    values (
      new.institute_id,
      new.id,
      event_actor,
      'status_changed',
      'Status changed',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;

  if old.assigned_to is distinct from new.assigned_to then
    insert into public.enquiry_activities (
      institute_id,
      enquiry_id,
      actor_id,
      activity_type,
      body,
      metadata
    )
    values (
      new.institute_id,
      new.id,
      event_actor,
      'assignment_changed',
      'Assignment changed',
      jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to)
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.log_enquiry_audit() from public;

create trigger enquiry_audit_after_change
after insert or update of status, assigned_to on public.enquiries
for each row execute function private.log_enquiry_audit();

create or replace function private.log_follow_up_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_actor uuid;
begin
  event_actor := coalesce((select auth.uid()), new.created_by);

  if tg_op = 'INSERT' then
    insert into public.enquiry_activities (
      institute_id,
      enquiry_id,
      actor_id,
      activity_type,
      body,
      metadata
    )
    values (
      new.institute_id,
      new.enquiry_id,
      event_actor,
      'follow_up_scheduled',
      'Follow-up scheduled',
      jsonb_build_object('follow_up_id', new.id, 'due_at', new.due_at)
    );
    return new;
  end if;

  if old.status is distinct from new.status and new.status = 'completed' then
    insert into public.enquiry_activities (
      institute_id,
      enquiry_id,
      actor_id,
      activity_type,
      body,
      metadata
    )
    values (
      new.institute_id,
      new.enquiry_id,
      coalesce((select auth.uid()), new.completed_by, event_actor),
      'follow_up_completed',
      'Follow-up completed',
      jsonb_build_object('follow_up_id', new.id)
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.log_follow_up_audit() from public;

create trigger follow_up_audit_after_change
after insert or update of status on public.follow_ups
for each row execute function private.log_follow_up_audit();
