import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // ✅ Always filter by user.id
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role || 'employee'
    const path = request.nextUrl.pathname

    // Redirect away from login if already logged in
    if (isLoginPage) {
      const url = request.nextUrl.clone()
      if (role === 'admin') url.pathname = '/admin/dashboard'
      else if (role === 'manager') url.pathname = '/manager/team'
      else url.pathname = '/employee/goals'
      return NextResponse.redirect(url)
    }

    // Role-based path protection
    const url = request.nextUrl.clone()

    if (path.startsWith('/employee') && role !== 'employee') {
      url.pathname = role === 'admin' 
        ? '/admin/dashboard' 
        : '/manager/team'
      return NextResponse.redirect(url)
    }

    if (path.startsWith('/manager') && role === 'employee') {
      url.pathname = '/employee/goals'
      return NextResponse.redirect(url)
    }

    if (path.startsWith('/admin') && role !== 'admin') {
      url.pathname = role === 'manager'
        ? '/manager/team'
        : '/employee/goals'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
