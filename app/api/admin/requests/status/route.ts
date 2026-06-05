import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifyPin(request: Request): boolean {
  const serverPin = process.env.NEXT_PUBLIC_ADMIN_PIN
  if (!serverPin) return true
  return request.headers.get('X-Admin-Pin') === serverPin
}

export async function PATCH(request: Request) {
  if (!verifyPin(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const { error } = await adminClient().from('verified_requests').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
