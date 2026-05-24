'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Member {
  id: string
  full_name: string | null
  role: string
  created_at: string
}

const mono = 'var(--font-dm-mono)'

export default function TeamPage() {
  const router = useRouter()
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // eslint-disable-next-line react-hooks/immutability
      await fetchMembers(user.id)
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchMembers(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single()

    if (!profile?.org_id) return

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('org_id', profile.org_id)
      .order('created_at')

    if (data) setMembers(data)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--text3)', letterSpacing: '2px', fontSize: '12px' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: '220px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 0',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', marginBottom: '28px', cursor: 'pointer' }}
          onClick={() => router.push('/dashboard')}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '12px', letterSpacing: '2px', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase' }}>RopesTrack</span>
        </div>
        {[
          { icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', path: '/dashboard', label: 'Dashboard' },
          { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', path: '/workers', label: 'Workers' },
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment', label: 'Equipment' },
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team', label: 'Team', active: true },
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa', label: 'JSA' },
          { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', path: '/reports', label: 'Reports' },
        ].map((item, i) => (
          <div key={i} onClick={() => router.push(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px',
            height: '38px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px',
            background: item.active ? 'rgba(232,255,74,0.08)' : 'transparent',
            color: item.active ? 'var(--accent)' : 'var(--text3)',
            position: 'relative',
          }}>
            {item.active && <div style={{ position: 'absolute', left: 0, top: '9px', width: '3px', height: '20px', background: 'var(--accent)', borderRadius: '0 2px 2px 0' }}/>}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={item.icon}/></svg>
            <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: item.active ? 600 : 400, whiteSpace: 'nowrap' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', height: '38px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Logout / Salir</span>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: '220px', flex: 1 }}>
        <header style={{
          height: '56px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Team / Equipo</span>
        </header>

        <div style={{ padding: '28px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                {members.length} Member{members.length !== 1 ? 's' : ''} / Miembro{members.length !== 1 ? 's' : ''}
              </span>
            </div>
            {members.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No team members found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Member / Miembro', 'ID', 'Role / Rol', 'Joined / Ingresó'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px' }}>
                        {m.full_name ?? '—'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>
                        {m.id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontFamily: mono, fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 500,
                          background: m.role === 'admin' ? 'rgba(232,255,74,0.12)' : 'rgba(74,255,160,0.1)',
                          color: m.role === 'admin' ? 'var(--accent)' : 'var(--accent2)',
                          border: `1px solid ${m.role === 'admin' ? 'rgba(232,255,74,0.2)' : 'rgba(74,255,160,0.2)'}`,
                        }}>
                          {m.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>
                        {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
