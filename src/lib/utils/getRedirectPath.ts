export function getRedirectPath(role: string, projectId?: string): string {
  switch (role) {
    case 'pm': return '/pm/dashboard'
    case 'engineer': return '/dashboard'
    case 'foreman': return '/foreman/dashboard'
    case 'qs': return '/qs/dashboard'
    case 'storekeeper': return '/storekeeper/dashboard'
    case 'procurement': return '/procurement/dashboard'
    case 'owner': return projectId ? `/owner/${projectId}` : '/dashboard'
    default: return '/dashboard'
  }
}
