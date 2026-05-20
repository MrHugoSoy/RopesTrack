'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Worker {
  id: string
  name: string
  irata_id: string
  level: number
  email: string
  phone: string
  is_active: boolean
  certifications: { expiry_date: string }[]
}

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

export default function WorkersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', irata_id: '', level: 1, email: '', phone: '', is_active: true,
  })
  const [renewingWorker, setRenewingWorker] = useState<Worker | null>(null)
  const [renewForm, setRenewForm] = useState({
    cert_issue: '', cert_expiry: '', cert_number: '',
  })
  const [form, setForm] = useState({
    name: '', irata_id: '', level: 1,
    email: '', phone: '',
    cert_issue: '', cert_expiry: '', cert_number: '',
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
      await fetchWorkers()
      setLoading(false)
    }
    init()
  }, [])

  async function fetchWorkers() {
    const { data } = await supabase
      .from('workers')
      .select('*, certifications(expiry_date)')
      .order('name')
    if (data) setWorkers(data)
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

    const { data: worker, error } = await supabase
      .from('workers')
      .insert({
        name: form.name,
        irata_id: form.irata_id,
        level: form.level,
        email: form.email,
        phone: form.phone,
        org_id: orgId,
      })
      .select()
      .single()

    if (error) { alert(error.message); setSaving(false); return }

    if (form.cert_expiry) {
      await supabase.from('certifications').insert({
        worker_id: worker.id,
        issue_date: form.cert_issue || new Date().toISOString().split('T')[0],
        expiry_date: form.cert_expiry,
        certificate_number: form.cert_number,
        org_id: orgId,
      })
    }

    // Auto-generate alert if expiring soon
    const days = Math.ceil((new Date(form.cert_expiry).getTime() - Date.now()) / 86400000)
    if (days <= 30) {
      await supabase.from('alerts').insert({
        type: days <= 7 ? 'critical' : 'warning',
        message: `${form.name} IRATA L${form.level} cert expires in ${days} days. Renewal required.`,
        related_worker: worker.id,
        org_id: orgId,
      })
    }

    setForm({ name: '', irata_id: '', level: 1, email: '', phone: '', cert_issue: '', cert_expiry: '', cert_number: '' })
    setShowForm(false)
    setSaving(false)
    await fetchWorkers()
  }

  async function handleEdit(worker: Worker) {
    setEditingWorker(worker)
    setEditForm({
      name: worker.name,
      irata_id: worker.irata_id,
      level: worker.level,
      email: worker.email || '',
      phone: worker.phone || '',
      is_active: worker.is_active,
    })
  }

  async function handleUpdate() {
    if (!editingWorker) return
    setSaving(true)
    const { error } = await supabase
      .from('workers')
      .update({
        name: editForm.name,
        irata_id: editForm.irata_id,
        level: editForm.level,
        email: editForm.email,
        phone: editForm.phone,
        is_active: editForm.is_active,
      })
      .eq('id', editingWorker.id)
    if (error) { alert(error.message); setSaving(false); return }
    setEditingWorker(null)
    setSaving(false)
    await fetchWorkers()
  }

  async function handleRenew() {
    if (!renewingWorker) return
    setSaving(true)
    const { error } = await supabase
      .from('certifications')
      .insert({
        worker_id: renewingWorker.id,
        org_id: (await supabase.from('profiles').select('org_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()).data?.org_id,
        issue_date: renewForm.cert_issue,
        expiry_date: renewForm.cert_expiry,
        certificate_number: renewForm.cert_number,
      })
    if (error) { alert(error.message); setSaving(false); return }

    const days = Math.ceil((new Date(renewForm.cert_expiry).getTime() - Date.now()) / 86400000)
    if (days <= 30) {
      await supabase.from('alerts').insert({
        type: days <= 7 ? 'critical' : 'warning',
        message: `${renewingWorker.name} IRATA L${renewingWorker.level} cert expires in ${days} days.`,
        related_worker: renewingWorker.id,
      })
    }

    setRenewingWorker(null)
    setRenewForm({ cert_issue: '', cert_expiry: '', cert_number: '' })
    setSaving(false)
    await fetchWorkers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this worker? This cannot be undone.')) return
    const { error } = await supabase.from('workers').delete().eq('id', id)
    if (error) { alert(error.message); return }
    await fetchWorkers()
  }

  function getDaysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  }

  function getStatus(days: number) {
    if (days <= 7) return 'critical'
    if (days <= 30) return 'warning'
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
          { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', path: '/workers', active: true },
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment' },
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
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Workers</span>
          <div style={{ marginLeft: 'auto' }}>
            {userRole !== 'viewer' && (
              <button onClick={() => setShowForm(true)} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '7px 16px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: 'pointer',
              }}>+ Add Worker</button>
            )}
          </div>
        </header>

        <div style={{ padding: '28px' }}>

          {/* ADD WORKER FORM */}
          {showForm && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '24px', marginBottom: '24px',
            }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>
                New Worker
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'Carlos Mendoza' },
                  { label: 'IRATA ID', key: 'irata_id', placeholder: 'IRT-MX-0001' },
                  { label: 'Email', key: 'email', placeholder: 'carlos@company.com' },
                  { label: 'Phone (WhatsApp)', key: 'phone', placeholder: '+52 477 000 0000' },
                  { label: 'Cert Issue Date', key: 'cert_issue', placeholder: '', type: 'date' },
                  { label: 'Cert Expiry Date', key: 'cert_expiry', placeholder: '', type: 'date' },
                  { label: 'Certificate Number', key: 'cert_number', placeholder: 'CERT-0001' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
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
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>IRATA Level</div>
                  <select
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                      fontFamily: mono, fontSize: '12px', outline: 'none',
                    }}
                  >
                    <option value={1}>Level 1 — Operative</option>
                    <option value={2}>Level 2 — Technician</option>
                    <option value={3}>Level 3 — Supervisor</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSave} disabled={saving || !form.name || !form.irata_id} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'SAVE WORKER'}</button>
                <button onClick={() => setShowForm(false)} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* EDIT WORKER FORM */}
          {editingWorker && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '24px', marginBottom: '24px',
            }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>
                Edit Worker
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'Carlos Mendoza' },
                  { label: 'IRATA ID', key: 'irata_id', placeholder: 'IRT-MX-0001' },
                  { label: 'Email', key: 'email', placeholder: 'carlos@company.com' },
                  { label: 'Phone (WhatsApp)', key: 'phone', placeholder: '+52 477 000 0000' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                    <input
                      type="text"
                      placeholder={field.placeholder}
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
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>IRATA Level</div>
                  <select
                    value={editForm.level}
                    onChange={e => setEditForm(f => ({ ...f, level: Number(e.target.value) }))}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                      fontFamily: mono, fontSize: '12px', outline: 'none',
                    }}
                  >
                    <option value={1}>Level 1 — Operative</option>
                    <option value={2}>Level 2 — Technician</option>
                    <option value={3}>Level 3 — Supervisor</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Status</div>
                  <select
                    value={editForm.is_active ? 'active' : 'inactive'}
                    onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                      fontFamily: mono, fontSize: '12px', outline: 'none',
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleUpdate} disabled={saving || !editForm.name || !editForm.irata_id} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'UPDATE WORKER'}</button>
                <button onClick={() => setEditingWorker(null)} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* RENEW CERTIFICATION FORM */}
          {renewingWorker && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '24px', marginBottom: '24px',
            }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>
                Renew Certification — {renewingWorker.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Cert Issue Date', key: 'cert_issue', type: 'date' },
                  { label: 'Cert Expiry Date', key: 'cert_expiry', type: 'date' },
                  { label: 'Certificate Number', key: 'cert_number', type: 'text', placeholder: 'CERT-0001' },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                    <input
                      type={field.type}
                      placeholder={field.placeholder || ''}
                      value={(renewForm as any)[field.key]}
                      onChange={e => setRenewForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                        borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
                        fontFamily: mono, fontSize: '12px', outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleRenew} disabled={saving || !renewForm.cert_expiry} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'RENEW CERTIFICATION'}</button>
                <button onClick={() => setRenewingWorker(null)} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* WORKERS TABLE */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                {workers.length} Workers Registered
              </span>
            </div>
            {workers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No workers yet. Click "+ Add Worker" to register your first technician.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Worker', 'IRATA Level', 'Cert Expiry', 'Days Left', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => {
                    const cert = w.certifications?.[0]
                    const days = cert ? getDaysUntil(cert.expiry_date) : null
                    const status = days !== null ? getStatus(days) : 'ok'
                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: w.is_active ? 'var(--accent2)' : 'var(--text3)', display: 'inline-block', marginRight: '6px' }}/>
                            {w.name}
                          </div>
                          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>{w.irata_id}</div>
                          {w.email && <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>{w.email}</div>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '3px 7px', borderRadius: '3px', fontWeight: 500,
                            background: w.level === 3 ? 'rgba(232,255,74,0.12)' : w.level === 2 ? 'rgba(74,255,160,0.1)' : 'rgba(138,158,147,0.1)',
                            color: w.level === 3 ? 'var(--accent)' : w.level === 2 ? 'var(--accent2)' : 'var(--text2)',
                            border: `1px solid ${w.level === 3 ? 'rgba(232,255,74,0.2)' : w.level === 2 ? 'rgba(74,255,160,0.2)' : 'var(--border2)'}`,
                          }}>
                            L{w.level} {w.level === 3 ? 'SUPERVISOR' : w.level === 2 ? 'TECHNICIAN' : 'OPERATIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '12px', color: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--text2)' }}>
                          {cert ? new Date(cert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {days !== null ? (
                            <span style={{
                              fontFamily: mono, fontSize: '10px', padding: '2px 7px', borderRadius: '2px',
                              background: status === 'critical' ? 'rgba(255,74,74,0.15)' : status === 'warning' ? 'rgba(255,184,74,0.15)' : 'rgba(74,255,160,0.08)',
                              color: status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--accent2)',
                            }}>{days}d</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: mono, fontSize: '10px', color: w.is_active ? 'var(--accent2)' : 'var(--text3)' }}>
                            {w.is_active ? '● ACTIVE' : '○ INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(w)} style={{
                              background: 'transparent', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Edit</button>
                            <button onClick={() => handleDelete(w.id)} style={{
                              background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255,74,74,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Delete</button>
                            <button onClick={() => setRenewingWorker(w)} style={{
                              background: 'transparent', color: 'var(--accent)', border: '1px solid rgba(232,255,74,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Renew</button>
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