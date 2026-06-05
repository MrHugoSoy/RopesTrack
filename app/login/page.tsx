'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      router.push(profile ? '/dashboard' : '/onboarding')
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(42,51,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,51,47,0.3) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--accent)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
                <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '18px',
              fontWeight: '500',
              letterSpacing: '3px',
              color: 'var(--text)',
              textTransform: 'uppercase',
            }}>RopesTrack</span>
          </div>
          <p style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>IRATA Compliance Platform</p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: '4px',
              padding: '10px 14px',
              color: 'var(--text)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: '4px',
              padding: '10px 14px',
              color: 'var(--text)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '11px',
            color: error.includes('Check') ? 'var(--accent2)' : 'var(--danger)',
            marginBottom: '16px',
          }}>{error}</p>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: 'var(--accent)',
            color: '#0d0f0e',
            border: 'none',
            borderRadius: '4px',
            padding: '11px',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            textTransform: 'uppercase',
          }}
        >
          {loading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
        </button>

        {/* Register link */}
        <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginTop: '20px' }}>
          ¿No tienes cuenta?{' '}
          <a href="/onboarding" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  )
}