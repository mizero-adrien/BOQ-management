export const ROLE_LABELS: Record<string, string> = {
  engineer: 'Site Engineer',
  pm: 'Project Manager',
  foreman: 'Foreman',
  qs: 'Quantity Surveyor',
  storekeeper: 'Storekeeper',
  owner: 'Owner',
  procurement: 'Procurement Officer',
  pending: 'Team Member',
}

export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role
}
