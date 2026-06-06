'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'

interface Posting {
  id: string
  org_id: string
  title: string
  description: string | null
  level_required: number | null
  location: string | null
  country: string | null
  duration: string | null
  start_date: string | null
  status: string
  created_at: string
  organizations: { name: string } | null
}

const levelLabel: Record<number, string> = { 1: 'L1 Operativo', 2: 'L2 Técnico', 3: 'L3 Supervisor' }
const levelColor: Record<number, string> = { 1: 'var(--text2)', 2: 'var(--accent2)', 3: 'var(--accent)' }
const levelBg: Record<number, string> = { 1: 'rgba(138,158,147,0.1)', 2: 'rgba(74,255,160,0.1)', 3: 'rgba(232,255,74,0.12)' }
const levelBorder: Record<number, string> = { 1: 'var(--border2)', 2: 'rgba(74,255,160,0.2)', 3: 'rgba(232,255,74,0.2)' }

const JOBS_ICON = 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'

export default function OpeningsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orgId, setOrgId] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [postings, setPostings] = useState<Posting[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Post job form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', level_required: '', location: '', country: '', duration: '', start_date: '',
  })

  // Apply modal
  const [applyPosting, setApplyPosting] = useState<Posting | null>(null)
  const [applyMsg, setApplyMsg] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

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
      const oid = profile?.org_id ?? null
      setOrgId(oid)

      if (oid) {
        const { data: vc } = await supabase
          .from('verified_companies')
          .select('id')
          .eq('org_id', oid)
          .single()
        if (vc) setIsVerified(true)
      }

      await fetchPostings()
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchPostings() {
    const { data } = await supabase
      .from('job_postings')
      .select('*, organizations(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (data) setPostings(data as unknown as Posting[])
  }

  async function handlePost() {
    if (!form.title || !orgId) return
    setSaving(true)
    const { error } = await supabase.from('job_postings').insert({
      org_id: orgId,
      title: form.title,
      description: form.description || null,
      level_required: form.level_required ? Number(form.level_required) : null,
      location: form.location || null,
      country: form.country || null,
      duration: form.duration || null,
      start_date: form.start_date || null,
      status: 'open',
    })
    if (error) { alert(error.message); setSaving(false); return }
    setForm({ title: '', description: '', level_required: '', location: '', country: '', duration: '', start_date: '' })
    setShowForm(false)
    setSaving(false)
    await fetchPostings()
  }

  async function handleApply() {
    if (!applyPosting) return
    setApplying(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setApplying(false); return }
    const { error } = await supabase.from('job_applications').insert({
      job_id: applyPosting.id,
      worker_id: user.id,
      message: applyMsg.trim() || null,
    })
    if (error) { alert(error.message); setApplying(false); return }
    setApplied(true)
    setApplying(false)
  }

  async function handleClose(id: string) {
    await supabase.from('job_postings').update({ status: 'closed' }).eq('id', id)
    await fetchPostings()
  }

  const filtered = postings
    .filter(p => levelFilter === 'all' || p.level_required === Number(levelFilter))
    .filter(p => !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.country ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.organizations?.name ?? '').toLowerCase().includes(search.toLowerCase())
    )

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
    fontFamily: mono, fontSize: '12px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: mono, fontSize: '10px', color: 'var(--text3)',
    letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' as const,
  }
  const selectStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '4px',
    padding: '7px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '11px', outline: 'none', cursor: 'pointer',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--text3)', letterSpacing: '2px', fontSize: '12px' }}>CARGANDO...</span>
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
          { icon: JOBS_ICON, path: '/jobs', label: 'Jobs' },
          { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/openings', label: 'Ofertas', active: true },
          { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', path: '/reports', label: 'Reports' },
        ].filter(item => !(userRole === 'independent' || !orgId) || (item.path !== '/workers' && item.path !== '/team'))
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
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Ofertas de Trabajo</span>
          <div style={{ width: '1px', height: '18px', background: 'var(--border)' }}/>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Publicadas por empresas verificadas</span>
          {isVerified && (
            <button onClick={() => setShowForm(v => !v)} style={{
              marginLeft: 'auto', background: 'var(--accent)', color: '#0d0f0e', border: 'none',
              borderRadius: '4px', padding: '7px 16px', fontFamily: mono, fontSize: '11px',
              fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
            }}>+ Publicar Oferta</button>
          )}
        </header>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* POST FORM */}
          {showForm && isVerified && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(232,255,74,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '3px', background: 'var(--accent)' }}/>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>Nueva Oferta de Trabajo</span>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Título del puesto *</div>
                  <input placeholder="Técnico IRATA L2 para proyecto en altura" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Nivel IRATA requerido</div>
                  <select value={form.level_required} onChange={e => setForm(f => ({ ...f, level_required: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Cualquier nivel</option>
                    <option value="1">L1 Operativo</option>
                    <option value="2">L2 Técnico</option>
                    <option value="3">L3 Supervisor</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Duración</div>
                  <input placeholder="3 semanas / 2 meses" value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Ubicación</div>
                  <input placeholder="Ciudad de México" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>País</div>
                  <input placeholder="México" value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Fecha de inicio</div>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Descripción del proyecto</div>
                  <textarea placeholder="Describe el proyecto, requisitos específicos, condiciones de trabajo..." rows={4}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                  <button onClick={handlePost} disabled={saving || !form.title} style={{
                    background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                    padding: '9px 24px', fontFamily: mono, fontSize: '11px', fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving || !form.title ? 0.6 : 1,
                  }}>{saving ? 'PUBLICANDO...' : 'Publicar Oferta'}</button>
                  <button onClick={() => setShowForm(false)} style={{
                    background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                    borderRadius: '4px', padding: '9px 16px', fontFamily: mono, fontSize: '11px', cursor: 'pointer',
                  }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={selectStyle}>
              <option value="all">Todos los niveles</option>
              <option value="1">L1 Operativo</option>
              <option value="2">L2 Técnico</option>
              <option value="3">L3 Supervisor</option>
            </select>
            <input placeholder="Buscar por título, empresa o ubicación..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, width: '280px', cursor: 'text' }} />
            <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
              {filtered.length} oferta{filtered.length !== 1 ? 's' : ''} activa{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* POSTINGS */}
          {filtered.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '64px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
              No hay ofertas activas en este momento.{isVerified && ' Publica la primera oferta usando el botón de arriba.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(p => (
                <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '3px', background: p.level_required ? (levelColor[p.level_required] ?? 'var(--text3)') : 'var(--border)' }}/>
                  <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                    {/* LEFT */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{p.title}</span>
                        {p.level_required && (
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', fontWeight: 500,
                            background: levelBg[p.level_required], color: levelColor[p.level_required], border: `1px solid ${levelBorder[p.level_required]}`,
                          }}>
                            {levelLabel[p.level_required]}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--accent2)', fontWeight: 500 }}>
                          {p.organizations?.name ?? '—'}
                        </span>
                        {(p.location || p.country) && (
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {[p.location, p.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {p.duration && (
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {p.duration}
                          </span>
                        )}
                        {p.start_date && (
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>
                            Inicio: {new Date(p.start_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {p.description && (
                        <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)', lineHeight: 1.7 }}>
                          {p.description.length > 200 ? p.description.slice(0, 200) + '…' : p.description}
                        </div>
                      )}

                      <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '10px' }}>
                        Publicado {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => { setApplyPosting(p); setApplyMsg(''); setApplied(false) }} style={{
                        background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                        padding: '9px 20px', fontFamily: mono, fontSize: '11px', fontWeight: 700,
                        letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>Postularme</button>
                      {isVerified && p.org_id === orgId && (
                        <button onClick={() => handleClose(p.id)} style={{
                          background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)',
                          borderRadius: '4px', padding: '6px 14px', fontFamily: mono, fontSize: '10px',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>Cerrar oferta</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {applyPosting && (
        <>
          <div onClick={() => setApplyPosting(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '460px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', zIndex: 301, overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: applyPosting.level_required ? (levelColor[applyPosting.level_required] ?? 'var(--border)') : 'var(--border)' }}/>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', marginBottom: '2px' }}>Postulación</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{applyPosting.title}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--accent2)', marginTop: '2px' }}>{applyPosting.organizations?.name}</div>
              </div>
              <button onClick={() => setApplyPosting(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applied ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontFamily: mono, fontSize: '28px', color: 'var(--accent2)', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--accent2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>¡Postulación enviada!</div>
                  <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>La empresa recibirá tu solicitud y se pondrá en contacto.</div>
                  <button onClick={() => setApplyPosting(null)} style={{ marginTop: '20px', background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '9px 24px', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}>Cerrar</button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Mensaje (opcional)</div>
                    <textarea placeholder="Cuéntanos sobre tu experiencia relevante para este proyecto..."
                      value={applyMsg} onChange={e => setApplyMsg(e.target.value)} rows={5}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '10px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none', resize: 'vertical' as const }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleApply} disabled={applying} style={{
                      flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                      padding: '10px', fontFamily: mono, fontSize: '11px', fontWeight: 700,
                      letterSpacing: '1px', textTransform: 'uppercase', cursor: applying ? 'not-allowed' : 'pointer',
                      opacity: applying ? 0.6 : 1,
                    }}>{applying ? 'ENVIANDO...' : 'Enviar Postulación'}</button>
                    <button onClick={() => setApplyPosting(null)} style={{
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
