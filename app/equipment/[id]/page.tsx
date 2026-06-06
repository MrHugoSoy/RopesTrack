'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'

interface EquipmentDetail {
  id: string
  name: string
  type: string
  serial_number: string
  status: string
  manufacture_date: string | null
  last_inspection: string | null
  next_inspection: string | null
  org_id: string
}

interface ActivityEntry {
  id: string
  action_type: 'inspection' | 'status_change' | 'note'
  status_result: string | null
  notes: string | null
  performed_by: string | null
  created_at: string
}

const statusResultColor: Record<string, string> = {
  ok:      'var(--accent2)',
  warning: 'var(--warning)',
  failed:  'var(--danger)',
}
const statusResultBg: Record<string, string> = {
  ok:      'rgba(74,255,160,0.08)',
  warning: 'rgba(255,184,74,0.12)',
  failed:  'rgba(255,74,74,0.12)',
}
const statusResultBorder: Record<string, string> = {
  ok:      'rgba(74,255,160,0.2)',
  warning: 'rgba(255,184,74,0.3)',
  failed:  'rgba(255,74,74,0.3)',
}

function ActionIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    inspection:    'M9 12l2 2 4-4',
    status_change: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    note:          'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  }
  const colors: Record<string, string> = {
    inspection:    'var(--accent2)',
    status_change: 'var(--accent)',
    note:          'var(--text3)',
  }
  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors[type] ?? 'var(--text3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[type] ?? paths.note}/>
      </svg>
    </div>
  )
}

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [equip, setEquip] = useState<EquipmentDetail | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [inspForm, setInspForm] = useState({ status_result: 'ok', notes: '' })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile) setUserRole(profile.role)
      await Promise.all([fetchEquip(), fetchActivity()])
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchEquip() {
    const { data } = await supabase.from('equipment').select('*').eq('id', id).single()
    if (data) setEquip(data as EquipmentDetail)
  }

  async function fetchActivity() {
    const { data } = await supabase
      .from('equipment_activity')
      .select('*')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false })
    if (data) setActivity(data as ActivityEntry[])
  }

  async function handleSaveInspection() {
    if (!equip) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, full_name')
      .eq('id', user.id)
      .single()

    const { error: actErr } = await supabase.from('equipment_activity').insert({
      equipment_id: equip.id,
      org_id: equip.org_id,
      user_id: user.id,
      action_type: 'inspection',
      status_result: inspForm.status_result,
      notes: inspForm.notes || null,
      performed_by: profile?.full_name ?? null,
    })

    if (actErr) { alert(actErr.message); setSaving(false); return }

    const today = new Date().toISOString().split('T')[0]
    const updateFields: Record<string, string> = { last_inspection: today }
    if (inspForm.status_result === 'failed') updateFields.status = 'inspection_required'

    await supabase.from('equipment').update(updateFields).eq('id', id)

    setInspForm({ status_result: 'ok', notes: '' })
    setShowForm(false)
    setSaving(false)
    await Promise.all([fetchEquip(), fetchActivity()])
  }

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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--text3)', letterSpacing: '2px', fontSize: '12px' }}>CARGANDO...</span>
    </div>
  )

  if (!equip) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--danger)', letterSpacing: '2px', fontSize: '12px' }}>EQUIPO NO ENCONTRADO</span>
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
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment', label: 'Equipment', active: true },
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team', label: 'Team' },
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa', label: 'JSA' },
          { icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', path: '/jobs', label: 'Jobs' },
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
        <header style={{
          height: '56px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <button onClick={() => router.push('/equipment')} style={{
            background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)',
            borderRadius: '4px', padding: '5px 12px', fontFamily: mono, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.5px',
          }}>← Volver</button>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Equipos</span>
        </header>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* HEADER CARD */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{equip.name}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
                  {equip.type} · {equip.serial_number}
                </div>
              </div>
              <span style={{
                fontFamily: mono, fontSize: '10px', padding: '4px 10px', borderRadius: '3px', fontWeight: 500,
                background: equip.status === 'active' ? 'rgba(74,255,160,0.08)' : equip.status === 'inspection_required' ? 'rgba(255,184,74,0.12)' : 'rgba(255,74,74,0.12)',
                color: equip.status === 'active' ? 'var(--accent2)' : equip.status === 'inspection_required' ? 'var(--warning)' : 'var(--danger)',
                border: `1px solid ${equip.status === 'active' ? 'rgba(74,255,160,0.2)' : equip.status === 'inspection_required' ? 'rgba(255,184,74,0.3)' : 'rgba(255,74,74,0.3)'}`,
              }}>
                {equip.status === 'active' ? 'ACTIVO' : equip.status === 'inspection_required' ? 'REQUIERE INSPECCIÓN' : equip.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={labelStyle}>Última inspección</div>
                <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)' }}>
                  {equip.last_inspection
                    ? new Date(equip.last_inspection).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Próxima inspección</div>
                <div style={{ fontFamily: mono, fontSize: '12px', color: equip.next_inspection && new Date(equip.next_inspection) <= new Date() ? 'var(--danger)' : 'var(--text2)' }}>
                  {equip.next_inspection
                    ? new Date(equip.next_inspection).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              {equip.manufacture_date && (
                <div>
                  <div style={labelStyle}>Fecha fabricación</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)' }}>
                    {new Date(equip.manufacture_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVITY */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                Historial de Actividad
              </span>
              <button onClick={() => setShowForm(v => !v)} style={{
                background: showForm ? 'rgba(232,255,74,0.08)' : 'transparent',
                color: 'var(--accent)', border: '1px solid rgba(232,255,74,0.2)',
                borderRadius: '3px', padding: '4px 14px', fontFamily: mono, fontSize: '10px',
                letterSpacing: '0.5px', cursor: 'pointer',
              }}>
                + Agregar Inspección
              </button>
            </div>

            {/* INLINE INSPECTION FORM */}
            {showForm && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(232,255,74,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={labelStyle}>Estado de la inspección</div>
                  <select value={inspForm.status_result}
                    onChange={e => setInspForm(f => ({ ...f, status_result: e.target.value }))}
                    style={{ ...inputStyle }}>
                    <option value="ok">OK — Sin observaciones</option>
                    <option value="warning">Advertencia — Requiere seguimiento</option>
                    <option value="failed">Fallido — Fuera de servicio</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Notas (opcional)</div>
                  <textarea
                    placeholder="Observaciones de la inspección..."
                    value={inspForm.notes}
                    onChange={e => setInspForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveInspection} disabled={saving} style={{
                    background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                    padding: '8px 20px', fontFamily: mono, fontSize: '11px', fontWeight: 600,
                    letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}>{saving ? 'GUARDANDO...' : 'GUARDAR INSPECCIÓN'}</button>
                  <button onClick={() => setShowForm(false)} style={{
                    background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                    borderRadius: '4px', padding: '8px 14px', fontFamily: mono, fontSize: '11px', cursor: 'pointer',
                  }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* TIMELINE */}
            {activity.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                Sin actividad registrada. Agrega la primera inspección.
              </div>
            ) : (
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {activity.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: i < activity.length - 1 ? '24px' : '0' }}>
                    {/* Vertical line */}
                    {i < activity.length - 1 && (
                      <div style={{ position: 'absolute', left: '15px', top: '32px', bottom: 0, width: '1px', background: 'var(--border)' }}/>
                    )}
                    <ActionIcon type={entry.action_type} />
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>
                          {new Date(entry.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' '}
                          {new Date(entry.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {entry.performed_by && (
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)', fontWeight: 500 }}>
                            {entry.performed_by}
                          </span>
                        )}
                        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {entry.action_type === 'inspection' ? 'Inspección' : entry.action_type === 'status_change' ? 'Cambio de estado' : 'Nota'}
                        </span>
                        {entry.status_result && (
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', fontWeight: 500,
                            background: statusResultBg[entry.status_result] ?? 'var(--surface2)',
                            color: statusResultColor[entry.status_result] ?? 'var(--text2)',
                            border: `1px solid ${statusResultBorder[entry.status_result] ?? 'var(--border2)'}`,
                          }}>
                            {entry.status_result.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.6 }}>
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
