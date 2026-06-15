import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/auth', '/invite', '/share',
]

const AUTH_ONLY_PATHS = ['/login', '/signup']

// Role-exclusive route prefixes — used to guard cross-role access
const ROLE_PREFIX: Record<string, string> = {
  pm: '/pm',
  foreman: '/foreman',
  qs: '/qs',
  storekeeper: '/storekeeper',
  owner: '/owner',
}

const PROTECTED_PREFIXES = Object.values(ROLE_PREFIX)

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'pm': return '/pm/dashboard'
    case 'engineer': return '/dashboard'
    case 'foreman': return '/foreman/dashboard'
    case 'qs': return '/qs/dashboard'
    case 'storekeeper': return '/storekeeper/dashboard'
    case 'owner': return '/dashboard'
    default: return '/dashboard'
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads the JWT from the cookie without a network round-trip.
  // getUser() makes a Supabase API call on every request which causes 10s timeouts.
  // Routing decisions are optimistic checks; RLS enforces actual data security.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    if (isPublic) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/redirect', request.url))
  }

  const hasCompany = user.user_metadata?.has_company as boolean | undefined
  const onboardingSkipped = user.user_metadata?.onboarding_skipped as boolean | undefined
  const role = (user.user_metadata?.role as string) ?? ''

  // Users without a company must complete onboarding unless they explicitly skipped it
  if (
    !hasCompany && !onboardingSkipped &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/invite') &&
    !pathname.startsWith('/redirect')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Users who have a company should not be on the onboarding page
  if (hasCompany && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/redirect', request.url))
  }

  // Guard cross-role access: redirect to correct dashboard if on wrong role's route
  if (role && hasCompany) {
    const allowedPrefix = ROLE_PREFIX[role]
    const matchedProtected = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p))
    if (matchedProtected && matchedProtected !== allowedPrefix) {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*\\.js).*)',
  ],
}
