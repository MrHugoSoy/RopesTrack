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
  const [search, setSearch] = useState('')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchWorkers() {
    const { data } = await supabase
      .from('workers')
      .select('*, certifications(expiry_date)')
      .order('name')
    if (data) {
      const sorted = data.map(w => ({
        ...w,
        certifications: (w.certifications ?? []).sort(
          (a: { expiry_date: string }, b: { expiry_date: string }) =>
            new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime()
        ),
      }))
      setWorkers(sorted)
    }
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
    console.log('handleRenew called', renewForm, renewingWorker)
    if (!renewingWorker) return
    if (!renewForm.cert_expiry) { alert('Expiry date is required'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) { alert('No organization found'); setSaving(false); return }

    const { error } = await supabase.from('certifications').insert({
      worker_id: renewingWorker.id,
      org_id: profile.org_id,
      issue_date: renewForm.cert_issue || new Date().toISOString().split('T')[0],
      expiry_date: renewForm.cert_expiry,
      certificate_number: renewForm.cert_number || null,
      issuing_body: 'IRATA',
    })

    if (error) { alert(error.message); setSaving(false); return }

    const days = Math.ceil((new Date(renewForm.cert_expiry).getTime() - Date.now()) / 86400000)
    if (days <= 30) {
      await supabase.from('alerts').insert({
        type: days <= 7 ? 'critical' : 'warning',
        message: `${renewingWorker.name} IRATA L${renewingWorker.level} cert expires in ${days} days.`,
        related_worker: renewingWorker.id,
        org_id: profile.org_id,
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
          { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', path: '/workers', label: 'Workers', active: true },
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
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Workers / Trabajadores</span>
          <div style={{ marginLeft: 'auto' }}>
            {userRole !== 'viewer' && (
              <button onClick={() => setShowForm(true)} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '7px 16px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: 'pointer',
              }}>+ Add Worker / Trabajador</button>
            )}
          </div>
        </header>

        {/* DRAWER FORMS */}
        {(showForm || !!editingWorker || !!renewingWorker) && (
          <>
            <div onClick={() => { setShowForm(false); setEditingWorker(null); setRenewingWorker(null) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
            <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '440px', background: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                  {showForm ? 'New Worker / Nuevo Trabajador' : editingWorker ? 'Edit Worker / Editar Trabajador' : `Renew Cert / Renovar · ${renewingWorker?.name}`}
                </span>
                <button onClick={() => { setShowForm(false); setEditingWorker(null); setRenewingWorker(null) }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {showForm && <>
                  {[
                    { label: 'Full Name', key: 'name', placeholder: 'Carlos Mendoza' },
                    { label: 'IRATA ID', key: 'irata_id', placeholder: 'IRT-MX-0001' },
                    { label: 'Email', key: 'email', placeholder: 'carlos@company.com' },
                    { label: 'Phone (WhatsApp)', key: 'phone', placeholder: '+52 477 000 0000' },
                    { label: 'Cert Issue Date', key: 'cert_issue', type: 'date' },
                    { label: 'Cert Expiry Date', key: 'cert_expiry', type: 'date' },
                    { label: 'Certificate Number', key: 'cert_number', placeholder: 'CERT-0001' },
                  ].map(field => (
                    <div key={field.key}>
                      <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                      <input type={field.type || 'text'} placeholder={field.placeholder || ''} value={(form as unknown as Record<string, string>)[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>IRATA Level</div>
                    <select value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                      <option value={1}>Level 1 / Operative</option>
                      <option value={2}>Level 2 / Technician</option>
                      <option value={3}>Level 3 / Supervisor</option>
                    </select>
                  </div>
                </>}
                {editingWorker && <>
                  {[
                    { label: 'Full Name', key: 'name', placeholder: 'Carlos Mendoza' },
                    { label: 'IRATA ID', key: 'irata_id', placeholder: 'IRT-MX-0001' },
                    { label: 'Email', key: 'email', placeholder: 'carlos@company.com' },
                    { label: 'Phone (WhatsApp)', key: 'phone', placeholder: '+52 477 000 0000' },
                  ].map(field => (
                    <div key={field.key}>
                      <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                      <input type="text" placeholder={field.placeholder} value={(editForm as unknown as Record<string, string>)[field.key]}
                        onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>IRATA Level</div>
                    <select value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: Number(e.target.value) }))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                      <option value={1}>Level 1 / Operative</option>
                      <option value={2}>Level 2 / Technician</option>
                      <option value={3}>Level 3 / Supervisor</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Status / Estado</div>
                    <select value={editForm.is_active ? 'active' : 'inactive'} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none' }}>
                      <option value="active">Active / Activo</option>
                      <option value="inactive">Inactive / Inactivo</option>
                    </select>
                  </div>
                </>}
                {renewingWorker && <>
                  {[
                    { label: 'Cert Issue Date', key: 'cert_issue', type: 'date' },
                    { label: 'Cert Expiry Date', key: 'cert_expiry', type: 'date' },
                    { label: 'Certificate Number', key: 'cert_number', placeholder: 'CERT-0001' },
                  ].map(field => (
                    <div key={field.key}>
                      <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>{field.label}</div>
                      <input type={field.type || 'text'} placeholder={field.placeholder || ''} value={(renewForm as unknown as Record<string, string>)[field.key]}
                        onChange={e => setRenewForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '9px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                </>}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                {showForm && <button onClick={handleSave} disabled={saving || !form.name || !form.irata_id} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '9px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500', letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'SAVING...' : 'SAVE / GUARDAR'}</button>}
                {editingWorker && <button onClick={handleUpdate} disabled={saving || !editForm.name || !editForm.irata_id} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '9px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500', letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'SAVING...' : 'UPDATE / ACTUALIZAR'}</button>}
                {renewingWorker && <button onClick={handleRenew} disabled={saving || !renewForm.cert_expiry} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '9px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500', letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'SAVING...' : 'RENEW / RENOVAR'}</button>}
              </div>
            </div>
          </>
        )}

        <div style={{ padding: '28px' }}>

          {/* WORKERS TABLE */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                {workers.length} Workers / Trabajadores
              </span>
              <input
                placeholder="Search / Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginLeft: 'auto', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '5px 12px', color: 'var(--text)', fontFamily: mono, fontSize: '11px', outline: 'none', width: '200px' }}
              />
            </div>
            {workers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No workers yet. Click &quot;+ Add Worker&quot; to register your first technician.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Worker / Trabajador', 'IRATA Level / Nivel', 'Cert Expiry / Venc.', 'Days Left / Días', 'Status / Estado', 'Actions / Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.irata_id.toLowerCase().includes(search.toLowerCase())).map(w => {
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
                            L{w.level} {w.level === 3 ? 'SUPERVISOR' : w.level === 2 ? 'TECHNICIAN / TÉCNICO' : 'OPERATIVE / OPERATIVO'}
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
                            {w.is_active ? '● ACTIVE / ACTIVO' : '○ INACTIVE / INACTIVO'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(w)} style={{
                              background: 'transparent', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Edit / Editar</button>
                            <button onClick={() => handleDelete(w.id)} style={{
                              background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255,74,74,0.2)',
                              borderRadius: '3px', padding: '3px 10px', fontFamily: mono, fontSize: '10px',
                              letterSpacing: '0.5px', cursor: 'pointer',
                            }}>Delete / Eliminar</button>
                            <button
                              onClick={() => {
                                console.log('Setting renewing worker:', w)
                                setRenewingWorker(w)
                                setRenewForm({ cert_issue: '', cert_expiry: '', cert_number: '' })
                              }}
                              style={{
                                background: 'transparent',
                                color: 'var(--accent)',
                                border: '1px solid rgba(232,255,74,0.3)',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontFamily: mono,
                                fontSize: '10px',
                                cursor: 'pointer',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Renew / Renovar
                            </button>
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