-- Function to get project analytics summary for AI context
create or replace function get_project_analytics(p_project_id uuid)
returns json
language plpgsql
security definer
stable
as $$
declare
  v_result json;
begin
  select json_build_object(
    'project', (
      select json_build_object(
        'name', p.name,
        'location', p.location,
        'status', p.status,
        'overall_progress', p.overall_progress,
        'start_date', p.start_date,
        'expected_end_date', p.expected_end_date,
        'days_elapsed', (current_date - p.start_date),
        'days_remaining', (p.expected_end_date - current_date),
        'days_total', (p.expected_end_date - p.start_date)
      )
      from projects p where p.id = p_project_id
    ),
    'boq_summary', (
      select json_build_object(
        'total_budget', coalesce(sum(bi.budgeted_total), 0),
        'total_used', coalesce(sum(bi.used_total), 0),
        'usage_pct', case when sum(bi.budgeted_total) > 0
          then round((sum(bi.used_total) / sum(bi.budgeted_total)) * 100, 1)
          else 0 end,
        'sections_count', count(distinct bi.section_id),
        'items_count', count(bi.id),
        'over_budget_items', count(case when bi.used_total > bi.budgeted_total then 1 end),
        'sections', (
          select json_agg(json_build_object(
            'title', bs.title,
            'budget', coalesce(sum(bi2.budgeted_total), 0),
            'used', coalesce(sum(bi2.used_total), 0),
            'usage_pct', case when sum(bi2.budgeted_total) > 0
              then round((sum(bi2.used_total) / sum(bi2.budgeted_total)) * 100, 1)
              else 0 end,
            'status', bs.status
          ) order by bs.order_index)
          from boq_sections bs
          left join boq_items bi2 on bi2.section_id = bs.id
          where bs.project_id = p_project_id
          group by bs.id, bs.title, bs.order_index, bs.status
        )
      )
      from boq_items bi
      join boq_sections bs on bs.id = bi.section_id
      where bs.project_id = p_project_id
    ),
    'reports_summary', (
      select json_build_object(
        'total_reports', count(*),
        'reports_this_week', count(case when dr.report_date >= current_date - 7 then 1 end),
        'avg_workers_this_week', round(avg(case when dr.report_date >= current_date - 7 then dr.workers_count end), 0),
        'avg_progress_rate', round(avg(dr.progress_pct), 1),
        'open_issues', count(case when dr.issues is not null and dr.issues != '' then 1 end),
        'last_report_date', max(dr.report_date)
      )
      from daily_reports dr
      where dr.project_id = p_project_id
      and dr.status = 'submitted'
    ),
    'schedule_health', (
      select json_build_object(
        'planned_progress_pct', round(
          case when (p2.expected_end_date - p2.start_date) > 0
          then ((current_date - p2.start_date)::numeric / (p2.expected_end_date - p2.start_date)::numeric) * 100
          else 0 end, 1
        ),
        'actual_progress_pct', p2.overall_progress,
        'schedule_variance', round(
          p2.overall_progress - case when (p2.expected_end_date - p2.start_date) > 0
          then ((current_date - p2.start_date)::numeric / (p2.expected_end_date - p2.start_date)::numeric) * 100
          else 0 end, 1
        )
      )
      from projects p2 where p2.id = p_project_id
    ),
    'top_cost_items', (
      select json_agg(json_build_object(
        'description', bi.description,
        'unit', bi.unit,
        'budgeted_total', bi.budgeted_total,
        'used_total', bi.used_total,
        'usage_pct', case when bi.budgeted_total > 0
          then round((bi.used_total / bi.budgeted_total) * 100, 1)
          else 0 end,
        'section', bs.title
      ) order by bi.used_total desc)
      from (
        select * from boq_items bi2
        join boq_sections bs2 on bs2.id = bi2.section_id
        where bs2.project_id = p_project_id
        order by bi2.used_total desc
        limit 10
      ) sub
      join boq_items bi on bi.id = sub.id
      join boq_sections bs on bs.id = bi.section_id
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function get_project_analytics(uuid) to authenticated;

-- Function to get historical material prices across all projects
create or replace function get_material_price_history(p_company_id uuid, p_search_term text)
returns json
language plpgsql
security definer
stable
as $$
begin
  return (
    select json_agg(json_build_object(
      'description', bi.description,
      'unit', bi.unit,
      'unit_rate', bi.unit_rate,
      'used_total', bi.used_total,
      'used_quantity', bi.used_quantity,
      'actual_unit_cost', case when bi.used_quantity > 0
        then round(bi.used_total / bi.used_quantity, 0)
        else bi.unit_rate end,
      'project_name', p.name,
      'project_date', p.start_date,
      'section', bs.title
    ))
    from boq_items bi
    join boq_sections bs on bs.id = bi.section_id
    join projects p on p.id = bs.project_id
    where p.company_id = p_company_id
    and bi.description ilike '%' || p_search_term || '%'
    and bi.unit_rate > 0
    order by p.start_date desc
    limit 20
  );
end;
$$;

grant execute on function get_material_price_history(uuid, text) to authenticated;

-- Function to get company-wide analytics for benchmarking
create or replace function get_company_analytics(p_company_id uuid)
returns json
language plpgsql
security definer
stable
as $$
begin
  return json_build_object(
    'projects_count', (
      select count(*) from projects where company_id = p_company_id
    ),
    'completed_projects', (
      select count(*) from projects where company_id = p_company_id and status = 'completed'
    ),
    'avg_budget_variance', (
      select round(avg(
        case when total_budget > 0
        then ((total_used - total_budget) / total_budget) * 100
        else 0 end
      ), 1)
      from (
        select
          sum(bi.budgeted_total) as total_budget,
          sum(bi.used_total) as total_used
        from boq_items bi
        join boq_sections bs on bs.id = bi.section_id
        join projects p on p.id = bs.project_id
        where p.company_id = p_company_id
        group by p.id
      ) sub
    ),
    'most_common_overrun_items', (
      select json_agg(json_build_object(
        'description', description,
        'avg_overrun_pct', avg_overrun
      ))
      from (
        select
          bi.description,
          round(avg(case when bi.budgeted_total > 0
            then ((bi.used_total - bi.budgeted_total) / bi.budgeted_total) * 100
            else 0 end), 1) as avg_overrun
        from boq_items bi
        join boq_sections bs on bs.id = bi.section_id
        join projects p on p.id = bs.project_id
        where p.company_id = p_company_id
        and bi.used_total > bi.budgeted_total
        group by bi.description
        order by avg_overrun desc
        limit 5
      ) sub
    )
  );
end;
$$;

grant execute on function get_company_analytics(uuid) to authenticated;
