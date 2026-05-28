'use client'

import { useRouter } from 'next/navigation'

const mono = 'var(--font-dm-mono)'
const bebas = 'var(--font-bebas)'

const LAST_UPDATED = 'May 24, 2026'
const CONTACT_EMAIL = 'legal@ropestrack.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: mono, fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 14px' }}>{title}</h2>
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

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <div style={{ fontFamily: mono, fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', marginBottom: '56px' }}>
          Last updated: {LAST_UPDATED}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px 24px', marginBottom: '48px' }}>
          <p style={{ fontFamily: mono, fontSize: '12px', color: 'var(--text2)', lineHeight: 1.75, margin: 0 }}>
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using RopesTrack (&quot;the Platform&quot;). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p style={{ margin: 0 }}>
            These Terms constitute a legally binding agreement between you (or the organization you represent) and RopesTrack. By creating an account or using any part of the Platform, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy. If you are accepting on behalf of a company or organization, you represent that you have the authority to bind that entity.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p style={{ margin: '0 0 12px' }}>RopesTrack is a compliance management platform for IRATA rope access organizations. The Platform provides tools to:</p>
          <Li>Track worker certifications and expiry dates.</Li>
          <Li>Manage equipment inspection schedules and lifecycle records.</Li>
          <Li>Create, assign, and digitally sign Job Safety Analysis (JSA) documents.</Li>
          <Li>Generate compliance reports using AI-assisted tools.</Li>
          <Li>Manage team members and organizational data.</Li>
          <p style={{ margin: '12px 0 0' }}>We reserve the right to modify, suspend, or discontinue any part of the Platform at any time with or without notice.</p>
        </Section>

        <Section title="3. User Accounts">
          <p style={{ margin: '0 0 12px' }}>To use the Platform you must create an account. You agree to:</p>
          <Li>Provide accurate, current, and complete information during registration.</Li>
          <Li>Maintain the security of your password and accept responsibility for all activity under your account.</Li>
          <Li>Notify us immediately at {CONTACT_EMAIL} of any unauthorized use of your account.</Li>
          <Li>Not share your account credentials or allow others to use your account.</Li>
          <p style={{ margin: '12px 0 0' }}>We may suspend or terminate accounts that violate these Terms or remain inactive for extended periods.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p style={{ margin: '0 0 12px' }}>You agree to use the Platform only for lawful purposes. You must not:</p>
          <Li>Upload false, misleading, or fabricated certification or inspection data.</Li>
          <Li>Use the Platform to violate any applicable laws or regulations.</Li>
          <Li>Attempt to gain unauthorized access to any part of the Platform or its infrastructure.</Li>
          <Li>Reverse-engineer, decompile, or disassemble any component of the Platform.</Li>
          <Li>Use automated bots, scrapers, or scripts to access the Platform without our written consent.</Li>
          <Li>Transmit malware, viruses, or any code designed to disrupt the Platform.</Li>
          <p style={{ margin: '12px 0 0' }}>Violation of these restrictions may result in immediate account termination and may expose you to legal liability.</p>
        </Section>

        <Section title="5. Data and Content">
          <p style={{ margin: '0 0 12px' }}>
            <strong style={{ color: 'var(--text)' }}>Your data:</strong> You retain ownership of all data you enter into the Platform, including worker records, equipment records, and JSA documents. By using the Platform, you grant us a limited license to store, process, and display your data solely for the purpose of providing the service.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            <strong style={{ color: 'var(--text)' }}>Accuracy of data:</strong> You are solely responsible for the accuracy and completeness of all data entered. RopesTrack is a tool to assist compliance management — it is not a substitute for professional judgment, legal advice, or official IRATA certification verification.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--text)' }}>Data export:</strong> You may export your data at any time in supported formats. Upon account termination, you have 30 days to export your data before it is deleted.
          </p>
        </Section>

        <Section title="6. AI-Generated Content">
          <p style={{ margin: 0 }}>
            The Platform offers AI-powered report generation via the Anthropic Claude API. AI-generated content is provided for informational purposes only. It does not constitute legal, safety, or regulatory advice. You are responsible for reviewing, verifying, and approving any AI-generated output before acting on it or distributing it to third parties. We make no representations regarding the accuracy, completeness, or fitness for purpose of AI-generated reports.
          </p>
        </Section>

        <Section title="7. Payment and Subscriptions">
          <p style={{ margin: '0 0 12px' }}>
            RopesTrack offers a free plan and paid subscription plans. For paid plans:
          </p>
          <Li>Subscriptions are billed monthly or annually in advance.</Li>
          <Li>You may cancel at any time; cancellation takes effect at the end of the current billing period.</Li>
          <Li>We do not offer refunds for partial billing periods unless required by law.</Li>
          <Li>We reserve the right to change pricing with at least 30 days&apos; notice to active subscribers.</Li>
        </Section>

        <Section title="8. Intellectual Property">
          <p style={{ margin: 0 }}>
            The Platform, including its design, code, trademarks, and content created by RopesTrack, is our exclusive property. Nothing in these Terms grants you any right to use our trademarks, logos, or branding. You may not copy, reproduce, or create derivative works from the Platform without our express written consent.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p style={{ margin: 0 }}>
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED. USE OF THE PLATFORM IS AT YOUR OWN RISK.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p style={{ margin: 0 }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROPESTRACK AND ITS OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL — ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRIOR TO THE CLAIM.
          </p>
        </Section>

        <Section title="11. Indemnification">
          <p style={{ margin: 0 }}>
            You agree to defend, indemnify, and hold harmless RopesTrack and its affiliates from any claims, damages, losses, and expenses (including reasonable legal fees) arising out of your use of the Platform, your violation of these Terms, or your violation of any applicable law or the rights of a third party.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p style={{ margin: 0 }}>
            These Terms are governed by and construed in accordance with applicable international commercial law. Any disputes arising from these Terms shall first be addressed through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration. Nothing in this clause prevents either party from seeking injunctive relief in a court of competent jurisdiction.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p style={{ margin: 0 }}>
            We may update these Terms at any time. We will notify you of material changes by email or by displaying a notice on the Platform at least 14 days before the changes take effect. Your continued use of the Platform after the effective date constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p style={{ margin: 0 }}>
            For questions about these Terms, contact us at:<br /><br />
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
