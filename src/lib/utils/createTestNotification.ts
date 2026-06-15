import { createClient } from '@/lib/supabase/client'

export async function createTestNotification(userId: string, projectId: string) {
  const supabase = createClient()

  await supabase.from('notifications').insert([
    {
      user_id: userId,
      project_id: projectId,
      type: 'task_assigned',
      title: 'New task assigned',
      body: 'You have been assigned to pour concrete on column B3',
      read: false,
      action_url: '/tasks',
    },
    {
      user_id: userId,
      project_id: projectId,
      type: 'report_reminder',
      title: 'Report reminder',
      body: 'You have not submitted your daily report yet. Submit before 5:00 PM.',
      read: false,
      action_url: '/report/new',
    },
    {
      user_id: userId,
      project_id: projectId,
      type: 'budget_alert',
      title: 'Budget alert',
      body: 'Cement in Block masonry section has reached 80 percent of its budget.',
      read: false,
      action_url: '/boq',
    },
  ])
}
