export function formatRole(role: string): string {
  const map: Record<string, string> = {
    engineer: 'Site Engineer',
    pm: 'Project Manager',
    foreman: 'Foreman',
    qs: 'Quantity Surveyor',
    storekeeper: 'Storekeeper',
    owner: 'Owner / Client',
    pending: 'Team Member',
  }
  return map[role] ?? role
}

export function generateInviteMessage(
  inviteeName: string | null,
  projectName: string,
  role: string,
  inviterName: string,
  inviteLink: string
): string {
  const roleLabel = formatRole(role)
  const greeting = inviteeName ? `Hello ${inviteeName},` : 'Hello,'

  return `${greeting}

You have been invited to join ${projectName} as ${roleLabel}.

${inviterName} has added you to their construction project on our site management platform.

Click the link below to accept your invitation and set up your account:

${inviteLink}

This link expires in 7 days.`
}
