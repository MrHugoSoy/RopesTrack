'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface JSA {
  id: string
  title: string
  location: string
  date: string
  supervisor_id: string
  notes: string
  status: string
  created_at: string
  supervisor: { name: string } | null
  jsa_workers: { id: string; is_signed: boolean }[]
  jsa_tasks: { id: string }[]
}

interface Worker {
  id: string
  name: string
  level: number
  is_active: boolean
}

const mono = 'var(--font-dm-mono)'

export default function JSAPage() {
  const router = useRouter()
  const supabase = createClient()
  const [jsas, setJsas] = useState<JSA[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', location: '', date: '', supervisor_id: '', notes: '' })
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [tasks, setTasks] = useState<{ task: string; risks: string; controls: string }[]>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await fetchData(user.id)
      setLoading(false)
    }
    init()
  }, [])

  async function fetchData(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .single()

    if (!profile?.org_id) return

    const [{ data: jsaData }, { data: workerData }] = await Promise.all([
      supabase
        .from('jsas')
        .select('*, supervisor:supervisor_id(name), jsa_workers(id, is_signed), jsa_tasks(id)')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('workers')
        .select('id, name, level, is_active')
        .eq('org_id', profile.org_id)
        .eq('is_active', true)
        .order('name'),
    ])

    if (jsaData) setJsas(jsaData as JSA[])
    if (workerData) setWorkers(workerData)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    const orgId = profile?.org_id
    if (!orgId) { alert('No organization found'); setSaving(false); return }

    const { data: jsa, error } = await supabase
      .from('jsas')
      .insert({
        org_id: orgId,
        title: form.title,
        location: form.location,
        date: form.date || null,
        supervisor_id: form.supervisor_id || null,
        notes: form.notes,
        status: 'draft',
      })
      .select()
      .single()

    if (error) { alert(error.message); setSaving(false); return }

    if (tasks.length > 0) {
      await supabase.from('jsa_tasks').insert(
        tasks.filter(t => t.task).map(t => ({
          jsa_id: jsa.id,
          org_id: orgId,
          task: t.task,
          risks: t.risks,
          controls: t.controls,
        }))
      )
    }

    if (selectedWorkers.length > 0) {
      await supabase.from('jsa_workers').insert(
        selectedWorkers.map(wid => ({
          jsa_id: jsa.id,
          worker_id: wid,
          org_id: orgId,
        }))
      )
    }

    setForm({ title: '', location: '', date: '', supervisor_id: '', notes: '' })
    setSelectedWorkers([])
    setTasks([])
    setShowForm(false)
    setSaving(false)
    await fetchData(user.id)
  }

  async function handleStatusChange(id: string, status: string) {
    await supabase.from('jsas').update({ status }).eq('id', id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await fetchData(user.id)
  }

  function toggleWorker(id: string) {
    setSelectedWorkers(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id])
  }

  const statusLabel: Record<string, string> = {
    draft: 'DRAFT — BORRADOR',
    active: 'ACTIVE — ACTIVO',
    completed: 'COMPLETED — COMPLETADO',
    cancelled: 'CANCELLED — CANCELADO',
  }

  function statusChip(status: string) {
    const map: Record<string, { color: string; bg: string; border: string }> = {
      draft:     { color: 'var(--text3)',   bg: 'rgba(138,158,147,0.1)',  border: 'var(--border2)' },
      active:    { color: 'var(--accent2)', bg: 'rgba(74,255,160,0.1)',   border: 'rgba(74,255,160,0.2)' },
      completed: { color: '#4a9fff',        bg: 'rgba(74,159,255,0.1)',   border: 'rgba(74,159,255,0.2)' },
      cancelled: { color: 'var(--danger)',  bg: 'rgba(255,74,74,0.15)',   border: 'rgba(255,74,74,0.3)' },
    }
    const s = map[status] ?? map.draft
    return (
      <span style={{
        fontFamily: mono, fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 500,
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      }}>
        {statusLabel[status] ?? status.toUpperCase()}
      </span>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--text3)', letterSpacing: '2px', fontSize: '12px' }}>LOADING...</span>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
    fontFamily: mono, fontSize: '12px', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: mono, fontSize: '10px', color: 'var(--text3)',
    letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase',
  }

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
          { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', path: '/equipment' },
          { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', path: '/team' },
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa', active: true },
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
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>JSA — Análisis de Seguridad</span>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowForm(true)} style={{
              background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
              padding: '7px 16px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
              letterSpacing: '1px', cursor: 'pointer',
            }}>+ New JSA — Nueva JSA</button>
          </div>
        </header>

        <div style={{ padding: '28px' }}>

          {/* NEW JSA FORM */}
          {showForm && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)', marginBottom: '20px' }}>New JSA — Nueva JSA</div>

              {/* Base fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={labelStyle}>Title</div>
                  <input type="text" placeholder="Roof Anchor Installation" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Location</div>
                  <input type="text" placeholder="Tower A — Floor 12" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Date</div>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Supervisor</div>
                  <select value={form.supervisor_id} onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))} style={inputStyle}>
                    <option value="">— Select supervisor —</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (L{w.level})</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={labelStyle}>Notes</div>
                  <textarea placeholder="Additional notes or context..." value={form.notes} rows={3}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
              </div>

              {/* Workers */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ ...labelStyle, marginBottom: '10px' }}>Assigned Workers — Trabajadores</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {workers.map(w => (
                    <label key={w.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      background: selectedWorkers.includes(w.id) ? 'rgba(232,255,74,0.1)' : 'var(--surface2)',
                      border: `1px solid ${selectedWorkers.includes(w.id) ? 'rgba(232,255,74,0.3)' : 'var(--border2)'}`,
                      borderRadius: '4px', padding: '5px 10px',
                      fontFamily: mono, fontSize: '11px',
                      color: selectedWorkers.includes(w.id) ? 'var(--accent)' : 'var(--text2)',
                    }}>
                      <input type="checkbox" checked={selectedWorkers.includes(w.id)}
                        onChange={() => toggleWorker(w.id)}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                      {w.name}
                    </label>
                  ))}
                  {workers.length === 0 && (
                    <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>No active workers found.</span>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={labelStyle}>Tasks</div>
                  <button onClick={() => setTasks(prev => [...prev, { task: '', risks: '', controls: '' }])} style={{
                    background: 'transparent', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
                    borderRadius: '3px', padding: '2px 10px', fontFamily: mono, fontSize: '10px', cursor: 'pointer',
                  }}>+ Add Task</button>
                </div>
                {tasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 28px', gap: '8px' }}>
                      {['Task — Tarea', 'Risks — Riesgos', 'Controls — Controles'].map(h => (
                        <div key={h} style={labelStyle}>{h}</div>
                      ))}
                      <div/>
                    </div>
                    {tasks.map((t, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 28px', gap: '8px', alignItems: 'center' }}>
                        <input type="text" placeholder="Task description" value={t.task}
                          onChange={e => setTasks(prev => prev.map((x, j) => j === i ? { ...x, task: e.target.value } : x))}
                          style={inputStyle} />
                        <input type="text" placeholder="Potential risks" value={t.risks}
                          onChange={e => setTasks(prev => prev.map((x, j) => j === i ? { ...x, risks: e.target.value } : x))}
                          style={inputStyle} />
                        <input type="text" placeholder="Control measures" value={t.controls}
                          onChange={e => setTasks(prev => prev.map((x, j) => j === i ? { ...x, controls: e.target.value } : x))}
                          style={inputStyle} />
                        <button onClick={() => setTasks(prev => prev.filter((_, j) => j !== i))} style={{
                          background: 'transparent', color: 'var(--danger)', border: 'none',
                          cursor: 'pointer', fontFamily: mono, fontSize: '18px', lineHeight: 1, padding: 0,
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSave} disabled={saving || !form.title} style={{
                  background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                  padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                  letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'SAVING...' : 'SAVE JSA — GUARDAR'}</button>
                <button onClick={() => { setShowForm(false); setTasks([]); setSelectedWorkers([]) }} style={{
                  background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '8px 20px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
                }}>Cancel — Cancelar</button>
              </div>
            </div>
          )}

          {/* JSA TABLE */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                {jsas.length} JSA{jsas.length !== 1 ? 's' : ''}
              </span>
            </div>
            {jsas.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No JSAs yet. Click &quot;+ New JSA&quot; to create your first job safety analysis.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Title — Título', 'Location — Ubicación', 'Date — Fecha', 'Supervisor', 'Workers — Trabajadores', 'Tasks — Tareas', 'Status — Estado', 'Actions — Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jsas.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px' }}>
                        <span onClick={() => router.push(`/jsa/${j.id}`)} style={{ cursor: 'pointer', color: 'var(--text)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
                          {j.title}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{j.location || '—'}</td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>
                        {j.date ? new Date(j.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>
                        {j.supervisor?.name ?? '—'}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)', textAlign: 'center' }}>
                        {j.jsa_workers?.length ?? 0}
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)', textAlign: 'center' }}>
                        {j.jsa_tasks?.length ?? 0}
                      </td>
                      <td style={{ padding: '14px 20px' }}>{statusChip(j.status)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <select
                          value={j.status}
                          onChange={e => handleStatusChange(j.id, e.target.value)}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border2)',
                            borderRadius: '3px', padding: '3px 6px', color: 'var(--text2)',
                            fontFamily: mono, fontSize: '10px', cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="draft">Draft — Borrador</option>
                          <option value="active">Active — Activo</option>
                          <option value="completed">Completed — Completado</option>
                          <option value="cancelled">Cancelled — Cancelado</option>
                        </select>
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
