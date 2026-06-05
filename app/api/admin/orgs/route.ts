import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'hugoivanrf@gmail.com'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = adminClient()
  const { data, error } = await admin
    .from('organizations')
    .select('id, name, slug, plan, created_at, owner_id')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(request: Request) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const admin = adminClient()

  // Get all workers in this org first
  const { data: workers } = await admin.from('workers').select('id').eq('org_id', id)
  const workerIds = (workers ?? []).map((w: { id: string }) => w.id)

  // Delete worker-related data
  if (workerIds.length > 0) {
    await admin.from('jsa_workers').delete().in('worker_id', workerIds)
    await admin.from('certifications').delete().in('worker_id', workerIds)
  }

  // Delete org-level data
  await admin.from('alerts').delete().eq('org_id', id)
  await admin.from('workers').delete().eq('org_id', id)
  await admin.from('jsa_workers').delete().in('jsa_id',
    (await admin.from('jsas').select('id').eq('org_id', id)).data?.map((j: { id: string }) => j.id) ?? []
  )
  await admin.from('jsas').delete().eq('org_id', id)
  await admin.from('equipment').delete().eq('org_id', id)
  await admin.from('join_requests').delete().eq('org_id', id)

  // Detach profiles (don't delete the users, just remove from org)
  await admin.from('profiles').update({ org_id: null, role: 'independent' }).eq('org_id', id)

  // Delete the organization
  const { error } = await admin.from('organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
