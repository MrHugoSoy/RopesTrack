'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Equipment {
  id: string
  name: string
  type: string
  serial_number: string
  status: string
  manufacture_date: string
  last_inspection: string
  next_inspection: string
}

const mono = 'var(--font-dm-mono)'

export default function EquipmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [editingEquip, setEditingEquip] = useState<Equipment | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', type: 'Harness', serial_number: '',
    manufacture_date: '', last_inspection: '', next_inspection: '', status: 'active',
  })
  const [form, setForm] = useState({
    name: '', type: 'Harness', serial_number: '',
    manufacture_date: '', last_inspection: '', next_inspection: '', status: 'active',
  })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) setUserRole(profile.role)
      await fetchEquipment()
      setLoading(false)
    }
    init()
  }, [])

  async function fetchEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  async function handleSave() {
    setSaving(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
      .single()

    const orgId = profile?.org_id
    if (!orgId) { alert('No organization found'); setSaving(false); return }

    const { error } = await supabase.from('equipment').insert({ ...form, org_id: orgId })
    if (error) { alert(error.message); setSaving(false); return }

    const days = form.next_inspection
      ? Math.ceil((new Date(form.next_inspection).getTime() - Date.now()) / 86400000)
      : null

    if (days !== null && days <= 30) {
      await supabase.from('alerts').insert({
        type: days <= 7 ? 'critical' : 'warning',
        message: `Equipment ${form.name} (${form.serial_number}) inspection due in ${days} days.`,
        org_id: orgId,
      })
    }

    setForm({ name: '', type: 'Harness', serial_number: '', manufacture_date: '', last_inspection: '', next_inspection: '', status: 'active' })
    setShowForm(false)
    setSaving(false)
    await fetchEquipment()
  }

  async function handleEdit(eq: Equipment) {
    setEditingEquip(eq)
    setEditForm({
      name: eq.name,
      type: eq.type,
      serial_number: eq.serial_number,
      manufacture_date: eq.manufacture_date || '',
      last_inspection: eq.last_inspection || '',
      next_inspection: eq.next_inspection || '',
      status: eq.status,
    })
  }

  async function handleUpdate() {
    if (!editingEquip) return
    setSaving(true)
    const { error } = await supabase
      .from('equipment')
      .update(editForm)
      .eq('id', editingEquip.id)
    if (error) { alert(error.message); setSaving(false); return }
    setEditingEquip(null)
    setSaving(false)
    await fetchEquipment()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this equipment? This cannot be undone.')) return
    const { error } = await supabase.from('equipment').delete().eq('id', id)
    if (error) { alert(error.message); return }
    await fetchEquipment()
  }

  function getDays(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  }

  function getStatus(eq: Equipment) {
    if (eq.status === 'inspection_required') return 'critical'
    if (!eq.next_inspection) return 'ok'
    const d = getDays(eq.next_inspection)
    if (d <= 7) return 'critical'
    if (d <= 30) return 'warning'
    return 'ok'
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
        width: '64px', background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100,
      }}>
        <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', cursor: 'pointer' }}
          onClick={() => router.push('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
            <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
          </svg>
        </div>
        {[
          { icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', path: '/dashboard' },
          { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', path: '/workers' },
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment', active: true },
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team' },
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa' },
          { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', path: '/reports' },
        ].map((item, i) => (
          <div key={i} onClick={() => router.push(item.path)} style={{
            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
            background: item.active ? 'var(--surface2)' : 'transparent',
            color: item.active ? 'var(--accent)' : 'var(--text3)',
            position: 'relative',
          }}>
            {item.active && <div style={{ position: 'absolute', left: '-1px', width: '3px', height: '20px', background: 'var(--accent)', borderRadius: '0 2px 2px 0' }}/>}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={item.icon}/></svg>
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', cursor: 'pointer', color: 'var(--text3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: '64px', flex: 1 }}>
        <header style={{
          height: '56px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Equipment</span>
          <div style={{ marginLeft: 'auto' }}>
            {userRole !== 'viewer' && (
              <button onClick={() => setShowForm(true)} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '7px 16px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: 'pointer',
              }}>+ Add Equipment</button>
            )}
          </div>
        </header>

        <div style={{ padding: '28px' }}>

          {/* FORM */}
          {showForm && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>New Equipment</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Name', key: 'name', placeholder: 'Petzl Avao Bod Fast' },
                  { label: 'Serial Number', key: 'serial_number', placeholder: 'HAR-001' },
                  { label: 'Manufacture Date', key: 'manufacture_date', type: 'date' },
                  { label: 'Last Inspection', key: 'last_inspection', type: 'date' },
                  { label: 'Next Inspection', key: 'next_inspection', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder || ''}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                        borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                        fontFamily: mono, fontSize: '12px', outline: 'none',
                      }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Type</div>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '8px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                    {['Harness', 'Rope', 'Descender', 'Ascender', 'Anchor', 'Helmet', 'Lanyard', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Status</div>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '8px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                    <option value="active">Active</option>
                    <option value="inspection_required">Inspection Required</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSave} disabled={saving || !form.name || !form.serial_number} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'SAVE EQUIPMENT'}</button>
                <button onClick={() => setShowForm(false)} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* EDIT EQUIPMENT FORM */}
          {editingEquip && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>Edit Equipment</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Name', key: 'name', placeholder: 'Petzl Avao Bod Fast' },
                  { label: 'Serial Number', key: 'serial_number', placeholder: 'HAR-001' },
                  { label: 'Manufacture Date', key: 'manufacture_date', type: 'date' },
                  { label: 'Last Inspection', key: 'last_inspection', type: 'date' },
                  { label: 'Next Inspection', key: 'next_inspection', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder || ''}
                      value={(editForm as any)[field.key]}
                      onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                        borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                        fontFamily: mono, fontSize: '12px', outline: 'none',
                      }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Type</div>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '8px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                    {['Harness', 'Rope', 'Descender', 'Ascender', 'Anchor', 'Helmet', 'Lanyard', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Status</div>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '8px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                    <option value="active">Active</option>
                    <option value="inspection_required">Inspection Required</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleUpdate} disabled={saving || !editForm.name || !editForm.serial_number} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'UPDATE EQUIPMENT'}</button>
                <button onClick={() => setEditingEquip(null)} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                {equipment.length} Items Registered
              </span>
            </div>
            {equipment.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No equipment yet. Click "+ Add Equipment" to register your first item.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Equipment', 'Type', 'Serial', 'Last Inspection', 'Next Inspection', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipment.map(eq => {
                    const s = getStatus(eq)
                    const days = eq.next_inspection ? getDays(eq.next_inspection) : null
                    return (
                      <tr key={eq.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px' }}>{eq.name}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border2)' }}>{eq.type}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{eq.serial_number}</td>
                        <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>
                          {eq.last_inspection ? new Date(eq.last_inspection).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: s === 'critical' ? 'var(--danger)' : s === 'warning' ? 'var(--warning)' : 'var(--text2)' }}>
                          {eq.next_inspection ? new Date(eq.next_inspection).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {days !== null && <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.7 }}>({days}d)</span>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '3px 8px', borderRadius: '3px',
                            background: s === 'critical' ? 'rgba(255,74,74,0.15)' : s === 'warning' ? 'rgba(255,184,74,0.15)' : 'rgba(74,255,160,0.08)',
                            color: s === 'critical' ? 'var(--danger)' : s === 'warning' ? 'var(--warning)' : 'var(--accent2)',
                            border: `1px solid ${s === 'critical' ? 'rgba(255,74,74,0.3)' : s === 'warning' ? 'rgba(255,184,74,0.3)' : 'rgba(74,255,160,0.2)'}`,
                          }}>
                            {s.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(eq)} style={{
                              background: 'transparent', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Edit</button>
                            <button onClick={() => handleDelete(eq.id)} style={{
                              background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255,74,74,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}