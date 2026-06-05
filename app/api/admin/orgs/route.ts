import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function verifyAdmin(request: Request): boolean {
  const serverPin = process.env.NEXT_PUBLIC_ADMIN_PIN
  if (!serverPin) return true // No PIN configured — PIN gate on client is enough
  return request.headers.get('X-Admin-Pin') === serverPin
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = adminClient()
  const { data, error } = await admin
    .from('organizations')
    .select('id, name, slug, plan, created_at, owner_id')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(request: Request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const admin = adminClient()

  const { data: workers } = await admin.from('workers').select('id').eq('org_id', id)
  const workerIds = (workers ?? []).map((w: { id: string }) => w.id)

  if (workerIds.length > 0) {
    await admin.from('jsa_workers').delete().in('worker_id', workerIds)
    await admin.from('certifications').delete().in('worker_id', workerIds)
  }

  const { data: jsas } = await admin.from('jsas').select('id').eq('org_id', id)
  const jsaIds = (jsas ?? []).map((j: { id: string }) => j.id)
  if (jsaIds.length > 0) {
    await admin.from('jsa_workers').delete().in('jsa_id', jsaIds)
  }

  await admin.from('alerts').delete().eq('org_id', id)
  await admin.from('workers').delete().eq('org_id', id)
  await admin.from('jsas').delete().eq('org_id', id)
  await admin.from('equipment').delete().eq('org_id', id)
  await admin.from('join_requests').delete().eq('org_id', id)
  await admin.from('profiles').update({ org_id: null, role: 'independent' }).eq('org_id', id)

  const { error } = await admin.from('organizations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
