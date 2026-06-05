'use client'

/*
  Run in Supabase SQL Editor if username column doesn't exist:
  alter table profiles add column if not exists username text unique;
*/

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--surface2)',
  border: '1px solid var(--border2)',
  borderRadius: '4px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontFamily: mono,
  fontSize: '13px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10px',
  color: 'var(--text3)',
  letterSpacing: '1px',
  marginBottom: '6px',
  textTransform: 'uppercase',
  display: 'block',
}

type Step = 'choice' | 'independent' | 'company' | 'join'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('choice')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [indForm, setIndForm] = useState({ full_name: '', username: '' })
  const [compForm, setCompForm] = useState({ full_name: '', company_name: '', slug: '' })
  const [joinForm, setJoinForm] = useState({ full_name: '', org_slug: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  // ── INDEPENDENT ────────────────────────────────────────────────────────────
  async function handleIndependent() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        org_id: null,
        role: 'independent',
        full_name: indForm.full_name,
        username: indForm.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      })

    if (profileError) { setError(profileError.message); setSaving(false); return }
    router.push('/dashboard')
  }

  // ── COMPANY ────────────────────────────────────────────────────────────────
  async function handleCompany() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({ name: compForm.company_name, slug: compForm.slug, owner_id: user.id }, { onConflict: 'slug' })
      .select()
      .single()

    if (orgError) { setError(orgError.message); setSaving(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        org_id: org.id,
        role: 'admin',
        full_name: compForm.full_name,
        username: compForm.slug,
      })

    if (profileError) { setError(profileError.message); setSaving(false); return }
    router.push('/dashboard')
  }

  // ── JOIN ───────────────────────────────────────────────────────────────────
  async function handleJoin() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select()
      .eq('slug', joinForm.org_slug.toLowerCase().trim())
      .single()

    if (orgError || !org) {
      setError('Empresa no encontrada. Verifica el nombre e intenta de nuevo.')
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, org_id: org.id, role: 'viewer', full_name: joinForm.full_name })

    if (profileError) { setError(profileError.message); setSaving(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(42,51,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,47,0.3) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '480px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>RopesTrack</span>
        </div>

        {/* ── CHOICE ─────────────────────────────────────────────────────── */}
        {step === 'choice' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '8px' }}>¿CÓMO USARÁS ROPESTRACK?</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px', lineHeight: 1.6 }}>Elige el tipo de cuenta que necesitas.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setStep('independent')} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Técnico Independiente</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Gestiona tus propias certificaciones sin empresa</div>
              </button>
              <button onClick={() => setStep('company')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Registrar mi Empresa</div>
                <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>Crea una organización y gestiona tu equipo</div>
              </button>
              <button onClick={() => setStep('join')} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Unirme a una Empresa</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Mi empresa ya tiene una cuenta en RopesTrack</div>
              </button>
            </div>
          </>
        )}

        {/* ── INDEPENDENT ────────────────────────────────────────────────── */}
        {step === 'independent' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>TÉCNICO INDEPENDIENTE</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu perfil personal sin necesidad de empresa.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input value={userEmail} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}/>
              </div>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input placeholder="Carlos Mendoza" value={indForm.full_name}
                  onChange={e => setIndForm(f => ({ ...f, full_name: e.target.value }))}
                  style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Nombre de usuario *</label>
                <input placeholder="carlosmendoza" value={indForm.username}
                  onChange={e => setIndForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  style={inputStyle}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Solo letras minúsculas, números y guión bajo</div>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleIndependent} disabled={saving || !indForm.full_name || !indForm.username} style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                {saving ? 'Creando...' : 'Crear mi perfil'}
              </button>
              <button onClick={() => { setStep('choice'); setError('') }} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '11px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer' }}>Atrás</button>
            </div>
          </>
        )}

        {/* ── COMPANY ────────────────────────────────────────────────────── */}
        {step === 'company' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>REGISTRAR EMPRESA</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu organización y empieza a gestionar tu equipo.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input value={userEmail} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}/>
              </div>
              <div>
                <label style={labelStyle}>Tu nombre completo *</label>
                <input placeholder="Carlos Mendoza" value={compForm.full_name}
                  onChange={e => setCompForm(f => ({ ...f, full_name: e.target.value }))}
                  style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Nombre de la empresa *</label>
                <input placeholder="Altus Industrial SA" value={compForm.company_name}
                  onChange={e => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                    setCompForm(f => ({ ...f, company_name: name, slug }))
                  }}
                  style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Slug (identificador único) *</label>
                <input placeholder="altus-industrial" value={compForm.slug}
                  onChange={e => setCompForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  style={inputStyle}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                  Los miembros de tu empresa usarán este código para unirse
                </div>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCompany} disabled={saving || !compForm.full_name || !compForm.company_name || !compForm.slug} style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                {saving ? 'Creando...' : 'Crear organización'}
              </button>
              <button onClick={() => { setStep('choice'); setError('') }} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '11px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer' }}>Atrás</button>
            </div>
          </>
        )}

        {/* ── JOIN ───────────────────────────────────────────────────────── */}
        {step === 'join' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>UNIRME A UNA EMPRESA</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Pide el código de organización a tu administrador.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input value={userEmail} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}/>
              </div>
              <div>
                <label style={labelStyle}>Tu nombre completo *</label>
                <input placeholder="Carlos Mendoza" value={joinForm.full_name}
                  onChange={e => setJoinForm(f => ({ ...f, full_name: e.target.value }))}
                  style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Código de organización *</label>
                <input placeholder="altus-industrial" value={joinForm.org_slug}
                  onChange={e => setJoinForm(f => ({ ...f, org_slug: e.target.value.toLowerCase().trim() }))}
                  style={inputStyle}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                  Tu administrador te proporcionará este código
                </div>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleJoin} disabled={saving || !joinForm.full_name || !joinForm.org_slug} style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                {saving ? 'Uniéndome...' : 'Unirme a la empresa'}
              </button>
              <button onClick={() => { setStep('choice'); setError('') }} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '11px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer' }}>Atrás</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
