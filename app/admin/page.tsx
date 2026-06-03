'use client'

/*
  SQL to run in Supabase before using this page:

  -- 1. Add status column
  alter table verified_requests add column if not exists status text default 'pendiente';

  -- 2. Allow admin to read
  create policy "admin can read verified_requests"
    on verified_requests for select
    using (auth.email() = 'hugoivanrf@gmail.com');

  -- 3. Allow admin to update
  create policy "admin can update verified_requests"
    on verified_requests for update
    using (auth.email() = 'hugoivanrf@gmail.com');

  -- 4. Allow admin to delete
  create policy "admin can delete verified_requests"
    on verified_requests for delete
    using (auth.email() = 'hugoivanrf@gmail.com');
*/

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'hugoivanrf@gmail.com'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

type Request = {
  id: string
  created_at: string
  company_name: string
  country: string
  email: string
  team_size: string
  message: string
  status: string
}

type Filter = 'all' | 'pendiente' | 'aprobada' | 'rechazada'

const statusStyle = {
  pendiente: { bg: 'rgba(232,255,74,0.1)',  border: 'rgba(232,255,74,0.3)',  text: 'var(--accent)' },
  aprobada:  { bg: 'rgba(74,255,160,0.1)',  border: 'rgba(74,255,160,0.3)',  text: 'rgb(74,255,160)' },
  rechazada: { bg: 'rgba(255,74,74,0.1)',   border: 'rgba(255,74,74,0.3)',   text: 'rgb(255,74,74)' },
}

function getStatusStyle(status: string) {
  return statusStyle[status as keyof typeof statusStyle] ?? statusStyle.pendiente
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace('/login')
        return
      }
      const { data } = await supabase
        .from('verified_requests')
        .select('*')
        .order('created_at', { ascending: false })
      setRequests(data ?? [])
      setReady(true)
    }
    init()
  }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await supabase.from('verified_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  async function deleteRequest(id: string) {
    if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return
    await supabase.from('verified_requests').delete().eq('id', id)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const counts = {
    all:       requests.length,
    pendiente: requests.filter(r => (r.status ?? 'pendiente') === 'pendiente').length,
    aprobada:  requests.filter(r => r.status === 'aprobada').length,
    rechazada: requests.filter(r => r.status === 'rechazada').length,
  }

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => (r.status ?? 'pendiente') === filter)

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Verificando acceso...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
                <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text)' }}>RopesTrack</span>
          </a>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--border2)', letterSpacing: '1px' }}>/</span>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>Admin</span>
        </div>

        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: '4px', padding: '6px 14px', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
          Cerrar sesión
        </button>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Panel de administración</div>
          <h1 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '3px', margin: '0 0 28px', color: 'var(--text)' }}>
            SOLICITUDES DE ACCESO
          </h1>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {([
              { key: 'all',       label: 'Total' },
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'aprobada',  label: 'Aprobadas' },
              { key: 'rechazada', label: 'Rechazadas' },
            ] as { key: Filter; label: string }[]).map(({ key, label }) => {
              const active = filter === key
              const sc = getStatusStyle(key === 'all' ? 'pendiente' : key)
              return (
                <button key={key} onClick={() => setFilter(key)} style={{
                  fontFamily: mono, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: 'pointer', padding: '7px 18px', borderRadius: '4px',
                  border: `1px solid ${active && key !== 'all' ? sc.border : active ? 'var(--border2)' : 'var(--border)'}`,
                  background: active && key !== 'all' ? sc.bg : active ? 'var(--surface)' : 'transparent',
                  color: active && key !== 'all' ? sc.text : active ? 'var(--text)' : 'var(--text3)',
                  transition: 'all 0.1s',
                }}>
                  {label} <span style={{ opacity: 0.7 }}>({counts[key]})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px' }}>
              No hay solicitudes {filter !== 'all' ? `con estado "${filter}"` : ''}.
            </div>
          </div>
        )}

        {/* Table header */}
        {filtered.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.8fr 2fr 0.8fr 90px 140px 110px',
              gap: '12px', padding: '0 16px 10px',
              borderBottom: '1px solid var(--border)',
            }}>
              {['Empresa', 'País', 'Email', 'Técnicos', 'Fecha', 'Estado', 'Acciones'].map(h => (
                <span key={h} style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {filtered.map(req => {
                const status = req.status ?? 'pendiente'
                const sc = getStatusStyle(status)
                const expanded = expandedId === req.id
                const date = new Date(req.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })

                return (
                  <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

                    {/* Main row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 0.8fr 2fr 0.8fr 90px 140px 110px',
                      gap: '12px', padding: '14px 16px', alignItems: 'center',
                    }}>

                      <span style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.company_name}
                      </span>

                      <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>
                        {req.country || '—'}
                      </span>

                      <a href={`mailto:${req.email}`} style={{ fontFamily: mono, fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                        {req.email}
                      </a>

                      <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>
                        {req.team_size || '—'}
                      </span>

                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>
                        {date}
                      </span>

                      {/* Status select */}
                      <select
                        value={status}
                        onChange={e => updateStatus(req.id, e.target.value)}
                        disabled={updating === req.id}
                        style={{
                          fontFamily: mono, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase',
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                          borderRadius: '3px', padding: '5px 8px', cursor: 'pointer', outline: 'none', width: '100%',
                          opacity: updating === req.id ? 0.5 : 1,
                        }}>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobada">Aprobada</option>
                        <option value="rechazada">Rechazada</option>
                      </select>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {req.message && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : req.id)}
                            title="Ver mensaje"
                            style={{ background: expanded ? 'rgba(232,255,74,0.1)' : 'var(--surface2)', border: `1px solid ${expanded ? 'rgba(232,255,74,0.3)' : 'var(--border2)'}`, borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: expanded ? 'var(--accent)' : 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                          </button>
                        )}

                        <a
                          href={`mailto:${req.email}?subject=RopesTrack%20%E2%80%94%20Solicitud%20de%20acceso%20verificado`}
                          title="Enviar email"
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                        </a>

                        <button
                          onClick={() => deleteRequest(req.id)}
                          title="Eliminar"
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,74,74,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,74,74,0.3)'; e.currentTarget.style.color = 'rgb(255,74,74)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded message */}
                    {expanded && req.message && (
                      <div style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--border)', background: 'rgba(232,255,74,0.03)' }}>
                        <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Mensaje</div>
                        <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7 }}>{req.message}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
