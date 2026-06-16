-- Trigger function to send budget alert notification when item hits 80 percent
create or replace function notify_budget_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_usage_pct numeric;
  v_project_id uuid;
  v_pm_id uuid;
  v_section_title text;
begin
  -- Calculate usage percentage
  if new.budgeted_total > 0 then
    v_usage_pct := (new.used_total / new.budgeted_total) * 100;
  else
    v_usage_pct := 0;
  end if;

  -- Only fire when crossing 80 percent threshold
  if v_usage_pct >= 80 and (old.used_total / nullif(old.budgeted_total, 0) * 100) < 80 then

    -- Get project and PM info
    select bs.project_id into v_project_id
    from boq_sections bs
    where bs.id = new.section_id;

    select pm_id into v_pm_id
    from projects
    where id = v_project_id;

    select title into v_section_title
    from boq_sections
    where id = new.section_id;

    -- Insert notification for PM
    insert into notifications (user_id, project_id, type, title, body, read)
    values (
      v_pm_id,
      v_project_id,
      'budget_alert',
      'Budget alert: ' || new.description,
      new.description || ' in ' || v_section_title || ' has reached ' || round(v_usage_pct) || ' percent of its budget. Used: ' || new.used_total || ' RWF of ' || new.budgeted_total || ' RWF budgeted.',
      false
    );

  end if;

  return new;
end;
$$;

drop trigger if exists on_boq_item_budget_alert on boq_items;

create trigger on_boq_item_budget_alert
  after update on boq_items
  for each row
  when (new.used_total is distinct from old.used_total)
  execute procedure notify_budget_alert();
