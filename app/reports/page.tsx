'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'

interface Worker {
  id: string
  name: string
  is_active: boolean
  certifications: { expiry_date: string }[]
}

interface Equipment {
  id: string
  name: string
  type: string
  next_inspection: string | null
  status: string
}

interface JSA {
  id: string
  title: string
  status: string
  date: string
  jsa_workers: { id: string }[]
  jsa_tasks: { id: string }[]
}

interface Alert {
  id: string
  message: string
  type: string
  is_read: boolean
}

export default function ReportsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orgName, setOrgName] = useState('')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [jsas, setJsas] = useState<JSA[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pdfStatus, setPdfStatus] = useState('')

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
      if (!profile?.org_id) { setLoading(false); return }

      const orgId = profile.org_id

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single()

      if (org) setOrgName(org.name)

      const today = new Date().toISOString().split('T')[0]

      const [wRes, eRes, jRes, aRes] = await Promise.all([
        supabase.from('workers').select('id, name, is_active, certifications(expiry_date)').eq('org_id', orgId),
        supabase.from('equipment').select('id, name, type, next_inspection, status').eq('org_id', orgId),
        supabase.from('jsas').select('id, title, status, date, jsa_workers(id), jsa_tasks(id)').eq('org_id', orgId).order('date', { ascending: false }),
        supabase.from('alerts').select('id, message, type, is_read').eq('org_id', orgId).eq('is_read', false),
      ])

      if (wRes.data) setWorkers(wRes.data as unknown as Worker[])
      if (eRes.data) setEquipment(eRes.data as unknown as Equipment[])
      if (jRes.data) setJsas(jRes.data as unknown as JSA[])
      if (aRes.data) setAlerts(aRes.data as unknown as Alert[])

      void today
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = new Date()
  const in30 = new Date(today)
  in30.setDate(today.getDate() + 30)

  const activeWorkers = workers.filter(w => w.is_active)
  const certsExpiring = workers.filter(w =>
    w.certifications?.some(c => {
      const d = new Date(c.expiry_date)
      return d >= today && d <= in30
    })
  ).length
  const equipDue = equipment.filter(e => {
    if (!e.next_inspection) return false
    const d = new Date(e.next_inspection)
    return d >= today && d <= in30
  }).length
  const openAlerts = alerts.length

  async function handleExcel() {
    setGeneratingExcel(true)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Workers sheet
      const wData = workers.map(w => ({
        Name: w.name,
        Status: w.is_active ? 'Active' : 'Inactive',
        'Next Cert Expiry': w.certifications?.length
          ? w.certifications.map(c => c.expiry_date).sort()[0]
          : '—',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wData), 'Workers')

      // Equipment sheet
      const eData = equipment.map(e => ({
        Name: e.name,
        Type: e.type,
        Status: e.status,
        'Next Inspection': e.next_inspection ?? '—',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eData), 'Equipment')

      // JSAs sheet
      const jData = jsas.map(j => ({
        Title: j.title,
        Date: j.date,
        Status: j.status,
        Workers: j.jsa_workers?.length ?? 0,
        Tasks: j.jsa_tasks?.length ?? 0,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jData), 'JSAs')

      // Alerts sheet
      const aData = alerts.map(a => ({
        Message: a.message,
        Type: a.type,
        Read: a.is_read ? 'Yes' : 'No',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aData), 'Alerts')

      const dateStr = today.toISOString().split('T')[0]
      XLSX.writeFile(wb, `ropestrack-report-${dateStr}.xlsx`)
    } catch (err) {
      alert('Error generating Excel: ' + String(err))
    } finally {
      setGeneratingExcel(false)
    }
  }

  async function handleAiPdf() {
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    if (!apiKey) {
      alert('NEXT_PUBLIC_ANTHROPIC_API_KEY is not set.')
      return
    }
    setGeneratingPdf(true)
    setPdfStatus('Asking Claude AI for analysis...')

    try {
      const prompt = `You are a safety compliance analyst. Generate a structured safety & compliance report for an IRATA rope access organization named "${orgName}".

Data summary:
- Active workers: ${activeWorkers.length} / ${workers.length} total
- Certifications expiring in 30 days: ${certsExpiring}
- Equipment inspections due in 30 days: ${equipDue}
- Open (unread) alerts: ${openAlerts}
- Total JSAs on record: ${jsas.length}
- Recent JSA statuses: ${jsas.slice(0, 5).map(j => j.status).join(', ')}

Write the report with these sections:
1. Executive Summary (2-3 sentences)
2. Workforce Compliance
3. Equipment Status
4. JSA Activity
5. Open Alerts & Recommendations
6. Action Items

Keep each section concise (3-5 sentences). Use professional language. Do not use markdown, use plain text only.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      const json = await res.json()
      const reportText: string = json.content?.[0]?.text ?? ''

      setPdfStatus('Building PDF...')

      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const dateStr = today.toISOString().split('T')[0]
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentW = pageW - margin * 2
      let y = margin

      // Header background
      doc.setFillColor(13, 15, 14)
      doc.rect(0, 0, pageW, 30, 'F')
      doc.setTextColor(232, 255, 74)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('ROPESTRACK', margin, 16)
      doc.setFontSize(9)
      doc.setTextColor(180, 190, 185)
      doc.setFont('helvetica', 'normal')
      doc.text(`SAFETY & COMPLIANCE REPORT  |  ${orgName.toUpperCase()}  |  ${dateStr}`, margin, 24)

      y = 40
      doc.setTextColor(13, 15, 14)

      // KPI row
      const kpis = [
        { label: 'Active Workers', value: String(activeWorkers.length) },
        { label: 'Certs Expiring (30d)', value: String(certsExpiring) },
        { label: 'Equip Due (30d)', value: String(equipDue) },
        { label: 'Open Alerts', value: String(openAlerts) },
      ]
      const kpiW = contentW / 4
      kpis.forEach((k, i) => {
        const x = margin + i * kpiW
        doc.setFillColor(245, 247, 245)
        doc.roundedRect(x, y, kpiW - 3, 18, 2, 2, 'F')
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(13, 15, 14)
        doc.text(k.value, x + kpiW / 2 - 1.5, y + 10, { align: 'center' })
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 110, 105)
        doc.text(k.label.toUpperCase(), x + kpiW / 2 - 1.5, y + 15, { align: 'center' })
      })

      y += 26

      // Report body
      const sections = reportText.split(/\n(?=\d+\.\s)/g).filter(s => s.trim())
      for (const section of sections) {
        const lines = section.trim().split('\n')
        const titleLine = lines[0] ?? ''
        const bodyLines = lines.slice(1).join(' ').trim()

        if (y > pageH - 40) {
          doc.addPage()
          y = margin
        }

        // Section title
        doc.setFillColor(232, 255, 74)
        doc.rect(margin, y, 3, 8, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(13, 15, 14)
        doc.text(titleLine.replace(/^\d+\.\s*/, '').toUpperCase(), margin + 6, y + 6)
        y += 12

        // Body text
        if (bodyLines) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(50, 60, 55)
          const wrapped = doc.splitTextToSize(bodyLines, contentW)
          wrapped.forEach((line: string) => {
            if (y > pageH - 30) {
              doc.addPage()
              y = margin
            }
            doc.text(line, margin, y)
            y += 5
          })
          y += 4
        }
      }

      // Footer on all pages
      const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFillColor(13, 15, 14)
        doc.rect(0, pageH - 12, pageW, 12, 'F')
        doc.setFontSize(7)
        doc.setTextColor(180, 190, 185)
        doc.text('Generated by RopesTrack AI · Confidential', margin, pageH - 5)
        doc.text(`Page ${p} / ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' })
      }

      doc.save(`ropestrack-ai-report-${dateStr}.pdf`)
    } catch (err) {
      alert('Error generating PDF: ' + String(err))
    } finally {
      setGeneratingPdf(false)
      setPdfStatus('')
    }
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
          { icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', path: '/jobs', label: 'Jobs' },
          { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/openings', label: 'Ofertas' },
          { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', path: '/reports', label: 'Reports', active: true },
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
          display: 'flex', alignItems: 'center', padding: '0 28px',
          position: 'sticky', top: 0, background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
        }}>
          <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>Reports / Reportes</span>
        </header>

        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {[
              { label: 'Active Workers', sublabel: 'Trabajadores activos', value: activeWorkers.length, color: 'var(--accent2)' },
              { label: 'Certs Expiring (30d)', sublabel: 'Certificaciones por vencer', value: certsExpiring, color: certsExpiring > 0 ? 'var(--warning)' : 'var(--text2)' },
              { label: 'Equipment Due (30d)', sublabel: 'Equipos por inspeccionar', value: equipDue, color: equipDue > 0 ? 'var(--warning)' : 'var(--text2)' },
              { label: 'Open Alerts', sublabel: 'Alertas sin leer', value: openAlerts, color: openAlerts > 0 ? 'var(--danger)' : 'var(--text2)' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ fontFamily: mono, fontSize: '32px', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontFamily: mono, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)', marginTop: '8px' }}>{kpi.label}</div>
                <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>{kpi.sublabel}</div>
              </div>
            ))}
          </div>

          {/* Export Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Excel Export */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(74,255,160,0.1)', border: '1px solid rgba(74,255,160,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h2m4 0h2M8 17h2m4 0h2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>Excel Report</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Reporte completo en 4 hojas: Workers, Equipment, JSAs, Alerts</div>
                </div>
              </div>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginBottom: '16px', lineHeight: 1.6 }}>
                Genera un archivo <span style={{ color: 'var(--accent2)' }}>.xlsx</span> con todos los datos de tu organización listos para analizar en Excel o Google Sheets.
              </div>
              <button
                onClick={handleExcel}
                disabled={generatingExcel}
                style={{
                  width: '100%', height: '38px', background: generatingExcel ? 'rgba(74,255,160,0.05)' : 'rgba(74,255,160,0.12)',
                  border: '1px solid rgba(74,255,160,0.3)', borderRadius: '6px', color: 'var(--accent2)',
                  fontFamily: mono, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: generatingExcel ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                {generatingExcel ? 'Generating...' : 'Download Excel'}
              </button>
            </div>

            {/* AI PDF Export */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(232,255,74,0.1)', border: '1px solid rgba(232,255,74,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text)' }}>AI Safety Report</div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Análisis inteligente con Claude AI + PDF profesional</div>
                </div>
              </div>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginBottom: '16px', lineHeight: 1.6 }}>
                Claude analiza tus datos y genera un informe ejecutivo en <span style={{ color: 'var(--accent)' }}>.pdf</span> con recomendaciones de seguridad y cumplimiento IRATA.
              </div>
              {pdfStatus && (
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  {pdfStatus}
                </div>
              )}
              <button
                onClick={handleAiPdf}
                disabled={generatingPdf}
                style={{
                  width: '100%', height: '38px', background: generatingPdf ? 'rgba(232,255,74,0.05)' : 'rgba(232,255,74,0.12)',
                  border: '1px solid rgba(232,255,74,0.3)', borderRadius: '6px', color: 'var(--accent)',
                  fontFamily: mono, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: generatingPdf ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01"/>
                </svg>
                {generatingPdf ? 'Generating...' : 'Generate AI PDF'}
              </button>
            </div>
          </div>

          {/* Recent JSAs summary */}
          {jsas.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text2)' }}>
                  Recent JSAs / Últimas JSAs
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Title / Título', 'Date / Fecha', 'Status', 'Workers', 'Tasks'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jsas.slice(0, 8).map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => router.push(`/jsa/${j.id}`)}>
                      <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 500 }}>{j.title}</td>
                      <td style={{ padding: '12px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>
                        {new Date(j.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          fontFamily: mono, fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 500,
                          background: j.status === 'approved' ? 'rgba(74,255,160,0.1)' : j.status === 'pending' ? 'rgba(232,255,74,0.08)' : 'rgba(255,255,255,0.05)',
                          color: j.status === 'approved' ? 'var(--accent2)' : j.status === 'pending' ? 'var(--accent)' : 'var(--text3)',
                          border: `1px solid ${j.status === 'approved' ? 'rgba(74,255,160,0.2)' : j.status === 'pending' ? 'rgba(232,255,74,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{j.jsa_workers?.length ?? 0}</td>
                      <td style={{ padding: '12px 20px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{j.jsa_tasks?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
