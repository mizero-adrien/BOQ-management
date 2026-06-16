-- Function to create report reminder notifications
-- Call this via a scheduled Supabase Edge Function or manually for testing

create or replace function send_report_reminders()
returns void
language plpgsql
security definer
as $$
declare
  v_engineer record;
  v_today date := current_date;
  v_has_report boolean;
begin
  -- Loop through all engineers who are members of active projects
  for v_engineer in
    select distinct pm.user_id, pm.project_id
    from project_members pm
    join projects p on p.id = pm.project_id
    where pm.role = 'engineer'
    and p.status = 'active'
  loop
    -- Check if they have submitted a report today
    select exists(
      select 1 from daily_reports
      where engineer_id = v_engineer.user_id
      and project_id = v_engineer.project_id
      and report_date = v_today
      and status = 'submitted'
    ) into v_has_report;

    -- If no report, send a reminder notification
    if not v_has_report then
      -- Check if we already sent a reminder today
      if not exists(
        select 1 from notifications
        where user_id = v_engineer.user_id
        and project_id = v_engineer.project_id
        and type = 'report_reminder'
        and created_at::date = v_today
      ) then
        insert into notifications (user_id, project_id, type, title, body, read)
        values (
          v_engineer.user_id,
          v_engineer.project_id,
          'report_reminder',
          'Daily report reminder',
          'You have not submitted your site report today. Please submit before 5:00 PM.',
          false
        );
      end if;
    end if;
  end loop;
end;
$$;

grant execute on function send_report_reminders() to authenticated;
