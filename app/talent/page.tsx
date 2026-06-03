'use client'

/*
  SQL to run in Supabase before using this page:

  create table verified_requests (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),
    company_name text,
    country text,
    email text,
    team_size text,
    message text
  );
  alter table verified_requests enable row level security;
  create policy "anyone can request" on verified_requests for insert with check (true);
*/

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const gridBg = {
  backgroundImage:
    'linear-gradient(rgba(42,51,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,47,0.3) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--surface2)',
  border: '1px solid var(--border2)',
  borderRadius: '4px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontFamily: mono,
  fontSize: '12px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10px',
  color: 'var(--text3)',
  letterSpacing: '1px',
  marginBottom: '6px',
  textTransform: 'uppercase',
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const mockWorkers = [
  { name: 'Carlos M.', level: 'L3', city: 'Monterrey', school: 'BIA Training', days: 312 },
  { name: 'Ana R.', level: 'L2', city: 'CDMX', school: 'IRATA México', days: 178 },
  { name: 'Luis G.', level: 'L1', city: 'Guadalajara', school: 'BIA Training', days: 89 },
]

const levelColor: Record<string, string> = {
  L1: 'rgba(74,255,160,0.15)',
  L2: 'rgba(232,255,74,0.15)',
  L3: 'rgba(255,160,74,0.15)',
}
const levelBorder: Record<string, string> = {
  L1: 'rgba(74,255,160,0.35)',
  L2: 'rgba(232,255,74,0.35)',
  L3: 'rgba(255,160,74,0.35)',
}
const levelText: Record<string, string> = {
  L1: 'rgb(74,255,160)',
  L2: 'var(--accent)',
  L3: 'rgb(255,160,74)',
}

export default function TalentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    company_name: '',
    country: '',
    email: '',
    team_size: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.company_name || !form.email) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await supabase.from('verified_requests').insert({
      company_name: form.company_name,
      country: form.country,
      email: form.email,
      team_size: form.team_size,
      message: form.message,
    })
    if (error) { setSubmitError(error.message); setSubmitting(false); return }
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,15,14,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '13px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text)' }}>RopesTrack</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/" style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
            Inicio
          </a>
          <button onClick={() => scrollTo('empresas')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
            Para Empresas
          </button>
          <button onClick={() => scrollTo('tecnicos')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
            Para Técnicos
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '7px 18px', fontFamily: mono, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
            Login
          </button>
          <button onClick={() => router.push('/login')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '7px 18px', fontFamily: mono, fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}>
            Registrarse
          </button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{ ...gridBg, padding: '100px 48px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.2)', borderRadius: '3px', padding: '4px 14px', marginBottom: '32px' }}>
          <span style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Red de Talento IRATA Certificado
          </span>
        </div>

        <h1 style={{ fontFamily: bebas, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.95, letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text)', margin: '0 0 28px' }}>
          ENCUENTRA TÉCNICOS<br />IRATA CERTIFICADOS
        </h1>

        <p style={{ fontFamily: mono, fontSize: '14px', lineHeight: 1.75, color: 'var(--text2)', maxWidth: '580px', margin: '0 0 40px', letterSpacing: '0.3px' }}>
          Conectamos empresas de rope access con técnicos certificados verificados por las mejores escuelas IRATA de Latinoamérica.
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '56px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => scrollTo('empresas')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '13px 32px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
            Soy una Empresa
          </button>
          <button onClick={() => scrollTo('tecnicos')} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '13px 32px', fontFamily: mono, fontSize: '12px', letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
            Soy Técnico
          </button>
        </div>

        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          {['150+ Técnicos Certificados', '12 Países', 'L1 / L2 / L3'].map((stat, i) => (
            <div key={i} style={{ padding: '14px 28px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase' }}>{stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARA EMPRESAS ───────────────────────────────────────────────────── */}
      <section id="empresas" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Para Empresas</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 48px', color: 'var(--text)' }}>
            ACCEDE AL MEJOR TALENTO<br />IRATA VERIFICADO
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '64px' }}>
            {[
              { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', title: 'Perfiles verificados', desc: 'Todos los técnicos tienen certificación IRATA activa y vigente.' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Acceso exclusivo', desc: 'Solo empresas verificadas por RopesTrack pueden contactar técnicos.' },
              { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', title: 'Contacto directo', desc: 'Comunícate directamente con el técnico sin intermediarios.' },
            ].map((card, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <path d={card.icon}/>
                  </svg>
                </div>
                <div style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text)' }}>{card.title}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65, letterSpacing: '0.3px' }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Formulario de solicitud */}
          <div style={{ maxWidth: '560px' }}>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>
              Solicitar acceso verificado
            </div>

            {submitted ? (
              <div style={{ background: 'rgba(74,255,160,0.08)', border: '1px solid rgba(74,255,160,0.25)', borderRadius: '6px', padding: '24px', fontFamily: mono, fontSize: '13px', color: 'rgb(74,255,160)', lineHeight: 1.6 }}>
                Solicitud enviada. Te contactaremos en menos de 24 horas.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={labelStyle}>Nombre de empresa *</div>
                  <input type="text" placeholder="Altura Industrial SA" value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    required style={inputStyle}/>
                </div>
                <div>
                  <div style={labelStyle}>País *</div>
                  <input type="text" placeholder="México" value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    required style={inputStyle}/>
                </div>
                <div>
                  <div style={labelStyle}>Email corporativo *</div>
                  <input type="email" placeholder="contacto@empresa.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required style={inputStyle}/>
                </div>
                <div>
                  <div style={labelStyle}>Número de técnicos que buscan</div>
                  <select value={form.team_size}
                    onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))}
                    style={{ ...inputStyle, color: form.team_size ? 'var(--text)' : 'var(--text3)' }}>
                    <option value="">Seleccionar</option>
                    <option value="1-3">1 – 3</option>
                    <option value="4-10">4 – 10</option>
                    <option value="10+">10+</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Mensaje (opcional)</div>
                  <textarea placeholder="Cuéntanos más sobre el proyecto o posición..." value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}/>
                </div>
                {submitError && (
                  <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>
                    {submitError}
                  </div>
                )}
                <button type="submit" disabled={submitting} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '13px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, textTransform: 'uppercase', marginTop: '4px' }}>
                  {submitting ? 'ENVIANDO...' : 'SOLICITAR ACCESO VERIFICADO'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── PARA TÉCNICOS ───────────────────────────────────────────────────── */}
      <section id="tecnicos" style={{ ...gridBg, borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Para Técnicos</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 48px', color: 'var(--text)' }}>
            PUBLICA TU PERFIL Y<br />ENCUENTRA TRABAJO
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
            {[
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Visibilidad', desc: 'Tu perfil llega a empresas IRATA verificadas en toda Latinoamérica.' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Certificación vigente', desc: 'Solo técnicos con cert activa aparecen en el directorio.' },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Gratis', desc: 'Publicar tu perfil en la bolsa no tiene costo.' },
            ].map((card, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <path d={card.icon}/>
                  </svg>
                </div>
                <div style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text)' }}>{card.title}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65, letterSpacing: '0.3px' }}>{card.desc}</div>
              </div>
            ))}
          </div>

          <button onClick={() => router.push('/login')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '13px 32px', fontFamily: mono, fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
            Crear mi Perfil Gratuito
          </button>
        </div>
      </section>

      {/* ── PREVIEW DE PERFILES ─────────────────────────────────────────────── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Directorio</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 12px', color: 'var(--text)' }}>
            TÉCNICOS DISPONIBLES
          </h2>
          <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text3)', marginBottom: '40px', letterSpacing: '0.3px', lineHeight: 1.65 }}>
            Vista previa — los datos de contacto son exclusivos para empresas verificadas.
          </p>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
              {mockWorkers.map((w, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: mono, fontSize: '14px', fontWeight: 700, color: 'var(--text2)' }}>{w.name[0]}</span>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', background: levelColor[w.level], border: `1px solid ${levelBorder[w.level]}`, color: levelText[w.level], borderRadius: '3px', padding: '3px 8px' }}>{w.level}</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{w.name}</div>
                  <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>{w.city}</div>
                  <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }}/>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Escuela</span>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text2)' }}>{w.school}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cert activa</span>
                      <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)' }}>{w.days}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'rgba(13,15,14,0.6)', backdropFilter: 'blur(2px)', borderRadius: '8px' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text)', letterSpacing: '0.5px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.65 }}>
                Acceso completo disponible para empresas verificadas
              </div>
              <button onClick={() => scrollTo('empresas')} style={{ background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px', padding: '10px 24px', fontFamily: mono, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
                Solicitar Acceso
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '36px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>RopesTrack</div>
            <div style={{ fontFamily: mono, fontSize: '9px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase' }}>IRATA Compliance Platform</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'Inicio', href: '/' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Contact', href: 'mailto:hello@ropestrack.com' },
          ].map(link => (
            <a key={link.label} href={link.href} style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px' }}>
          © 2026 RopesTrack. Built by rope access professionals.
        </div>
      </footer>

    </div>
  )
}
