import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Use admin client to bypass any auth context issues during provisioning
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        await adminClient.from('users').upsert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || 
                user.user_metadata?.name ||
                user.email!,
          role: 'employee', // default role for new users
          department: null
        }, { onConflict: 'id' })

        // Get role for redirect
        const { data: userData } = await adminClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = userData?.role || 'employee'
        const redirectPath = role === 'admin'
          ? '/admin/dashboard'
          : role === 'manager'
          ? '/manager/team'
          : '/employee/goals'

        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
  }

  // Fallback to login if something goes wrong
  return NextResponse.redirect(new URL('/login', request.url))
}
