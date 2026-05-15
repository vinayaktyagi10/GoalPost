'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user role for redirect
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .single()

  if (userData?.role === 'admin') {
    redirect('/admin/dashboard')
  } else if (userData?.role === 'manager') {
    redirect('/manager/team')
  } else {
    redirect('/employee/goals')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
