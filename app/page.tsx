'use client'

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

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ full_name: '', company: '', email: '', country: '', team_size: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.full_name || !form.email) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await supabase.from('waitlist').insert({
      full_name: form.full_name,
      company: form.company,
      email: form.email,
      country: form.country,
      team_size: form.team_size,
    })
    if (error) { setSubmitError(error.message); setSubmitting(false); return }
    setSubmitting(false)
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,15,14,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '13px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>RopesTrack</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[
            { label: 'Features', id: 'features' },
            { label: 'Pricing', id: 'pricing' },
            { label: 'About', id: 'waitlist' },
          ].map(item => (
            <button key={item.label} onClick={() => scrollTo(item.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: mono, fontSize: '11px', color: 'var(--text3)',
              letterSpacing: '1px', textTransform: 'uppercase', padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/login')} style={{
            background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
            borderRadius: '4px', padding: '7px 18px', fontFamily: mono, fontSize: '11px',
            letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
          }}>Login</button>
          <button onClick={() => router.push('/login')} style={{
            background: 'var(--accent)', color: '#0d0f0e', border: 'none',
            borderRadius: '4px', padding: '7px 18px', fontFamily: mono, fontSize: '11px',
            letterSpacing: '1px', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase',
          }}>Start Free</button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{ ...gridBg, padding: '100px 48px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.2)',
          borderRadius: '3px', padding: '4px 14px', marginBottom: '32px',
        }}>
          <span style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: 'var(--accent)', textTransform: 'uppercase' }}>
            Built by a Certified IRATA Technician
          </span>
        </div>

        <h1 style={{
          fontFamily: bebas, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.95,
          letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text)',
          margin: '0 0 28px',
        }}>
          IRATA Compliance.<br />Automated.
        </h1>

        <p style={{
          fontFamily: mono, fontSize: '14px', lineHeight: 1.75, color: 'var(--text2)',
          maxWidth: '580px', margin: '0 0 40px', letterSpacing: '0.3px',
        }}>
          Stop managing certifications on spreadsheets. RopesTrack tracks your team&apos;s IRATA certs,
          equipment inspections, and JSAs — and alerts you before anything expires.
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '56px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => router.push('/login')} style={{
            background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
            padding: '13px 32px', fontFamily: mono, fontSize: '12px', fontWeight: 700,
            letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase',
          }}>Start Free</button>
          <button onClick={() => scrollTo('features')} style={{
            background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)',
            borderRadius: '4px', padding: '13px 32px', fontFamily: mono, fontSize: '12px',
            letterSpacing: '1.5px', cursor: 'pointer', textTransform: 'uppercase',
          }}>See How It Works</button>
        </div>

        <div style={{
          display: 'flex', gap: '0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden',
        }}>
          {['12 Workers Tracked', '847 Cert Days Saved', '0 Compliance Failures'].map((stat, i) => (
            <div key={i} style={{
              padding: '14px 28px',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase' }}>{stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ───────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>The Problem</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 48px', color: 'var(--text)' }}>
            SOUND FAMILIAR?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { icon: '⚠', title: "Your tech's cert expired last week.", sub: "You didn't know." },
              { icon: '🔴', title: "The harness failed inspection.", sub: "It's still in use." },
              { icon: '📄', title: "The JSA was signed on paper.", sub: "Now it's lost." },
            ].map((card, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '28px 24px', borderTop: '3px solid rgba(255,74,74,0.5)',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{card.icon}</div>
                <div style={{ fontFamily: mono, fontSize: '13px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.5, color: 'var(--text)' }}>{card.title}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px' }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section id="features" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Features</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 48px', color: 'var(--text)' }}>
            EVERYTHING YOUR TEAM NEEDS<br />TO STAY COMPLIANT
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                path: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
                title: 'Cert Tracking',
                desc: 'Know exactly when every IRATA cert expires. 30, 15, 7 and 1 day alerts.',
              },
              {
                path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                title: 'WhatsApp Alerts',
                desc: 'Automated WhatsApp messages to supervisors and technicians before certs expire.',
              },
              {
                path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                title: 'JSA Digital',
                desc: 'Create, assign and sign Job Safety Analysis documents from any device.',
              },
              {
                path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                title: 'Equipment Lifecycle',
                desc: 'Track inspection dates and useful life of every piece of equipment.',
              },
              {
                path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                title: 'Multi-Team',
                desc: 'Manage multiple teams and locations from one dashboard.',
              },
              {
                path: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                title: 'AI Reports',
                desc: 'Generate compliance reports in PDF with one click using AI.',
              },
            ].map((feat, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px',
                transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: 'rgba(232,255,74,0.08)', border: '1px solid rgba(232,255,74,0.15)',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <path d={feat.path}/>
                  </svg>
                </div>
                <div style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{feat.title}</div>
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)', lineHeight: 1.65, letterSpacing: '0.3px' }}>{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Pricing</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 48px', color: 'var(--text)' }}>
            SIMPLE PRICING
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '680px' }}>
            {/* Free */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px' }}>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Free</div>
              <div style={{ fontFamily: bebas, fontSize: '52px', lineHeight: 1, marginBottom: '28px', color: 'var(--text)' }}>$0</div>
              {['Up to 3 workers', 'Basic cert tracking', 'No WhatsApp alerts'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text3)', display: 'inline-block', flexShrink: 0 }}/>
                  <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>{item}</span>
                </div>
              ))}
            </div>
            {/* Pro */}
            <div style={{
              background: 'var(--surface)', border: '1px solid rgba(232,255,74,0.3)',
              borderRadius: '8px', padding: '32px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)' }}/>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontFamily: bebas, fontSize: '52px', lineHeight: 1, color: 'var(--text)' }}>$49</span>
                <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text3)' }}>USD/month</span>
              </div>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginBottom: '24px' }}>Annual plan available</div>
              {['Unlimited workers', 'WhatsApp alerts', 'JSA digital', 'AI Reports', 'Priority support'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }}/>
                  <span style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)' }}>{item}</span>
                </div>
              ))}
              <button onClick={() => router.push('/login')} style={{
                marginTop: '16px', width: '100%', background: 'var(--accent)', color: '#0d0f0e',
                border: 'none', borderRadius: '4px', padding: '10px', fontFamily: mono, fontSize: '11px',
                fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
              }}>Start Free</button>
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '16px', letterSpacing: '0.5px' }}>
            Annual plan available · Cancel anytime
          </div>
        </div>
      </section>

      {/* ── WAITLIST FORM ─────────────────────────────────────────────────────── */}
      <section id="waitlist" style={{ ...gridBg, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center', padding: '80px 48px' }}>
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Waitlist</div>
          <h2 style={{ fontFamily: bebas, fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: '3px', margin: '0 0 12px', color: 'var(--text)', textAlign: 'center' }}>
            GET STARTED FREE
          </h2>
          <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginBottom: '40px', lineHeight: 1.65 }}>
            Create your account and start tracking your team&apos;s compliance today.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'full_name', label: 'Full Name / Nombre *', placeholder: 'Carlos Mendoza', required: true },
                { key: 'company', label: 'Company / Empresa', placeholder: 'Altura Industrial SA' },
                { key: 'email', label: 'Email *', placeholder: 'carlos@company.com', type: 'email', required: true },
                { key: 'country', label: 'Country / País', placeholder: 'Mexico' },
              ].map(field => (
                <div key={field.key}>
                  <div style={labelStyle}>{field.label}</div>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={(form as Record<string, string>)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    required={field.required}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <div style={labelStyle}>Number of Technicians / Técnicos</div>
                <select
                  value={form.team_size}
                  onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))}
                  style={{ ...inputStyle, color: form.team_size ? 'var(--text)' : 'var(--text3)' }}
                >
                  <option value="">Select team size</option>
                  <option value="1-5">1 – 5</option>
                  <option value="6-15">6 – 15</option>
                  <option value="16-50">16 – 50</option>
                  <option value="50+">50+</option>
                </select>
              </div>
              {submitError && (
                <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', padding: '8px 12px', background: 'rgba(255,74,74,0.08)', border: '1px solid rgba(255,74,74,0.2)', borderRadius: '4px' }}>
                  {submitError}
                </div>
              )}
              <button type="submit" disabled={submitting} style={{
                background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '13px', fontFamily: mono, fontSize: '12px', fontWeight: 700,
                letterSpacing: '1.5px', cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1, textTransform: 'uppercase', marginTop: '4px',
              }}>
                {submitting ? 'SUBMITTING...' : 'CREATE FREE ACCOUNT'}
              </button>
            </form>
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
