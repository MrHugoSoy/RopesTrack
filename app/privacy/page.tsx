'use client'

import { useRouter } from 'next/navigation'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const LAST_UPDATED = 'May 24, 2026'
const COMPANY = 'RopesTrack'
const CONTACT_EMAIL = 'privacy@ropestrack.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px', margin: '0 0 14px' }}>{title}</h2>
      <div style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)', lineHeight: 1.85, letterSpacing: '0.3px' }}>{children}</div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span>
      <span>{children}</span>
    </div>
  )
}

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,15,14,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => router.push('/')}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="#0d0f0e"/>
              <path d="M10 2 L10 7 M10 13 L10 18 M2 10 L7 10 M13 10 L18 10" stroke="#0d0f0e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="#0d0f0e" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontFamily: mono, fontSize: '13px', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>RopesTrack</span>
        </div>
        <button onClick={() => router.push('/')} style={{
          background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)',
          borderRadius: '4px', padding: '7px 16px', fontFamily: mono, fontSize: '11px',
          letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
        }}>← Back</button>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>

        <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Legal</div>
        <h1 style={{ fontFamily: bebas, fontSize: 'clamp(40px, 6vw, 72px)', letterSpacing: '4px', textTransform: 'uppercase', margin: '0 0 8px', color: 'var(--text)' }}>
          Privacy Policy
        </h1>
        <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '56px' }}>
          Last updated: {LAST_UPDATED}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px 24px', marginBottom: '48px' }}>
          <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
            {COMPANY} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform at ropestrack.com. By using RopesTrack, you agree to the terms described here.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p style={{ margin: '0 0 12px' }}>We collect information you provide directly when you create an account, add team members, or use our features:</p>
          <Li>Account information: full name, email address, company name, and country.</Li>
          <Li>Worker records: names, IRATA certification numbers, certification levels, and expiry dates.</Li>
          <Li>Equipment records: equipment names, types, serial identifiers, and inspection dates.</Li>
          <Li>Job Safety Analysis (JSA) documents: titles, tasks, hazards, controls, worker assignments, and signatures.</Li>
          <Li>Waitlist information: name, email, company, country, and team size submitted via our early-access form.</Li>
          <Li>Usage data: pages visited, actions taken, and timestamps — collected automatically to improve the platform.</Li>
        </Section>

        <Section title="2. How We Use Your Information">
          <p style={{ margin: '0 0 12px' }}>We use the information collected to:</p>
          <Li>Provide, operate, and maintain the RopesTrack platform.</Li>
          <Li>Send certification expiry alerts and compliance notifications.</Li>
          <Li>Generate reports and compliance documents for your organization.</Li>
          <Li>Respond to support requests and communicate platform updates.</Li>
          <Li>Improve our services based on usage patterns and user feedback.</Li>
          <Li>Comply with legal obligations and enforce our Terms of Service.</Li>
          <p style={{ margin: '12px 0 0' }}>We do not sell, rent, or trade your personal information to third parties.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p style={{ margin: '0 0 12px' }}>Your data is stored in the European Union using Supabase (supabase.com), a trusted database infrastructure provider. We implement industry-standard security measures including:</p>
          <Li>Encryption in transit (TLS/HTTPS) for all data exchanged with our servers.</Li>
          <Li>Encryption at rest for all stored data.</Li>
          <Li>Row-level security policies so users can only access their own organization&apos;s data.</Li>
          <Li>Authentication handled via Supabase Auth with secure session management.</Li>
          <p style={{ margin: '12px 0 0' }}>No system is 100% secure. If you believe your account has been compromised, contact us immediately at {CONTACT_EMAIL}.</p>
        </Section>

        <Section title="4. Third-Party Services">
          <p style={{ margin: '0 0 12px' }}>We use the following third-party services to operate the platform:</p>
          <Li><strong style={{ color: 'var(--text)' }}>Supabase</strong> — database, authentication, and storage (supabase.com).</Li>
          <Li><strong style={{ color: 'var(--text)' }}>Vercel</strong> — application hosting and deployment (vercel.com).</Li>
          <Li><strong style={{ color: 'var(--text)' }}>Anthropic</strong> — AI-powered report generation via the Claude API (anthropic.com). Report data is sent to the API and processed; Anthropic does not store your data for training purposes under their API terms.</Li>
          <p style={{ margin: '12px 0 0' }}>Each service has its own privacy policy. We encourage you to review them.</p>
        </Section>

        <Section title="5. Cookies and Tracking">
          <p style={{ margin: '0 0 12px' }}>RopesTrack uses session cookies strictly necessary to keep you logged in. We do not use advertising, analytics, or tracking cookies from third parties. We do not use any pixel trackers or fingerprinting technologies.</p>
        </Section>

        <Section title="6. Data Retention">
          <p style={{ margin: '0 0 0' }}>We retain your data for as long as your account is active. If you cancel your account or request deletion, we will delete your data within 30 days, except where we are required to retain it by law. Waitlist entries are retained until the waitlist program ends or until you request removal.</p>
        </Section>

        <Section title="7. Your Rights">
          <p style={{ margin: '0 0 12px' }}>Depending on your location, you may have the following rights regarding your personal data:</p>
          <Li>Access: request a copy of the data we hold about you.</Li>
          <Li>Correction: request that inaccurate data be corrected.</Li>
          <Li>Deletion: request that your data be deleted (&quot;right to be forgotten&quot;).</Li>
          <Li>Portability: request your data in a structured, machine-readable format.</Li>
          <Li>Objection: object to certain processing activities.</Li>
          <p style={{ margin: '12px 0 0' }}>To exercise any of these rights, email us at <span style={{ color: 'var(--accent)' }}>{CONTACT_EMAIL}</span>. We will respond within 30 days.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p style={{ margin: 0 }}>RopesTrack is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal data, contact us immediately.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p style={{ margin: 0 }}>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on the platform. The date at the top of this page indicates when the policy was last revised.</p>
        </Section>

        <Section title="10. Contact">
          <p style={{ margin: 0 }}>
            If you have any questions about this Privacy Policy or how we handle your data, contact us at:<br /><br />
            <span style={{ color: 'var(--accent)' }}>{CONTACT_EMAIL}</span><br />
            <span style={{ color: 'var(--text3)' }}>RopesTrack · IRATA Compliance Platform</span>
          </p>
        </Section>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px' }}>© 2026 RopesTrack.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }].map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}>{l.label}</a>
          ))}
        </div>
      </footer>

    </div>
  )
}
