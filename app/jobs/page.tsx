'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'

interface JobWorker {
  id: string
  name: string
  irata_id: string
  level: number
  is_active: boolean
  is_available: boolean
  whatsapp: string | null
  linkedin: string | null
  bio: string | null
  years_experience: number | null
  location: string | null
  country: string | null
  certifications: { expiry_date: string }[]
  organizations: { name: string } | null
}

const JOBS_ICON = 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'

export default function JobsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [verified, setVerified] = useState<boolean | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [workers, setWorkers] = useState<JobWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [availFilter, setAvailFilter] = useState('available')
  const [search, setSearch] = useState('')
  const [contactWorker, setContactWorker] = useState<JobWorker | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single()

      if (profile) setUserRole(profile.role)
      if (!profile?.org_id) { setVerified(false); setLoading(false); return }

      setOrgId(profile.org_id)

      const { data: vc } = await supabase
        .from('verified_companies')
        .select('id')
        .eq('org_id', profile.org_id)
        .single()

      if (!vc) { setVerified(false); setLoading(false); return }

      setVerified(true)

      const { data } = await supabase
        .from('workers')
        .select('*, certifications(expiry_date), organizations(name)')
        .eq('show_in_job_board', true)
        .eq('is_active', true)

      if (data) setWorkers(data as unknown as JobWorker[])
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend() {
    if (!contactWorker || !message.trim() || !orgId) return
    setSending(true)
    const { error } = await supabase.from('job_contacts').insert({
      worker_id: contactWorker.id,
      org_id: orgId,
      message: message.trim(),
    })
    if (error) { alert(error.message); setSending(false); return }
    setSent(true)
    setSending(false)
  }

  function closeModal() {
    setContactWorker(null)
    setMessage('')
    setSent(false)
  }

  const today = new Date()

  const filtered = workers
    .filter(w => {
      const cert = w.certifications?.[0]
      if (!cert) return false
      return new Date(cert.expiry_date) > today
    })
    .filter(w => levelFilter === 'all' || w.level === Number(levelFilter))
    .filter(w => availFilter === 'all' || w.is_available)
    .filter(w => !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.irata_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (w.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (w.country ?? '').toLowerCase().includes(search.toLowerCase())
    )

  const levelColor: Record<number, string> = { 1: 'var(--text3)', 2: 'var(--accent2)', 3: 'var(--accent)' }
  const levelBg: Record<number, string> = { 1: 'rgba(138,158,147,0.1)', 2: 'rgba(74,255,160,0.1)', 3: 'rgba(232,255,74,0.12)' }
  const levelBorder: Record<number, string> = { 1: 'var(--border2)', 2: 'rgba(74,255,160,0.2)', 3: 'rgba(232,255,74,0.2)' }
  const levelBar: Record<number, string> = { 1: 'var(--text3)', 2: 'var(--accent2)', 3: 'var(--accent)' }
  const levelLabel: Record<number, string> = { 1: 'L1 OPERATIVO', 2: 'L2 TÉCNICO', 3: 'L3 SUPERVISOR' }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '4px',
    padding: '7px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '11px', outline: 'none', cursor: 'pointer',
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
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team', label: 'Team' },
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa', label: 'JSA' },
          { icon: JOBS_ICON, path: '/jobs', label: 'Jobs', active: true },
          { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/openings', label: 'Ofertas' },
          { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', path: '/reports', label: 'Reports' },
        ].filter(item => userRole !== 'independent' || (item.path !== '/workers' && item.path !== '/team'))
        .map((item, i) => (
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

        {/* TOPBAR */}
        <header style={{
          height: '56px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Bolsa de Trabajo</span>
          <div style={{ width: '1px', height: '18px', background: 'var(--border)' }}/>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>IRATA Certified Technicians</span>
          {verified && (
            <span style={{
              marginLeft: 'auto', fontFamily: mono, fontSize: '10px', padding: '3px 10px', borderRadius: '3px',
              background: 'rgba(74,255,160,0.1)', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
              letterSpacing: '0.5px',
            }}>✓ EMPRESA VERIFICADA</span>
          )}
        </header>

        {/* ACCESS RESTRICTED */}
        {verified === false && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '40px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '56px 48px', textAlign: 'center', maxWidth: '460px', width: '100%' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(255,184,74,0.1)', border: '1px solid rgba(255,184,74,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div style={{ fontFamily: mono, fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '14px' }}>
                Acceso Restringido
              </div>
              <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.8, marginBottom: '32px', letterSpacing: '0.3px' }}>
                La bolsa de trabajo está disponible solo para empresas verificadas por RopesTrack.
              </div>
              <a href="mailto:contacto@ropestrack.com" style={{
                display: 'inline-block', background: 'var(--accent)', color: '#0d0f0e', borderRadius: '4px',
                padding: '11px 28px', fontFamily: mono, fontSize: '11px', fontWeight: 700,
                letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Solicitar Acceso
              </a>
            </div>
          </div>
        )}

        {/* JOB BOARD */}
        {verified === true && (
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* FILTERS */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={selectStyle}>
                <option value="all">Todos los niveles</option>
                <option value="1">L1 Operativo</option>
                <option value="2">L2 Técnico</option>
                <option value="3">L3 Supervisor</option>
              </select>
              <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} style={selectStyle}>
                <option value="available">Disponibles</option>
                <option value="all">Todos</option>
              </select>
              <input
                placeholder="Buscar por nombre o ubicación..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...selectStyle, width: '240px', cursor: 'text' }}
              />
              <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
                {filtered.length} técnico{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* GRID */}
            {filtered.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '64px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No hay técnicos disponibles en este momento.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {filtered.map(w => {
                  const cert = w.certifications?.[0]
                  const daysLeft = cert ? Math.ceil((new Date(cert.expiry_date).getTime() - today.getTime()) / 86400000) : null
                  const certStatus = daysLeft !== null ? (daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'warning' : 'ok') : null

                  return (
                    <div key={w.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                      {/* Color bar */}
                      <div style={{ height: '3px', background: levelBar[w.level] ?? 'var(--text3)' }}/>

                      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>

                        {/* Name + availability */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: w.is_available ? 'var(--accent2)' : 'var(--warning)', flexShrink: 0 }}/>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{w.name}</span>
                            </div>
                            <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
                              {w.irata_id}
                              {(w.location || w.country) && (
                                <span style={{ marginLeft: '8px' }}>· {[w.location, w.country].filter(Boolean).join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 500, flexShrink: 0,
                            background: levelBg[w.level], color: levelColor[w.level], border: `1px solid ${levelBorder[w.level]}`,
                          }}>
                            {levelLabel[w.level] ?? `L${w.level}`}
                          </span>
                        </div>

                        {/* Org */}
                        {w.organizations?.name && (
                          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
                            {w.organizations.name}
                          </div>
                        )}

                        {/* Bio */}
                        {w.bio && (
                          <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)', lineHeight: 1.65, borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                            {w.bio.length > 110 ? w.bio.slice(0, 110) + '…' : w.bio}
                          </div>
                        )}

                        {/* Chips row */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                          {w.is_available ? (
                            <span style={{ fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(74,255,160,0.08)', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)' }}>Disponible</span>
                          ) : (
                            <span style={{ fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(255,184,74,0.1)', color: 'var(--warning)', border: '1px solid rgba(255,184,74,0.25)' }}>Ocupado</span>
                          )}
                          {w.years_experience != null && w.years_experience > 0 && (
                            <span style={{ fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border2)' }}>
                              {w.years_experience} años exp.
                            </span>
                          )}
                          {daysLeft !== null && certStatus && (
                            <span style={{
                              fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px',
                              background: certStatus === 'critical' ? 'rgba(255,74,74,0.12)' : certStatus === 'warning' ? 'rgba(255,184,74,0.1)' : 'rgba(74,255,160,0.08)',
                              color: certStatus === 'critical' ? 'var(--danger)' : certStatus === 'warning' ? 'var(--warning)' : 'var(--accent2)',
                              border: `1px solid ${certStatus === 'critical' ? 'rgba(255,74,74,0.3)' : certStatus === 'warning' ? 'rgba(255,184,74,0.25)' : 'rgba(74,255,160,0.2)'}`,
                            }}>
                              Cert: {daysLeft}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact button */}
                      <div style={{ padding: '0 20px 18px' }}>
                        <button onClick={() => { setContactWorker(w); setSent(false); setMessage('') }} style={{
                          width: '100%', background: 'var(--accent)', color: '#0d0f0e', border: 'none',
                          borderRadius: '4px', padding: '9px', fontFamily: mono, fontSize: '11px',
                          fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                        }}>
                          Contactar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTACT MODAL */}
      {contactWorker && (
        <>
          <div onClick={closeModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '460px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', zIndex: 301, overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: levelBar[contactWorker.level] ?? 'var(--text3)' }}/>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', marginBottom: '2px' }}>Contactar a</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{contactWorker.name}</div>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontFamily: mono, fontSize: '28px', color: 'var(--accent2)', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--accent2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>¡Mensaje enviado!</div>
                  <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>Nos pondremos en contacto pronto.</div>
                  <button onClick={closeModal} style={{ marginTop: '20px', background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '9px 24px', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}>Cerrar</button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Mensaje</div>
                    <textarea
                      placeholder="Describe el proyecto, ubicación y duración..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none', resize: 'vertical' as const }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSend} disabled={sending || !message.trim()} style={{
                      flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                      padding: '10px', fontFamily: mono, fontSize: '11px', fontWeight: 700,
                      letterSpacing: '1px', textTransform: 'uppercase', cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !message.trim() ? 0.6 : 1,
                    }}>{sending ? 'ENVIANDO...' : 'Enviar Mensaje'}</button>
                    <button onClick={closeModal} style={{
                      background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                      borderRadius: '4px', padding: '10px 16px', fontFamily: mono, fontSize: '11px', cursor: 'pointer',
                    }}>Cancelar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
