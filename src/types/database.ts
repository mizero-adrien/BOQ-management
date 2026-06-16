export type UserRole = 'engineer' | 'pm' | 'owner' | 'foreman' | 'qs' | 'storekeeper'

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'

export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'overdue'

export type ReportStatus = 'draft' | 'submitted'

export type ZoneStatus = 'not_started' | 'in_progress' | 'done' | 'issue_flagged'

export type BOQItemStatus = 'not_started' | 'in_progress' | 'done' | 'over_budget'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  country: string
  currency: string
  created_at: string
}

export interface Project {
  id: string
  company_id: string
  pm_id: string
  name: string
  location: string
  client_name: string
  status: ProjectStatus
  start_date: string
  expected_end_date: string
  share_token: string
  plan_image_url: string | null
  overall_progress: number
  is_demo: boolean
  created_at: string
}

export interface PlanZone {
  id: string
  project_id: string
  name: string
  x_pct: number
  y_pct: number
  width_pct: number
  height_pct: number
  color: string
  status: ZoneStatus
  progress_pct: number
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  assigned_to: string
  created_by: string
  zone_id: string | null
  title: string
  description: string | null
  due_date: string
  status: TaskStatus
  created_at: string
}

export interface DailyReport {
  id: string
  project_id: string
  engineer_id: string
  zone_id: string | null
  report_date: string
  workers_count: number
  progress_pct: number
  notes: string | null
  issues: string | null
  weather: string | null
  status: ReportStatus
  submitted_at: string | null
  pm_comment?: string | null
}

export interface ReportPhoto {
  id: string
  report_id: string
  url: string
  caption: string | null
  file_size_kb: number
  uploaded_at: string
}

export interface BOQSection {
  id: string
  project_id: string
  title: string
  order_index: number
  status: string
  created_at: string
}

export interface BOQItem {
  id: string
  section_id: string
  description: string
  unit: string
  quantity: number
  unit_rate: number
  budgeted_total: number
  used_quantity: number
  used_total: number
  status: BOQItemStatus
  order_index: number
  updated_at: string
}

/** Returned by get_boq_items_for_role — financial fields are null for engineer/foreman/storekeeper/owner */
export interface BOQItemView {
  id: string
  section_id: string
  description: string
  unit: string
  quantity: number
  unit_rate: number | null
  budgeted_total: number | null
  used_quantity: number
  used_total: number | null
  status: BOQItemStatus
  order_index: number
  updated_at: string
}

export interface MaterialLog {
  id: string
  report_id: string
  boq_item_id: string
  quantity_used: number
  cost_rwf: number
  logged_at: string
}

export interface Notification {
  id: string
  user_id: string
  project_id: string
  type: string
  title: string
  body: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

export interface Invitation {
  id: string
  project_id: string
  company_id: string
  invited_by: string
  email: string
  role: UserRole
  token: string
  accepted: boolean
  created_at: string
  expires_at: string
}
