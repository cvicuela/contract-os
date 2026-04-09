import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — ContractOS' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-3xl mx-auto">
        <Link href="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">ContractOS</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          We collect information you provide directly: your Google account email and name (via OAuth), and contract documents you upload for analysis. We also collect usage data such as page views and feature interactions.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Your data is used to provide the Service: AI contract analysis, risk scoring, obligation tracking, and alerts. Contract text is sent to Anthropic&apos;s Claude API for analysis and is not stored by Anthropic beyond the API request.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. Data Storage</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Your data is stored securely in Supabase (PostgreSQL) with row-level security. Each user can only access their own contracts and data. We use HTTPS for all data in transit.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Third-Party Services</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          We use: Google OAuth (authentication), Anthropic Claude AI (contract analysis), Supabase (database), PayPal (payments), and Netlify (hosting). Each service has its own privacy policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Retention and Deletion</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          You may delete your contracts at any time. Upon account deletion, all associated data is permanently removed. Demo session data is ephemeral and isolated.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Your Rights</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          You have the right to access, correct, or delete your personal data. For GDPR and CCPA requests, contact us at <a href="mailto:hello@contractos.app" className="text-indigo-400 hover:text-indigo-300">hello@contractos.app</a>.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          For privacy inquiries, contact <a href="mailto:hello@contractos.app" className="text-indigo-400 hover:text-indigo-300">hello@contractos.app</a>.
        </p>
      </main>
    </div>
  )
}
