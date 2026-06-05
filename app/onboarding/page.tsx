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
  const [joinSent, setJoinSent] = useState(false)

  // Existing session (for join flow)
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string } | null>(null)
  const [sessionProfile, setSessionProfile] = useState<{ full_name: string | null } | null>(null)

  const [indForm, setIndForm] = useState({ email: '', password: '', full_name: '', username: '' })
  const [compForm, setCompForm] = useState({ email: '', password: '', full_name: '', company_name: '', slug: '' })
  const [joinForm, setJoinForm] = useState({ org_slug: '' })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setSessionUser({ id: user.id, email: user.email ?? '' })
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setSessionProfile(profile)
    })
  }, [])

  async function signUpAndGetUser(email: string, password: string) {
    // Try signing up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (!signUpError && signUpData.user) return { user: signUpData.user, error: null }

    // If already registered, sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { user: null, error: signInError.message }
    return { user: signInData.user, error: null }
  }

  // ── INDEPENDENT ────────────────────────────────────────────────────────────
  async function handleIndependent() {
    setSaving(true)
    setError('')

    let user = sessionUser ? { id: sessionUser.id } : null
    if (!user) {
      const { user: newUser, error: authError } = await signUpAndGetUser(indForm.email, indForm.password)
      if (authError || !newUser) { setError(authError ?? 'Error al crear cuenta'); setSaving(false); return }
      user = newUser
    }

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

    let user = sessionUser ? { id: sessionUser.id } : null
    if (!user) {
      const { user: newUser, error: authError } = await signUpAndGetUser(compForm.email, compForm.password)
      if (authError || !newUser) { setError(authError ?? 'Error al crear cuenta'); setSaving(false); return }
      user = newUser
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({ name: compForm.company_name, slug: compForm.slug, owner_id: user.id }, { onConflict: 'slug' })
      .select()
      .single()

    if (orgError) { setError(orgError.message); setSaving(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, org_id: org.id, role: 'admin', full_name: compForm.full_name })

    if (profileError) { setError(profileError.message); setSaving(false); return }
    router.push('/dashboard')
  }

  // ── JOIN ───────────────────────────────────────────────────────────────────
  async function handleJoin() {
    if (!sessionUser) { router.push('/login'); return }
    setSaving(true)
    setError('')

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', joinForm.org_slug.toLowerCase().trim())
      .single()

    if (orgError || !org) {
      setError('Empresa no encontrada. Verifica el código e intenta de nuevo.')
      setSaving(false)
      return
    }

    const { error: reqError } = await supabase.from('join_requests').insert({
      user_id: sessionUser.id,
      org_id: org.id,
      full_name: sessionProfile?.full_name ?? '',
      email: sessionUser.email,
      status: 'pending',
    })

    if (reqError) { setError(reqError.message); setSaving(false); return }
    setJoinSent(true)
    setSaving(false)
  }

  const Logo = () => (
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
  )

  const ErrorBox = () => error ? (
    <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>
      {error}
    </div>
  ) : null

  const sessionPill = sessionUser && (
    <div style={{ background: 'rgba(232,255,74,0.06)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '4px', padding: '10px 14px' }}>
      <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Sesión activa</div>
      <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)' }}>{sessionUser.email}</div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(42,51,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,47,0.3) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '480px' }}>
        <Logo />

        {/* ── CHOICE ─────────────────────────────────────────────────────── */}
        {step === 'choice' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '8px' }}>¿CÓMO USARÁS ROPESTRACK?</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px', lineHeight: 1.6 }}>Elige el tipo de cuenta que necesitas.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setStep('independent')}
                style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Técnico Independiente</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Gestiona tus propias certificaciones sin empresa</div>
              </button>
              <button onClick={() => setStep('company')}
                style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Registrar mi Empresa</div>
                <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>Crea una organización y gestiona tu equipo</div>
              </button>
              <button onClick={() => setStep('join')}
                style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}>
                <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Unirme a una Empresa</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Mi empresa ya tiene una cuenta en RopesTrack</div>
              </button>
            </div>
            <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '20px', textAlign: 'center' }}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Inicia sesión</a>
            </div>
          </>
        )}

        {/* ── INDEPENDENT ────────────────────────────────────────────────── */}
        {step === 'independent' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>TÉCNICO INDEPENDIENTE</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu perfil personal sin necesidad de empresa.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {sessionUser ? sessionPill : <>
                <div>
                  <label style={labelStyle}>Correo electrónico *</label>
                  <input type="email" placeholder="carlos@empresa.com" value={indForm.email}
                    onChange={e => setIndForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="off" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={indForm.password}
                    onChange={e => setIndForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password" style={inputStyle}/>
                </div>
              </>}
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
            <ErrorBox />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleIndependent} disabled={saving || (!sessionUser && (!indForm.email || !indForm.password)) || !indForm.full_name || !indForm.username}
                style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                {saving ? 'Creando...' : 'Crear mi perfil'}
              </button>
              <BackBtn />
            </div>
          </>
        )}

        {/* ── COMPANY ────────────────────────────────────────────────────── */}
        {step === 'company' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>REGISTRAR EMPRESA</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu organización y empieza a gestionar tu equipo.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {sessionUser ? sessionPill : <>
                <div>
                  <label style={labelStyle}>Correo electrónico *</label>
                  <input type="email" placeholder="carlos@empresa.com" value={compForm.email}
                    onChange={e => setCompForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="off" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={compForm.password}
                    onChange={e => setCompForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password" style={inputStyle}/>
                </div>
              </>}
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
                <label style={labelStyle}>Código de organización *</label>
                <input placeholder="altus-industrial" value={compForm.slug}
                  onChange={e => setCompForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  style={inputStyle}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                  Los miembros usarán este código para unirse a tu empresa
                </div>
              </div>
            </div>
            <ErrorBox />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCompany} disabled={saving || (!sessionUser && (!compForm.email || !compForm.password)) || !compForm.full_name || !compForm.company_name || !compForm.slug}
                style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                {saving ? 'Creando...' : 'Crear organización'}
              </button>
              <BackBtn />
            </div>
          </>
        )}

        {/* ── JOIN ───────────────────────────────────────────────────────── */}
        {step === 'join' && (
          <>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>UNIRME A UNA EMPRESA</div>

            {/* No session — must log in first */}
            {!sessionUser && (
              <>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '24px', lineHeight: 1.65 }}>
                  Para solicitar unirte a una empresa necesitas tener un perfil en RopesTrack primero.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <a href="/login" style={{ display: 'block', background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textAlign: 'center', textDecoration: 'none', textTransform: 'uppercase' }}>
                    Iniciar sesión
                  </a>
                  <button onClick={() => setStep('independent')} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Crear perfil de técnico independiente
                  </button>
                </div>
                <BackBtn />
              </>
            )}

            {/* Has session — show request form */}
            {sessionUser && !joinSent && (
              <>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '24px', lineHeight: 1.65 }}>
                  Ingresa el código de la empresa. El administrador recibirá tu solicitud y deberá aprobarla.
                </div>
                <div style={{ background: 'rgba(232,255,74,0.06)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '4px', padding: '10px 14px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Solicitando como</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)' }}>{sessionUser.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
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
                <ErrorBox />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleJoin} disabled={saving || !joinForm.org_slug}
                    style={{ flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
                    {saving ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                  <BackBtn />
                </div>
              </>
            )}

            {/* Request sent */}
            {joinSent && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(74,255,160,0.1)', border: '1px solid rgba(74,255,160,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(74,255,160)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)', marginBottom: '8px', fontWeight: 600 }}>Solicitud enviada</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '24px' }}>
                  El administrador de la empresa recibirá tu solicitud y deberá aprobarla. Te notificaremos cuando sea aceptada.
                </div>
                <a href="/dashboard" style={{ display: 'inline-block', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '10px 24px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Ir al dashboard
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
