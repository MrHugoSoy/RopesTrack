import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const admin = adminClient()

  // Verify the worker belongs to the user's org before deleting
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
  if (profile.role === 'viewer') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: worker } = await admin
    .from('workers')
    .select('id, org_id')
    .eq('id', id)
    .single()

  if (!worker || worker.org_id !== profile.org_id) {
    return NextResponse.json({ error: 'Worker no encontrado' }, { status: 404 })
  }

  // Delete all related data with service role (bypasses RLS)
  await admin.from('jsa_workers').delete().eq('worker_id', id)
  await admin.from('certifications').delete().eq('worker_id', id)
  await admin.from('alerts').delete().eq('related_worker', id)

  const { error } = await admin.from('workers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
