import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

type CookieEntry = {
  name: string
  value: string
  options: CookieOptions
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDesc = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') ?? '/redirect'

  console.log('[auth/callback] hit ' + JSON.stringify({
    hasCode: Boolean(code),
    errorParam,
    errorDesc,
    incomingCookies: (await cookies()).getAll().map((c) => c.name),
  }))

  if (code) {
    const cookieStore = await cookies()
    const pending: CookieEntry[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pending.push({ name, value, options })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('[auth/callback] exchange OK, setting cookies: ' + JSON.stringify(pending.map((p) => ({ name: p.name, options: p.options }))))
      const response = NextResponse.redirect(new URL(next, requestUrl.origin))
      pending.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }

    console.error('[auth/callback] session exchange failed:', error.message)
  }

  return NextResponse.redirect(
    new URL('/login?error=auth_failed', requestUrl.origin)
  )
}
