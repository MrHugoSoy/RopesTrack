'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface JSAWorker {
  id: string
  is_signed: boolean
  signed_at: string | null
  worker: { name: string; irata_id: string; level: number } | null
}

interface JSATask {
  id: string
  task: string
  risks: string
  controls: string
  order_index: number
}

interface JSADetail {
  id: string
  org_id: string
  title: string
  location: string
  date: string
  notes: string
  status: string
  supervisor: { name: string; irata_id: string } | null
  jsa_workers: JSAWorker[]
  jsa_tasks: JSATask[]
}

const mono = 'var(--font-dm-mono)'

export default function JSADetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [jsa, setJsa] = useState<JSADetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [taskForm, setTaskForm] = useState({ task: '', risks: '', controls: '' })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await fetchJSA()
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchJSA() {
    const { data } = await supabase
      .from('jsas')
      .select('id, org_id, title, location, date, notes, status, supervisor:supervisor_id(name, irata_id), jsa_workers(id, is_signed, signed_at, worker:worker_id(name, irata_id, level)), jsa_tasks(id, task, risks, controls, order_index)')
      .eq('id', id)
      .single()
    if (data) setJsa(data as unknown as JSADetail)
  }

  async function handleSign(jsaWorkerId: string) {
    await supabase
      .from('jsa_workers')
      .update({ is_signed: true, signed_at: new Date().toISOString() })
      .eq('id', jsaWorkerId)
    await fetchJSA()
  }

  async function handleStatusChange(status: string) {
    await supabase.from('jsas').update({ status }).eq('id', id)
    await fetchJSA()
  }

  async function handleAddTask() {
    if (!jsa || !taskForm.task) return
    setSaving(true)
    const maxOrder = jsa.jsa_tasks.length > 0
      ? Math.max(...jsa.jsa_tasks.map(t => t.order_index ?? 0)) + 1
      : 1
    const { error } = await supabase.from('jsa_tasks').insert({
      jsa_id: id,
      task: taskForm.task,
      risks: taskForm.risks,
      controls: taskForm.controls,
      order_index: maxOrder,
    })
    if (error) { alert(error.message); setSaving(false); return }
    setTaskForm({ task: '', risks: '', controls: '' })
    setShowTaskForm(false)
    setSaving(false)
    await fetchJSA()
  }

  const statusLabel: Record<string, string> = {
    draft: 'DRAFT / BORRADOR',
    active: 'ACTIVE / ACTIVO',
    completed: 'COMPLETED / COMPLETADO',
    cancelled: 'CANCELLED / CANCELADO',
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

  if (!jsa) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: mono, color: 'var(--danger)', letterSpacing: '2px', fontSize: '12px' }}>JSA NOT FOUND</span>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
    fontFamily: mono, fontSize: '12px', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: mono, fontSize: '10px', color: 'var(--text3)',
    letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' as const,
  }

  const sortedTasks = [...(jsa.jsa_tasks ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

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
          { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '/jsa', label: 'JSA', active: true },
          { icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', path: '/jobs', label: 'Jobs' },
          { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/openings', label: 'Ofertas' },
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
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <button onClick={() => router.push('/jsa')} style={{
            background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)',
            borderRadius: '4px', padding: '5px 12px', fontFamily: mono, fontSize: '11px', cursor: 'pointer',
            letterSpacing: '0.5px',
          }}>← Back / Atrás</button>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>JSA / Análisis de Seguridad</span>
        </header>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* HEADER CARD */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{jsa.title}</div>
                {jsa.location && (
                  <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{jsa.location}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {statusChip(jsa.status)}
                <select
                  value={jsa.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: '3px', padding: '3px 6px', color: 'var(--text2)',
                    fontFamily: mono, fontSize: '10px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="draft">Draft / Borrador</option>
                  <option value="active">Active / Activo</option>
                  <option value="completed">Completed / Completado</option>
                  <option value="cancelled">Cancelled / Cancelado</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {jsa.date && (
                <div>
                  <div style={labelStyle}>Date</div>
                  <div style={{ fontFamily: mono, fontSize: '12px' }}>
                    {new Date(jsa.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
              {jsa.supervisor && (
                <div>
                  <div style={labelStyle}>Supervisor</div>
                  <div style={{ fontFamily: mono, fontSize: '12px' }}>{jsa.supervisor.name}</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)' }}>{jsa.supervisor.irata_id}</div>
                </div>
              )}
              {jsa.notes && (
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>Notes</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{jsa.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* WORKERS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                Workers / Trabajadores ({jsa.jsa_workers?.length ?? 0})
              </span>
            </div>
            {!jsa.jsa_workers?.length ? (
              <div style={{ padding: '32px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No workers assigned.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Worker / Trabajador', 'IRATA ID', 'Level / Nivel', 'Signed / Firma'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jsa.jsa_workers.map(jw => (
                    <tr key={jw.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px' }}>{jw.worker?.name ?? '—'}</td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{jw.worker?.irata_id ?? '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        {jw.worker ? (
                          <span style={{
                            fontFamily: mono, fontSize: '10px', padding: '3px 7px', borderRadius: '3px', fontWeight: 500,
                            background: jw.worker.level === 3 ? 'rgba(232,255,74,0.12)' : jw.worker.level === 2 ? 'rgba(74,255,160,0.1)' : 'rgba(138,158,147,0.1)',
                            color: jw.worker.level === 3 ? 'var(--accent)' : jw.worker.level === 2 ? 'var(--accent2)' : 'var(--text2)',
                            border: `1px solid ${jw.worker.level === 3 ? 'rgba(232,255,74,0.2)' : jw.worker.level === 2 ? 'rgba(74,255,160,0.2)' : 'var(--border2)'}`,
                          }}>
                            L{jw.worker.level} {jw.worker.level === 3 ? 'SUPERVISOR' : jw.worker.level === 2 ? 'TECHNICIAN / TÉCNICO' : 'OPERATIVE / OPERATIVO'}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {jw.is_signed ? (
                          <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--accent2)', letterSpacing: '0.5px' }}>
                            ✓ SIGNED / FIRMADO
                            {jw.signed_at && (
                              <span style={{ color: 'var(--text3)', marginLeft: '8px', fontSize: '10px' }}>
                                {new Date(jw.signed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </span>
                        ) : (
                          <button onClick={() => handleSign(jw.id)} style={{
                            background: 'transparent', color: 'var(--accent)', border: '1px solid rgba(232,255,74,0.2)',
                            borderRadius: '3px', padding: '3px 12px', fontFamily: mono, fontSize: '10px',
                            letterSpacing: '0.5px', cursor: 'pointer',
                          }}>Sign / Firmar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TASKS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                Tasks / Tareas ({sortedTasks.length})
              </span>
              <button onClick={() => setShowTaskForm(v => !v)} style={{
                background: 'transparent', color: 'var(--accent2)', border: '1px solid rgba(74,255,160,0.2)',
                borderRadius: '3px', padding: '3px 12px', fontFamily: mono, fontSize: '10px', cursor: 'pointer',
              }}>+ Add Task / Tarea</button>
            </div>

            {sortedTasks.length === 0 && !showTaskForm ? (
              <div style={{ padding: '32px', textAlign: 'center', fontFamily: mono, fontSize: '12px', color: 'var(--text3)' }}>
                No tasks defined.
              </div>
            ) : sortedTasks.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Task / Tarea', 'Risks / Riesgos', 'Controls / Controles'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', width: '48px' }}>{i + 1}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500 }}>{t.task}</td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{t.risks || '—'}</td>
                      <td style={{ padding: '14px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{t.controls || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* ADD TASK DRAWER */}
      {showTaskForm && (
        <>
          <div onClick={() => setShowTaskForm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '440px', background: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>Add Task / Agregar Tarea</span>
              <button onClick={() => setShowTaskForm(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'task', label: 'Task / Tarea', placeholder: 'Task description' },
                { key: 'risks', label: 'Risks / Riesgos', placeholder: 'Potential risks' },
                { key: 'controls', label: 'Controls / Controles', placeholder: 'Control measures' },
              ].map(f => (
                <div key={f.key}>
                  <div style={labelStyle}>{f.label}</div>
                  <input type="text" placeholder={f.placeholder}
                    value={(taskForm as Record<string, string>)[f.key]}
                    onChange={e => setTaskForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, boxSizing: 'border-box' as const }} />
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <button onClick={handleAddTask} disabled={saving || !taskForm.task} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '8px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, flex: 1,
              }}>{saving ? 'SAVING...' : 'ADD TASK / AGREGAR'}</button>
              <button onClick={() => setShowTaskForm(false)} style={{
                background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                borderRadius: '4px', padding: '8px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
              }}>Cancel / Cancelar</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
