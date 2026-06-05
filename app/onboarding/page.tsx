'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  borderRadius: '4px', padding: '10px 14px',
  color: 'var(--text)', fontFamily: mono, fontSize: '13px', outline: 'none',
}

const lbl: React.CSSProperties = {
  display: 'block', fontFamily: mono, fontSize: '10px',
  color: 'var(--text3)', letterSpacing: '1px',
  marginBottom: '6px', textTransform: 'uppercase',
}

const btn: React.CSSProperties = {
  flex: 1, background: 'var(--accent)', color: '#0d0f0e',
  border: 'none', borderRadius: '4px', padding: '11px',
  fontFamily: mono, fontSize: '12px', fontWeight: 700,
  letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
}

const backBtn: React.CSSProperties = {
  background: 'transparent', color: 'var(--text2)',
  border: '1px solid var(--border2)', borderRadius: '4px',
  padding: '11px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
}

type Step = 'choice' | 'independent' | 'company' | 'join'

function OnboardingInner() {
  const router = useRouter()
  const supabase = createClient()

  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) ?? 'choice')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [joinSent, setJoinSent] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Independent form
  const [indEmail, setIndEmail] = useState('')
  const [indPassword, setIndPassword] = useState('')
  const [indName, setIndName] = useState('')
  const [indUsername, setIndUsername] = useState('')

  // Company form
  const [compEmail, setCompEmail] = useState('')
  const [compPassword, setCompPassword] = useState('')
  const [compName, setCompName] = useState('')
  const [compCompany, setCompCompany] = useState('')
  const [compSlug, setCompSlug] = useState('')

  // Join form
  const [joinSlug, setJoinSlug] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSessionId(user.id)
        setSessionEmail(user.email ?? null)
      }
    })
  }, [])

  async function getOrCreateUser(email: string, password: string) {
    const { data: up, error: ue } = await supabase.auth.signUp({ email, password })
    if (!ue && up.user) return { id: up.user.id, error: null }
    const { data: si, error: se } = await supabase.auth.signInWithPassword({ email, password })
    if (se) return { id: null, error: se.message }
    return { id: si.user.id, error: null }
  }

  async function handleIndependent() {
    setSaving(true); setError('')
    let uid = sessionId
    if (!uid) {
      const { id, error: e } = await getOrCreateUser(indEmail, indPassword)
      if (e || !id) { setError(e ?? 'Error'); setSaving(false); return }
      uid = id
    }
    const { error: pe } = await supabase.from('profiles').upsert({
      id: uid, org_id: null, role: 'independent',
      full_name: indName,
      username: indUsername.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    })
    if (pe) { setError(pe.message); setSaving(false); return }
    router.push('/dashboard')
  }

  async function handleCompany() {
    setSaving(true); setError('')
    let uid = sessionId
    if (!uid) {
      const { id, error: e } = await getOrCreateUser(compEmail, compPassword)
      if (e || !id) { setError(e ?? 'Error'); setSaving(false); return }
      uid = id
    }
    const { data: org, error: oe } = await supabase
      .from('organizations')
      .upsert({ name: compCompany, slug: compSlug, owner_id: uid }, { onConflict: 'slug' })
      .select().single()
    if (oe) { setError(oe.message); setSaving(false); return }
    const { error: pe } = await supabase.from('profiles').upsert({
      id: uid, org_id: org.id, role: 'admin', full_name: compName,
    })
    if (pe) { setError(pe.message); setSaving(false); return }
    router.push('/dashboard')
  }

  async function handleJoin() {
    if (!sessionId) { router.push('/login'); return }
    setSaving(true); setError('')
    const { data: org, error: oe } = await supabase
      .from('organizations').select('id, name')
      .eq('slug', joinSlug.trim()).single()
    if (oe || !org) { setError('Empresa no encontrada. Verifica el código.'); setSaving(false); return }
    const { error: re } = await supabase.from('join_requests').insert({
      user_id: sessionId, org_id: org.id,
      email: sessionEmail, status: 'pending',
    })
    if (re) { setError(re.message); setSaving(false); return }
    setJoinSent(true); setSaving(false)
  }

  const gridBg = {
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundImage: 'linear-gradient(rgba(42,51,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,47,0.3) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
  }

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '480px',
  }

  return (
    <div style={gridBg}>
      <div style={card}>

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

        {/* ── CHOICE ── */}
        {step === 'choice' && (
          <div>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '8px' }}>¿CÓMO USARÁS ROPESTRACK?</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Elige el tipo de cuenta que necesitas.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setStep('independent')} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Técnico Independiente</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Gestiona tus propias certificaciones sin empresa</div>
              </button>
              <button onClick={() => setStep('company')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Registrar mi Empresa</div>
                <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>Crea una organización y gestiona tu equipo</div>
              </button>
              <button onClick={() => setStep('join')} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '16px 20px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Unirme a una Empresa</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>Mi empresa ya tiene una cuenta en RopesTrack</div>
              </button>
            </div>
            <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '20px', textAlign: 'center' }}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Inicia sesión</a>
            </div>
          </div>
        )}

        {/* ── INDEPENDENT ── */}
        {step === 'independent' && (
          <div>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>TÉCNICO INDEPENDIENTE</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu perfil personal sin necesidad de empresa.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {sessionEmail ? (
                <div style={{ background: 'rgba(232,255,74,0.06)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '4px', padding: '10px 14px' }}>
                  <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Sesión activa</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)' }}>{sessionEmail}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={lbl}>Correo electrónico *</label>
                    <input type="email" placeholder="carlos@empresa.com" value={indEmail} onChange={e => setIndEmail(e.target.value)} autoComplete="off" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Contraseña *</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={indPassword} onChange={e => setIndPassword(e.target.value)} autoComplete="new-password" style={inp}/>
                  </div>
                </div>
              )}
              <div>
                <label style={lbl}>Nombre completo *</label>
                <input placeholder="Carlos Mendoza" value={indName} onChange={e => setIndName(e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Nombre de usuario *</label>
                <input placeholder="carlosmendoza" value={indUsername} onChange={e => setIndUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={inp}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Solo letras minúsculas, números y guión bajo</div>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleIndependent} disabled={saving || (!sessionId && (!indEmail || !indPassword)) || !indName || !indUsername} style={{ ...btn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creando...' : 'Crear mi perfil'}
              </button>
              <button onClick={() => { setStep('choice'); setError('') }} style={backBtn}>Atrás</button>
            </div>
          </div>
        )}

        {/* ── COMPANY ── */}
        {step === 'company' && (
          <div>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>REGISTRAR EMPRESA</div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '28px' }}>Crea tu organización y empieza a gestionar tu equipo.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {sessionEmail ? (
                <div style={{ background: 'rgba(232,255,74,0.06)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '4px', padding: '10px 14px' }}>
                  <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Sesión activa</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)' }}>{sessionEmail}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={lbl}>Correo electrónico *</label>
                    <input type="email" placeholder="carlos@empresa.com" value={compEmail} onChange={e => setCompEmail(e.target.value)} autoComplete="off" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Contraseña *</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={compPassword} onChange={e => setCompPassword(e.target.value)} autoComplete="new-password" style={inp}/>
                  </div>
                </div>
              )}
              <div>
                <label style={lbl}>Tu nombre completo *</label>
                <input placeholder="Carlos Mendoza" value={compName} onChange={e => setCompName(e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Nombre de la empresa *</label>
                <input placeholder="Altus Industrial SA" value={compCompany} onChange={e => {
                  setCompCompany(e.target.value)
                  setCompSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
                }} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Código de organización *</label>
                <input placeholder="altus-industrial" value={compSlug} onChange={e => setCompSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={inp}/>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Los miembros usarán este código para unirse</div>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCompany} disabled={saving || (!sessionId && (!compEmail || !compPassword)) || !compName || !compCompany || !compSlug} style={{ ...btn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creando...' : 'Crear organización'}
              </button>
              <button onClick={() => { setStep('choice'); setError('') }} style={backBtn}>Atrás</button>
            </div>
          </div>
        )}

        {/* ── JOIN ── */}
        {step === 'join' && (
          <div>
            <div style={{ fontFamily: bebas, fontSize: '28px', letterSpacing: '3px', color: 'var(--text)', marginBottom: '4px' }}>UNIRME A UNA EMPRESA</div>

            {!sessionId && (
              <div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '24px', lineHeight: 1.65 }}>
                  Necesitas una cuenta primero para poder solicitar unirte a una empresa.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <a href="/login" style={{ display: 'block', background: 'var(--accent)', color: '#0d0f0e', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textAlign: 'center', textDecoration: 'none', textTransform: 'uppercase' }}>
                    Iniciar sesión
                  </a>
                  <button onClick={() => setStep('independent')} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '11px', fontFamily: mono, fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Crear perfil de técnico independiente
                  </button>
                </div>
                <button onClick={() => { setStep('choice'); setError('') }} style={backBtn}>Atrás</button>
              </div>
            )}

            {sessionId && !joinSent && (
              <div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '24px', lineHeight: 1.65 }}>
                  El administrador recibirá tu solicitud y deberá aprobarla.
                </div>
                <div style={{ background: 'rgba(232,255,74,0.06)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '4px', padding: '10px 14px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Solicitando como</div>
                  <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)' }}>{sessionEmail}</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={lbl}>Código de organización *</label>
                  <input placeholder="altus-industrial" value={joinSlug} onChange={e => setJoinSlug(e.target.value.toLowerCase().trim())} style={inp}/>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Tu administrador te proporcionará este código</div>
                </div>
                {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleJoin} disabled={saving || !joinSlug} style={{ ...btn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                  <button onClick={() => { setStep('choice'); setError('') }} style={backBtn}>Atrás</button>
                </div>
              </div>
            )}

            {joinSent && (
              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(74,255,160,0.1)', border: '1px solid rgba(74,255,160,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(74,255,160)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>Solicitud enviada</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '24px' }}>
                  El administrador deberá aprobar tu solicitud. Te notificaremos cuando sea aceptada.
                </div>
                <a href="/dashboard" style={{ display: 'inline-block', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '10px 24px', fontFamily: mono, fontSize: '11px', color: 'var(--text2)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Ir al dashboard
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  )
}
