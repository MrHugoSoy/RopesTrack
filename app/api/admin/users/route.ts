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
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = adminClient()

  const [{ data: authData, error: authError }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, role, org_id, organizations(name)'),
  ])

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const users = (authData?.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    profile: (profiles ?? []).find((p: { id: string }) => p.id === u.id) ?? null,
  }))

  return NextResponse.json(users)
}

export async function DELETE(request: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
  }

  const admin = adminClient()

  // Delete from all related tables before deleting the auth user
  await Promise.all([
    admin.from('profiles').delete().eq('id', id),
    admin.from('workers').delete().eq('user_id', id),
  ])

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
