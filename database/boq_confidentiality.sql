-- View for engineers and foremen — no financial data
create or replace view boq_items_field_view as
select
  id,
  section_id,
  description,
  unit,
  quantity,
  null::numeric as unit_rate,
  null::numeric as budgeted_total,
  used_quantity,
  null::numeric as used_total,
  status,
  order_index,
  updated_at
from boq_items;

-- Function to get BOQ items based on caller role
create or replace function get_boq_items_for_role(p_section_id uuid)
returns table (
  id uuid,
  section_id uuid,
  description text,
  unit text,
  quantity numeric,
  unit_rate numeric,
  budgeted_total numeric,
  used_quantity numeric,
  used_total numeric,
  status boq_item_status,
  order_index integer,
  updated_at timestamptz
)
language plpgsql
security definer
stable
as $$
declare
  v_user_role text;
begin
  select role::text into v_user_role
  from profiles
  where id = auth.uid();

  if v_user_role in ('pm', 'qs') then
    return query
    select
      bi.id, bi.section_id, bi.description, bi.unit,
      bi.quantity, bi.unit_rate, bi.budgeted_total,
      bi.used_quantity, bi.used_total, bi.status,
      bi.order_index, bi.updated_at
    from boq_items bi
    where bi.section_id = p_section_id
    order by bi.order_index;

  elsif v_user_role in ('engineer', 'foreman') then
    return query
    select
      bi.id, bi.section_id, bi.description, bi.unit,
      bi.quantity, null::numeric, null::numeric,
      bi.used_quantity, null::numeric, bi.status,
      bi.order_index, bi.updated_at
    from boq_items bi
    where bi.section_id = p_section_id
    order by bi.order_index;

  elsif v_user_role = 'storekeeper' then
    return query
    select
      bi.id, bi.section_id, bi.description, bi.unit,
      bi.quantity, null::numeric, null::numeric,
      bi.used_quantity, null::numeric, bi.status,
      bi.order_index, bi.updated_at
    from boq_items bi
    where bi.section_id = p_section_id
    order by bi.order_index;

  else
    return;
  end if;
end;
$$;

grant execute on function get_boq_items_for_role(uuid) to authenticated;

-- Function to get BOQ section summary for owners
create or replace function get_boq_summary_for_owner(p_project_id uuid)
returns table (
  section_id uuid,
  section_title text,
  order_index integer,
  status text,
  total_budgeted numeric,
  total_used numeric,
  usage_pct numeric
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select
    bs.id,
    bs.title,
    bs.order_index,
    bs.status,
    coalesce(sum(bi.budgeted_total), 0) as total_budgeted,
    coalesce(sum(bi.used_total), 0) as total_used,
    case
      when coalesce(sum(bi.budgeted_total), 0) > 0
      then round((coalesce(sum(bi.used_total), 0) / sum(bi.budgeted_total)) * 100, 1)
      else 0
    end as usage_pct
  from boq_sections bs
  left join boq_items bi on bi.section_id = bs.id
  where bs.project_id = p_project_id
  group by bs.id, bs.title, bs.order_index, bs.status
  order by bs.order_index;
end;
$$;

grant execute on function get_boq_summary_for_owner(uuid) to authenticated;
grant execute on function get_boq_summary_for_owner(uuid) to anon;
