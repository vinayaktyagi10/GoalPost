import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    // Redirect to appropriate dashboard based on role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .single()

    const role = userData?.role || 'employee'
    const url = request.nextUrl.clone()
    
    if (role === 'admin') url.pathname = '/admin/dashboard'
    else if (role === 'manager') url.pathname = '/manager/team'
    else url.pathname = '/employee/goals'
    
    return NextResponse.redirect(url)
  }

  // Basic role-based path protection
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .single()
    
    const role = userData?.role || 'employee'
    const path = request.nextUrl.pathname

    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/employee/goals' // Default fallback
      return NextResponse.redirect(url)
    }

    if (path.startsWith('/manager') && role !== 'manager' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/employee/goals'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
