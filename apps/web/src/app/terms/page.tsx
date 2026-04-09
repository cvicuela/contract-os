import Link from 'next/link'

export const metadata = { title: 'Terms of Service — ContractOS' }

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          By accessing or using ContractOS (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          ContractOS is an AI-powered contract analysis platform that provides risk scoring, obligation tracking, and improvement recommendations. The Service uses Claude AI by Anthropic for document analysis.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. User Accounts</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to update it as necessary.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Acceptable Use</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          You may not use the Service for any unlawful purpose, to upload malicious content, or to attempt to circumvent security measures. Contract data uploaded is processed by AI and stored securely.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Subscriptions and Billing</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Paid plans are billed monthly via PayPal. You may cancel at any time. Refunds are handled on a case-by-case basis.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Limitation of Liability</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          The Service is provided &quot;as is&quot; without warranties. ContractOS is not a law firm and does not provide legal advice. AI-generated analysis is informational and should be reviewed by qualified professionals.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          For questions about these terms, contact us at <a href="mailto:hello@contractos.app" className="text-indigo-400 hover:text-indigo-300">hello@contractos.app</a>.
        </p>
      </main>
    </div>
  )
}
