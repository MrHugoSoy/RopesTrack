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

import { useEffect, useRef, useState } from 'react'
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

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente', color: '#e8ff4a' },
  { value: 'aprobada',  label: 'Aprobada',  color: 'rgb(74,255,160)' },
  { value: 'rechazada', label: 'Rechazada', color: 'rgb(255,74,74)' },
]

function StatusSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = STATUS_OPTIONS.find(o => o.value === value) ?? STATUS_OPTIONS[0]
  const sc = getStatusStyle(value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '4px',
          padding: '6px 10px', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, gap: '6px',
        }}>
        <span style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: current.color }}>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke={current.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#0d0f0e', border: '1px solid var(--border2)', borderRadius: '4px',
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} style={{
              width: '100%', textAlign: 'left', background: opt.value === value ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: 'none', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = opt.value === value ? 'rgba(255,255,255,0.05)' : 'transparent')}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: opt.color, flexShrink: 0, display: 'inline-block' }}/>
              <span style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: opt.color }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const SESSION_KEY = 'rt_admin_unlocked'
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? ''

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1200)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '320px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '12px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text)' }}>RopesTrack</span>
        </div>

        <div style={{ background: 'var(--surface)', border: `1px solid ${error ? 'rgba(255,74,74,0.4)' : 'var(--border)'}`, borderRadius: '8px', padding: '32px', transition: 'border-color 0.2s' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>Admin</div>
          <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '28px', textAlign: 'center' }}>ACCESO RESTRINGIDO</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Contraseña</div>
              <input
                ref={inputRef}
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface2)', border: `1px solid ${error ? 'rgba(255,74,74,0.5)' : 'var(--border2)'}`,
                  borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                  fontFamily: mono, fontSize: '14px', outline: 'none', letterSpacing: '4px',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            {error && (
              <div style={{ fontFamily: mono, fontSize: '11px', color: 'rgb(255,74,74)', letterSpacing: '0.5px' }}>
                Contraseña incorrecta.
              </div>
            )}
            <button type="submit" style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase', marginTop: '4px' }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

type AuthUser = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  profile: { role?: string; org_id?: string; organizations?: { name: string } } | null
}

type Org = {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
}

type DeleteTarget = { id: string; label: string; type: 'request' | 'user' | 'org' } | null

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [unlocked, setUnlocked]     = useState(false)
  const [ready, setReady]           = useState(false)
  const [tab, setTab]               = useState<'solicitudes' | 'usuarios' | 'empresas'>('solicitudes')

  // Requests state
  const [requests, setRequests]     = useState<Request[]>([])
  const [filter, setFilter]         = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating]     = useState<string | null>(null)

  // Users state
  const [users, setUsers]           = useState<AuthUser[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  // Orgs state
  const [orgs, setOrgs]             = useState<Org[]>([])
  const [orgsLoaded, setOrgsLoaded] = useState(false)

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true)
  }, [])

  useEffect(() => {
    if (!unlocked) return
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
  }, [unlocked])

  useEffect(() => {
    if (tab !== 'usuarios' || usersLoaded) return
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setUsersLoaded(true) })
      .catch(() => setUsersLoaded(true))
  }, [tab, usersLoaded])

  useEffect(() => {
    if (tab !== 'empresas' || orgsLoaded) return
    fetch('/api/admin/orgs')
      .then(r => r.json())
      .then(data => { setOrgs(Array.isArray(data) ? data : []); setOrgsLoaded(true) })
      .catch(() => setOrgsLoaded(true))
  }, [tab, orgsLoaded])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await supabase.from('verified_requests').update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    if (deleteTarget.type === 'request') {
      await supabase.from('verified_requests').delete().eq('id', deleteTarget.id)
      setRequests(prev => prev.filter(r => r.id !== deleteTarget.id))
    } else if (deleteTarget.type === 'user') {
      await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
    } else {
      await fetch(`/api/admin/orgs?id=${deleteTarget.id}`, { method: 'DELETE' })
      setOrgs(prev => prev.filter(o => o.id !== deleteTarget.id))
    }
    setDeleting(false)
    setDeleteTarget(null)
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

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

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

        {/* Title + tabs */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Panel de administración</div>
          <h1 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '3px', margin: '0 0 28px', color: 'var(--text)' }}>
            {tab === 'solicitudes' ? 'SOLICITUDES DE ACCESO' : 'GESTIÓN DE USUARIOS'}
          </h1>

          {/* Main tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
            {([
              { key: 'solicitudes', label: 'Solicitudes de Acceso' },
              { key: 'usuarios',    label: 'Usuarios' },
              { key: 'empresas',    label: 'Empresas' },
            ] as { key: typeof tab; label: string }[]).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                fontFamily: mono, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer', padding: '10px 20px', border: 'none', background: 'none',
                color: tab === key ? 'var(--text)' : 'var(--text3)',
                borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
                marginBottom: '-1px', transition: 'color 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Solicitudes: filter chips */}
          {tab === 'solicitudes' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          )}
        </div>

        {/* ── TAB: SOLICITUDES ──────────────────────────────────────────────────── */}
        {tab === 'solicitudes' && (
          <>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px' }}>
                  No hay solicitudes {filter !== 'all' ? `con estado "${filter}"` : ''}.
                </div>
              </div>
            )}

            {filtered.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 2fr 0.8fr 90px 140px 110px', gap: '12px', padding: '0 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  {['Empresa', 'País', 'Email', 'Técnicos', 'Fecha', 'Estado', 'Acciones'].map(h => (
                    <span key={h} style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {filtered.map(req => {
                    const status = req.status ?? 'pendiente'
                    const expanded = expandedId === req.id
                    const date = new Date(req.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                    return (
                      <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 2fr 0.8fr 90px 140px 110px', gap: '12px', padding: '14px 16px', alignItems: 'center' }}>
                          <span style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.company_name}</span>
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{req.country || '—'}</span>
                          <a href={`mailto:${req.email}`} style={{ fontFamily: mono, fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>{req.email}</a>
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{req.team_size || '—'}</span>
                          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>{date}</span>
                          <StatusSelect value={status} onChange={v => updateStatus(req.id, v)} disabled={updating === req.id} />
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {req.message && (
                              <button onClick={() => setExpandedId(expanded ? null : req.id)} title="Ver mensaje"
                                style={{ background: expanded ? 'rgba(232,255,74,0.1)' : 'var(--surface2)', border: `1px solid ${expanded ? 'rgba(232,255,74,0.3)' : 'var(--border2)'}`, borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: expanded ? 'var(--accent)' : 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                              </button>
                            )}
                            <a href={`mailto:${req.email}?subject=RopesTrack%20%E2%80%94%20Solicitud%20de%20acceso%20verificado`} title="Enviar email"
                              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </a>
                            <button onClick={() => setDeleteTarget({ id: req.id, label: req.company_name, type: 'request' })} title="Eliminar"
                              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '5px 7px', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,74,74,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,74,74,0.3)'; e.currentTarget.style.color = 'rgb(255,74,74)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>
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
          </>
        )}

        {/* ── TAB: USUARIOS ─────────────────────────────────────────────────────── */}
        {tab === 'usuarios' && (
          <>
            {!usersLoaded && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Cargando usuarios...</span>
              </div>
            )}

            {usersLoaded && users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px' }}>No hay usuarios registrados.</div>
              </div>
            )}

            {usersLoaded && users.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 80px', gap: '12px', padding: '0 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Registrado', 'Último acceso', 'Organización', 'Acción'].map(h => (
                    <span key={h} style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {users.map(u => {
                    const created = new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                    const lastLogin = u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                      : '—'
                    const orgName = (u.profile?.organizations as { name?: string } | null)?.name ?? '—'
                    const isAdminUser = u.email === ADMIN_EMAIL
                    return (
                      <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 80px', gap: '12px', padding: '14px 16px', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                          {isAdminUser && <span style={{ fontFamily: mono, fontSize: '9px', color: 'var(--accent)', background: 'rgba(232,255,74,0.1)', border: '1px solid rgba(232,255,74,0.25)', borderRadius: '3px', padding: '1px 6px', flexShrink: 0 }}>ADMIN</span>}
                        </div>
                        <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{created}</span>
                        <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{lastLogin}</span>
                        <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orgName}</span>
                        <button
                          disabled={isAdminUser}
                          onClick={() => setDeleteTarget({ id: u.id, label: u.email, type: 'user' })}
                          title={isAdminUser ? 'No puedes eliminar al administrador' : 'Eliminar usuario por incumplimiento'}
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '6px 10px', cursor: isAdminUser ? 'not-allowed' : 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px', opacity: isAdminUser ? 0.4 : 1, fontFamily: mono, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}
                          onMouseEnter={e => { if (!isAdminUser) { e.currentTarget.style.background = 'rgba(255,74,74,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,74,74,0.3)'; e.currentTarget.style.color = 'rgb(255,74,74)' } }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          Eliminar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TAB: EMPRESAS ─────────────────────────────────────────────────────── */}
        {tab === 'empresas' && (
          <>
            {!orgsLoaded && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Cargando empresas...</span>
              </div>
            )}

            {orgsLoaded && orgs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px' }}>No hay empresas registradas.</div>
              </div>
            )}

            {orgsLoaded && orgs.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1.2fr 80px', gap: '12px', padding: '0 16px 10px', borderBottom: '1px solid var(--border)' }}>
                  {['Empresa', 'Slug', 'Plan', 'Registrada', 'Acción'].map(h => (
                    <span key={h} style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {orgs.map(org => (
                    <div key={org.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1.2fr 80px', gap: '12px', padding: '14px 16px', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <span style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</span>
                      <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{org.slug}</span>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.2)', borderRadius: '3px', padding: '2px 8px', textTransform: 'uppercase' }}>{org.plan ?? 'free'}</span>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>
                        {new Date(org.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                      <button
                        onClick={() => setDeleteTarget({ id: org.id, label: org.name, type: 'org' })}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: mono, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,74,74,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,74,74,0.3)'; e.currentTarget.style.color = 'rgb(255,74,74)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,74,74,0.3)', borderRadius: '8px', padding: '32px', maxWidth: '420px', width: '90%' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,74,74,0.1)', border: '1px solid rgba(255,74,74,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(255,74,74)" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div style={{ fontFamily: bebas, fontSize: '24px', letterSpacing: '2px', color: 'var(--text)', marginBottom: '8px' }}>
              {deleteTarget.type === 'user' ? 'ELIMINAR USUARIO' : deleteTarget.type === 'org' ? 'ELIMINAR EMPRESA' : 'ELIMINAR SOLICITUD'}
            </div>
            <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '8px' }}>
              {deleteTarget.type === 'user'
                ? 'Esta acción eliminará al usuario y todos sus datos de la plataforma. Es irreversible.'
                : deleteTarget.type === 'org'
                ? 'Esta acción eliminará la empresa, todos sus trabajadores, equipos y JSAs. Los usuarios quedarán sin organización. Es irreversible.'
                : 'Esta acción eliminará la solicitud de acceso permanentemente.'}
            </div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'rgb(255,74,74)', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px', padding: '8px 12px', marginBottom: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {deleteTarget.label}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '10px', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, background: 'rgba(255,74,74,0.15)', border: '1px solid rgba(255,74,74,0.4)', borderRadius: '4px', padding: '10px', fontFamily: mono, fontSize: '11px', fontWeight: 700, color: 'rgb(255,74,74)', cursor: deleting ? 'not-allowed' : 'pointer', letterSpacing: '1px', textTransform: 'uppercase', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
