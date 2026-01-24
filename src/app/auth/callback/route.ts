import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  // If there's a redirect parameter, use it. Otherwise, default to /playbook
  const redirectTo = redirect || '/playbook'
  console.log('[Auth Callback] Redirecting to:', redirectTo)

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}
