import { createClient } from '@/lib/supabase/server'
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
        // Auto-create user profile if first login
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!,
          role: 'employee', // default role
          department: user.user_metadata?.department || null
        }, { onConflict: 'id' })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/employee/goals', request.url))
}
