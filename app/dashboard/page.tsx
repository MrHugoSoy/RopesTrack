'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Worker {
  id: string
  name: string
  irata_id: string
  level: number
  is_active: boolean
  certifications: {
    expiry_date: string
  }[]
}

interface Equipment {
  id: string
  name: string
  type: string
  serial_number: string
  status: string
  next_inspection: string
}

interface Alert {
  id: string
  type: string
  message: string
  created_at: string
  is_read: boolean
  whatsapp_sent: boolean
}

interface OrgProfile {
  org_id: string
  role: string
  organizations: {
    name: string
    slug: string
    plan: string
  }
}

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const typeLabels: Record<string, string> = {
  Harness: 'Harness / Arnés',
  Rope: 'Rope / Cuerda',
  Descender: 'Descender / Descensor',
  Ascender: 'Ascender / Ascendedor',
  Anchor: 'Anchor / Anclaje',
  Helmet: 'Helmet / Casco',
  Lanyard: 'Lanyard / Eslinga',
  Other: 'Other / Otro',
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgProfile | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [collapsedEqGroups, setCollapsedEqGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // eslint-disable-next-line react-hooks/immutability
      await fetchData()
      setLoading(false)
    }
    init()
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAsRead(alertId: string) {
    await supabase.from('alerts').update({ is_read: true }).eq('id', alertId)
    await fetchData()
  }

  async function markAllAsRead() {
    await supabase.from('alerts').update({ is_read: true }).eq('is_read', false)
    await fetchData()
  }

  async function fetchData() {
    const [{ data: w }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('workers').select('*, certifications(expiry_date)').order('name'),
      supabase.from('equipment').select('*').order('name'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(10),
    ])
    if (w) setWorkers(w)
    if (e) setEquipment(e)
    if (a) setAlerts(a)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: roleProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (roleProfile) setUserRole(roleProfile.role)
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role, organizations(name, slug, plan)')
        .eq('id', user.id)
        .single()
      if (profile) setOrg(profile as unknown as OrgProfile)
    }
  }

  function getDaysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  function getExpiryStatus(days: number) {
    if (days <= 7) return 'critical'
    if (days <= 30) return 'warning'
    return 'ok'
  }

  const criticalCount = workers.filter(w => {
    const cert = w.certifications?.[0]
    if (!cert) return false
    return getDaysUntil(cert.expiry_date) <= 30
  }).length

  const equipmentDue = equipment.filter(e =>
    e.status === 'inspection_required' || (e.next_inspection && getDaysUntil(e.next_inspection) <= 30)
  ).length

  const openAlerts = alerts.filter(a => !a.is_read).length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--text3)', letterSpacing: '2px', fontSize: '12px' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: '220px', background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 0',
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
          { icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', path: '/dashboard', label: 'Dashboard', active: true },
          { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', path: '/workers', label: 'Workers' },
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment', label: 'Equipment' },
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team', label: 'Team' },
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={item.icon}/>
            </svg>
            <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: item.active ? 600 : 400, whiteSpace: 'nowrap' }}>{item.label}</span>
          </div>
        ))}

        <div style={{ flex: 1 }}/>
        <div onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', height: '38px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Logout / Salir</span>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: '220px', flex: 1 }}>

        {/* TOPBAR */}
        <header style={{
          height: '56px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)',
          backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>RopesTrack</span>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}/>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>{org?.organizations?.name ?? 'IRATA Compliance Platform'}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
            {openAlerts > 0 && (
              <span style={{
                background: 'var(--danger)', color: '#fff',
                fontFamily: mono, fontSize: '10px',
                padding: '3px 8px', borderRadius: '2px', letterSpacing: '1px',
              }}>{openAlerts} ALERTS / ALERTAS</span>
            )}
            {userRole !== 'viewer' && (
              <button onClick={() => router.push('/workers')} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '7px 16px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: 'pointer',
              }}>+ Add Worker / Trabajador</button>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div style={{ padding: '28px' }}>

          {/* KPI STRIP */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px', background: 'var(--border)',
            border: '1px solid var(--border)', borderRadius: '8px',
            overflow: 'hidden', marginBottom: '24px',
          }}>
            {[
              { label: 'Active Workers / Trabajadores', value: workers.filter(w => w.is_active).length, detail: `${workers.length} total`, status: 'ok' },
              { label: 'Certs Expiring / Por Vencer', value: criticalCount, detail: 'Renewal required / Renovación', status: criticalCount > 0 ? 'danger' : 'ok' },
              { label: 'Equipment Due / Equipos', value: equipmentDue, detail: 'Inspections pending / Por revisar', status: equipmentDue > 0 ? 'warning' : 'ok' },
              { label: 'Open Alerts / Alertas', value: openAlerts, detail: 'Unread / Sin leer', status: openAlerts > 0 ? 'warning' : 'ok' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--surface)', padding: '20px 24px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: kpi.status === 'ok' ? 'var(--accent2)' : kpi.status === 'danger' ? 'var(--danger)' : 'var(--warning)',
                }}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>{kpi.label}</div>
                <div style={{
                  fontFamily: bebas, fontSize: '42px', lineHeight: 1, marginBottom: '4px',
                  color: kpi.status === 'ok' ? 'var(--accent2)' : kpi.status === 'danger' ? 'var(--danger)' : 'var(--warning)',
                }}>{kpi.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{kpi.detail}</div>
              </div>
            ))}
          </div>

          {/* WORKERS + ALERTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* WORKERS TABLE */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>Worker Certifications / Certificaciones</span>
                {criticalCount > 0 && (
                  <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(255,74,74,0.15)', color: 'var(--danger)', border: '1px solid rgba(255,74,74,0.3)' }}>
                    {criticalCount} EXPIRING
                  </span>
                )}
              </div>
              {workers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                  No workers yet.{' '}
                  <span onClick={() => router.push('/workers')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Add your first worker →</span>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {workers.map(worker => {
                      const cert = worker.certifications?.[0]
                      const days = cert ? getDaysUntil(cert.expiry_date) : null
                      const status = days !== null ? getExpiryStatus(days) : 'ok'
                      return (
                        <tr key={worker.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: worker.is_active ? 'var(--accent2)' : 'var(--text3)', display: 'inline-block', marginRight: '6px' }}/>
                              {worker.name}
                            </div>
                            <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>{worker.irata_id}</div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{
                              fontFamily: mono, fontSize: '10px', padding: '3px 7px', borderRadius: '3px', fontWeight: 500,
                              background: worker.level === 3 ? 'rgba(232,255,74,0.12)' : worker.level === 2 ? 'rgba(74,255,160,0.1)' : 'rgba(138,158,147,0.1)',
                              color: worker.level === 3 ? 'var(--accent)' : worker.level === 2 ? 'var(--accent2)' : 'var(--text2)',
                              border: `1px solid ${worker.level === 3 ? 'rgba(232,255,74,0.2)' : worker.level === 2 ? 'rgba(74,255,160,0.2)' : 'var(--border2)'}`,
                            }}>
                              L{worker.level} {worker.level === 3 ? 'SUPERVISOR' : worker.level === 2 ? 'TECHNICIAN' : 'OPERATIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 20px', fontFamily: mono, fontSize: '12px', color: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--text2)' }}>
                            {cert ? new Date(cert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            {days !== null && (
                              <span style={{
                                fontFamily: mono, fontSize: '10px', padding: '2px 7px', borderRadius: '2px',
                                background: status === 'critical' ? 'rgba(255,74,74,0.15)' : status === 'warning' ? 'rgba(255,184,74,0.15)' : 'rgba(74,255,160,0.08)',
                                color: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--accent2)',
                              }}>{days}d</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ALERTS */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>Alert Feed / Alertas</span>
                {openAlerts > 0 && (
                  <span style={{ fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(255,74,74,0.15)', color: 'var(--danger)', border: '1px solid rgba(255,74,74,0.3)' }}>
                    {openAlerts} NEW
                  </span>
                )}
                {openAlerts > 0 && (
                  <span onClick={markAllAsRead} style={{
                    marginLeft: 'auto', fontFamily: mono, fontSize: '10px',
                    color: 'var(--text3)', cursor: 'pointer', textDecoration: 'underline',
                    letterSpacing: '0.5px'
                  }}>Marcar todas</span>
                )}
              </div>
              {alerts.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                  No alerts yet.
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', opacity: alert.is_read ? 0.4 : 1 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '4px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: alert.type === 'critical' ? 'rgba(255,74,74,0.15)' : alert.type === 'warning' ? 'rgba(255,184,74,0.15)' : 'rgba(74,255,160,0.1)',
                      color: alert.type === 'critical' ? 'var(--danger)' : alert.type === 'warning' ? 'var(--warning)' : 'var(--accent2)',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '3px' }}>{alert.message}</div>
                      <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>
                        {new Date(alert.created_at).toLocaleDateString()}
                        {alert.whatsapp_sent && <span style={{ color: '#25d366', marginLeft: '8px' }}>· WhatsApp ✓</span>}
                      </div>
                    </div>
                    {!alert.is_read && (
                      <div onClick={() => markAsRead(alert.id)} style={{
                        marginLeft: 'auto', flexShrink: 0,
                        width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '3px', cursor: 'pointer',
                        background: 'rgba(74,255,160,0.1)',
                        color: 'var(--accent2)', fontSize: '11px',
                      }}>✓</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EQUIPMENT BY GROUP */}
          {(() => {
            const typeOrder = ['Harness', 'Rope', 'Descender', 'Ascender', 'Anchor', 'Helmet', 'Lanyard', 'Other']
            const groups = typeOrder
              .map(type => ({ type, items: equipment.filter(e => e.type === type) }))
              .filter(g => g.items.length > 0)
            const extraTypes = [...new Set(equipment.map(e => e.type))].filter(t => !typeOrder.includes(t))
            extraTypes.forEach(type => groups.push({ type, items: equipment.filter(e => e.type === type) }))

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>Equipment / Equipos</span>
                  {equipmentDue > 0 && (
                    <span style={{ fontFamily: mono, fontSize: '10px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(255,184,74,0.15)', color: 'var(--warning)', border: '1px solid rgba(255,184,74,0.3)' }}>
                      {equipmentDue} DUE
                    </span>
                  )}
                  <span onClick={() => router.push('/equipment')} style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '10px', color: 'var(--accent)', cursor: 'pointer', letterSpacing: '0.5px' }}>
                    Manage / Gestionar →
                  </span>
                </div>
                {equipment.length === 0 ? (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '40px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                    No equipment registered yet.{' '}
                    <span onClick={() => router.push('/equipment')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Add equipment →</span>
                  </div>
                ) : groups.map(({ type, items }) => {
                  const collapsed = collapsedEqGroups.has(type)
                  const toggle = () => setCollapsedEqGroups(prev => {
                    const next = new Set(prev)
                    if (next.has(type)) { next.delete(type) } else { next.add(type) }
                    return next
                  })
                  const groupAlert = items.some(eq => {
                    const days = eq.next_inspection ? getDaysUntil(eq.next_inspection) : null
                    return eq.status === 'inspection_required' || (days !== null && days <= 7)
                  }) ? 'critical' : items.some(eq => {
                    const days = eq.next_inspection ? getDaysUntil(eq.next_inspection) : null
                    return days !== null && days <= 30
                  }) ? 'warning' : 'ok'

                  return (
                    <div key={type} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div onClick={toggle} style={{
                        padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', userSelect: 'none',
                        borderBottom: collapsed ? 'none' : '1px solid var(--border)',
                      }}>
                        <span style={{ fontFamily: mono, fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>{typeLabels[type] ?? type}</span>
                        <span style={{ fontFamily: mono, fontSize: '10px', padding: '1px 7px', borderRadius: '3px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text3)' }}>{items.length}</span>
                        {groupAlert !== 'ok' && (
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '1px 7px', borderRadius: '3px',
                            background: groupAlert === 'critical' ? 'rgba(255,74,74,0.15)' : 'rgba(255,184,74,0.15)',
                            color: groupAlert === 'critical' ? 'var(--danger)' : 'var(--warning)',
                            border: `1px solid ${groupAlert === 'critical' ? 'rgba(255,74,74,0.3)' : 'rgba(255,184,74,0.3)'}`,
                          }}>{groupAlert.toUpperCase()}</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>{collapsed ? '▸' : '▾'}</span>
                      </div>
                      {!collapsed && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)' }}>
                          {items.map(eq => {
                            const days = eq.next_inspection ? getDaysUntil(eq.next_inspection) : null
                            const status = eq.status === 'inspection_required' || (days !== null && days <= 7) ? 'critical' : days !== null && days <= 30 ? 'warning' : 'ok'
                            const pct = days !== null ? Math.min(100, Math.max(0, (days / 365) * 100)) : 80
                            return (
                              <div key={eq.id} style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{eq.name}</div>
                                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginBottom: '10px' }}>SN: {eq.serial_number}</div>
                                <div style={{ height: '3px', background: 'var(--border2)', borderRadius: '2px', marginBottom: '6px' }}>
                                  <div style={{ height: '3px', borderRadius: '2px', width: `${pct}%`, background: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--accent2)' }}/>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>
                                  <span>{days !== null ? `${days}d to inspection` : eq.status}</span>
                                  <span style={{ color: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--accent2)' }}>
                                    {status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}