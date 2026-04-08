"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const PLANS = [
  {
    name: "Free Trial",
    price: "$0",
    period: "30 days",
    highlight: false,
    badge: null,
    description: "Try ContractOS risk-free. No credit card required.",
    contracts: "3 contracts",
    features: [
      "Full AI contract analysis",
      "Risk scoring & recommendations",
      "Obligation tracking",
      "Expiry alerts",
      "10/10 improvement report",
    ],
    cta: "Start Free Trial",
    ctaAction: "signup",
    paypal: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    highlight: true,
    badge: "Most Popular",
    description: "For freelancers and small teams managing contracts daily.",
    contracts: "25 contracts",
    features: [
      "Everything in Free Trial",
      "25 contracts / month",
      "Priority AI processing",
      "PDF export & print reports",
      "Google Drive sync",
      "Email alerts",
    ],
    cta: "Get Started",
    ctaAction: "paypal",
    paypalPlanId: "STARTER_MONTHLY",
    paypal: true,
  },
  {
    name: "Professional",
    price: "$79",
    period: "per month",
    highlight: false,
    badge: null,
    description: "Unlimited contracts for growing businesses and legal teams.",
    contracts: "Unlimited contracts",
    features: [
      "Everything in Starter",
      "Unlimited contracts",
      "Team members (up to 5)",
      "Custom clause library",
      "API access",
      "Dedicated support",
    ],
    cta: "Go Professional",
    ctaAction: "paypal",
    paypalPlanId: "PRO_MONTHLY",
    paypal: true,
  },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Contract Analysis",
    desc: "Claude AI reads your contract in seconds — extracts parties, dates, obligations, and flags every risk before you sign.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: "Risk Scoring",
    desc: "Every contract gets a 1–10 risk score with detailed reasoning. Know your exposure before it becomes a problem.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "10/10 Report",
    desc: "Get a numbered action list of exactly what to fix in your contract to make it bulletproof — specific clauses, not generic advice.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Obligation Alerts",
    desc: "Never miss a deadline. ContractOS tracks every obligation and sends alerts at 90, 60, and 30 days before expiry.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Calendar Sync",
    desc: "Add any expiry or obligation due date to Google Calendar with one click. Your contracts, your calendar.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Print-Ready Reports",
    desc: "Generate professional PDF reports for any contract — formatted for lawyers, executives, or audit reviews.",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemo = async () => {
    setDemoLoading(true)
    await fetch("/api/demo", { method: "POST" })
    router.push("/")
  }

  const handlePlanCta = (action: string) => {
    if (action === "signup") {
      signIn("google", { callbackUrl: "/" })
    } else if (action === "paypal") {
      // PayPal subscription integration — coming soon
      signIn("google", { callbackUrl: "/" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">ContractOS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
          >
            {demoLoading ? "Loading..." : "Live Demo"}
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="text-sm font-medium bg-white text-gray-950 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Powered by Claude AI — the most capable AI for document analysis
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Your contracts,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            finally under control
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any contract and get instant AI analysis — risk score, obligation tracking,
          expiry alerts, and an exact action plan to make it a perfect 10/10.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex items-center gap-2.5 bg-white text-gray-950 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Start Free Trial
          </button>
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {demoLoading ? "Loading demo..." : "Try Live Demo"}
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Free trial · No credit card required · 3 contracts included
        </p>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Everything you need to manage contracts</h2>
          <p className="text-gray-400 text-sm">From upload to insight in under 30 seconds.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/8 rounded-xl p-5 hover:bg-white/8 transition-colors">
              <div className="w-9 h-9 bg-indigo-500/15 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-400 text-sm">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col gap-5 ${
                plan.highlight
                  ? "bg-indigo-600 border border-indigo-500 shadow-xl shadow-indigo-500/20"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                  {plan.badge}
                </span>
              )}

              <div>
                <p className={`text-sm font-medium mb-1 ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}>
                  {plan.description}
                </p>
              </div>

              <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${
                plan.highlight ? "bg-indigo-500/50 text-white" : "bg-white/8 text-gray-300"
              }`}>
                {plan.contracts}
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs">
                    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-200" : "text-emerald-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-indigo-100" : "text-gray-300"}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanCta(plan.ctaAction)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                }`}
              >
                {plan.cta}
              </button>

              {plan.paypal && (
                <p className="text-center text-xs text-gray-500 -mt-2">
                  Billed via PayPal — cancel anytime
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Enterprise row */}
        <div className="mt-6 bg-white/3 border border-white/8 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-1">Enterprise</p>
            <p className="text-sm text-gray-400">Custom contracts, SSO, SLA, API access, and a dedicated account manager.</p>
          </div>
          <a
            href="mailto:hello@contractos.ai"
            className="shrink-0 text-sm font-medium border border-white/20 text-white px-5 py-2.5 rounded-xl hover:bg-white/8 transition-colors"
          >
            Contact us
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 px-6 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white/8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-gray-400">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          ContractOS &copy; 2026 · Contract Intelligence Platform
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <a href="mailto:hello@contractos.ai" className="hover:text-gray-400 transition-colors">Contact</a>
          <span>·</span>
          <span>Powered by Claude AI</span>
        </div>
      </footer>
    </div>
  )
}
