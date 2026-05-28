'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const mono = 'var(--font-dm-mono)'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice')
  const [createMode, setCreateMode] = useState<'independent' | 'team'>('team')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', name: '', slug: '' })
  const [joinSlug, setJoinSlug] = useState('')

  async function handleCreate() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create org
    const slug = form.slug
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: form.name, slug, owner_id: user.id })
      .select()
      .single()

    if (orgError) { setError(orgError.message); setSaving(false); return }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: user.id, org_id: org.id, role: 'admin', full_name: form.full_name })

    if (profileError) { setError(profileError.message); setSaving(false); return }

    router.push('/dashboard')
  }

  async function handleJoin() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select()
      .eq('slug', joinSlug.toLowerCase().trim())
      .single()

    if (orgError || !org) { setError('Organization not found. Check the slug and try again.'); setSaving(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: user.id, org_id: org.id, role: 'viewer' })

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
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
                <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: mono, fontSize: '18px', letterSpacing: '3px', textTransform: 'uppercase' }}>RopesTrack</span>
          </div>
          <p style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase' }}>How will you use RopesTrack?</p>
        </div>

        {/* STEP: CHOICE */}
        {step === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => { setCreateMode('independent'); setStep('create') }} style={{
              background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)',
              borderRadius: '4px', padding: '14px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
              letterSpacing: '1px', cursor: 'pointer', textAlign: 'left',
            }}>
              I&apos;M AN INDEPENDENT TECHNICIAN
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '4px', opacity: 0.8 }}>Track my own certifications and equipment</div>
            </button>
            <button onClick={() => { setCreateMode('team'); setStep('create') }} style={{
              background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
              padding: '14px 20px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
              letterSpacing: '1px', cursor: 'pointer', textAlign: 'left',
            }}>
              I MANAGE A TEAM
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>Set up RopesTrack for my company</div>
            </button>
            <button onClick={() => setStep('join')} style={{
              background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
              borderRadius: '4px', padding: '14px 20px', fontFamily: mono, fontSize: '12px',
              letterSpacing: '1px', cursor: 'pointer', textAlign: 'left',
            }}>
              JOIN A COMPANY
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>My company already has a RopesTrack account</div>
            </button>
          </div>
        )}

        {/* STEP: CREATE */}
        {step === 'create' && (
          <div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)', marginBottom: '20px', letterSpacing: '1px' }}>
              {createMode === 'independent' ? 'Set up your account' : 'New Organization'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Your Full Name</div>
                <input
                  placeholder="Carlos Mendoza"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  style={{
                    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                    fontFamily: mono, fontSize: '13px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {createMode === 'independent' ? 'Username' : 'Company Name'}
                </div>
                <input
                  placeholder={createMode === 'independent' ? 'carlosmendoza' : 'Altus Services MX'}
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value
                    const slug = createMode === 'independent'
                      ? name.toLowerCase().replace(/[^a-z0-9]/g, '')
                      : name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                    setForm(f => ({ ...f, name, slug }))
                  }}
                  style={{
                    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                    fontFamily: mono, fontSize: '13px', outline: 'none',
                  }}
                />
                {createMode === 'independent' && (
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                    This will be your unique identifier in RopesTrack
                  </div>
                )}
              </div>
              {createMode === 'team' && (
                <div>
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Slug (unique ID)</div>
                  <input
                    placeholder="altus-services-mx"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    style={{
                      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                      borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                      fontFamily: mono, fontSize: '13px', outline: 'none',
                    }}
                  />
                  <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                    ropestrack.com/org/{form.slug || 'your-slug'}
                  </div>
                </div>
              )}
              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', padding: '3px 10px', borderRadius: '3px', background: 'rgba(74,255,160,0.08)', border: '1px solid rgba(74,255,160,0.2)' }}>
                <span style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent2)' }}>
                  FREE PLAN · {createMode === 'independent' ? 'Up to 3 workers' : 'Upgrade anytime'}
                </span>
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreate} disabled={saving || !form.full_name || !form.name || (createMode === 'team' && !form.slug)} style={{
                flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '10px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'CREATING...' : createMode === 'independent' ? 'CREATE MY ACCOUNT' : 'CREATE ORGANIZATION'}</button>
              <button onClick={() => setStep('choice')} style={{
                background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                borderRadius: '4px', padding: '10px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
              }}>Back</button>
            </div>
          </div>
        )}

        {/* STEP: JOIN */}
        {step === 'join' && (
          <div>
            <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--text2)', marginBottom: '20px', letterSpacing: '1px' }}>
              Join Organization
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Organization Slug</div>
              <input
                placeholder="altus-services-mx"
                value={joinSlug}
                onChange={e => setJoinSlug(e.target.value)}
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                  borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                  fontFamily: mono, fontSize: '13px', outline: 'none',
                }}
              />
              <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                Ask your admin for the organization slug
              </div>
            </div>
            {error && <div style={{ fontFamily: mono, fontSize: '11px', color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleJoin} disabled={saving || !joinSlug} style={{
                flex: 1, background: 'var(--accent)', color: '#0d0f0e', border: 'none', borderRadius: '4px',
                padding: '10px', fontFamily: mono, fontSize: '12px', fontWeight: '500',
                letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'JOINING...' : 'JOIN ORGANIZATION'}</button>
              <button onClick={() => setStep('choice')} style={{
                background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
                borderRadius: '4px', padding: '10px 16px', fontFamily: mono, fontSize: '12px', cursor: 'pointer',
              }}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}