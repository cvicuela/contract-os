"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useI18n, LanguageToggle } from '@/i18n/context'

const PLANS = [
  {
    key: 'trial' as const,
    highlight: false,
    badge: false,
    description: "Try ContractOS risk-free. No credit card required.",
    features: [
      "Full AI contract analysis",
      "Risk scoring & recommendations",
      "Obligation tracking",
      "Expiry alerts",
      "10/10 improvement report",
    ],
    ctaAction: "signup",
    paypal: false,
  },
  {
    key: 'starter' as const,
    highlight: true,
    badge: true,
    description: "For freelancers and small teams managing contracts daily.",
    features: [
      "Everything in Free Trial",
      "10 contracts / month",
      "Priority AI processing",
      "PDF export & print reports",
      "Google Drive sync",
      "Email alerts",
    ],
    ctaAction: "paypal",
    paypalPlanId: "P-48864583F3428854WNHLIZ2I",
    paypal: true,
  },
  {
    key: 'professional' as const,
    highlight: false,
    badge: false,
    description: "25 contracts for growing businesses and legal teams.",
    features: [
      "Everything in Starter",
      "25 contracts",
      "Team members (up to 5)",
      "Custom clause library",
      "API access",
      "Dedicated support",
    ],
    ctaAction: "paypal",
    paypalPlanId: "P-0R278795KG320490CNHLIZ2I",
    paypal: true,
  },
]

const FEATURE_ICONS = [
  <svg key="ai" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
  <svg key="risk" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>,
  <svg key="report" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>,
  <svg key="alerts" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>,
  <svg key="calendar" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  <svg key="print" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
]

const FEATURE_KEYS = ['aiAnalysis', 'riskScoring', 'report', 'obligationAlerts', 'calendarSync', 'printReports'] as const

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemo = async () => {
    setDemoLoading(true)
    await fetch("/api/demo", { method: "POST" })
    router.push("/")
  }

  const handlePlanCta = async (action: string, paypalPlanId?: string) => {
    if (action === "signup") {
      signIn("google", { callbackUrl: "/" })
    } else if (action === "paypal" && paypalPlanId) {
      try {
        const res = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: paypalPlanId }),
        })
        const data = await res.json()
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          signIn("google", { callbackUrl: "/" })
        }
      } catch {
        signIn("google", { callbackUrl: "/" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
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
            {demoLoading ? t.loading : t.login.liveDemo}
          </button>
          <LanguageToggle />
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="text-sm font-medium bg-white text-gray-950 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t.login.signIn}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t.login.heroTagline}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          {t.login.heroTitle.split(',')[0]},<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            {t.login.heroTitle.split(',').slice(1).join(',').trim()}
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.login.heroDescription}
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
            {t.login.startFreeTrial}
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
            {demoLoading ? t.login.loadingDemo : t.login.tryLiveDemo}
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          {t.login.trialNote}
        </p>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">{t.login.featuresTitle}</h2>
          <p className="text-gray-400 text-sm">{t.login.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURE_KEYS.map((key, i) => (
            <div key={key} className="flex items-start gap-4 sm:block bg-white/5 border border-white/8 rounded-xl p-4 sm:p-5 hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 sm:w-9 sm:h-9 bg-indigo-500/15 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 sm:mb-4">
                {FEATURE_ICONS[i]}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm mb-0.5 sm:mb-1.5">{t.login.features[key].title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{t.login.features[key].desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">{t.login.pricingTitle}</h2>
          <p className="text-gray-400 text-sm">{t.login.pricingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const planT = t.login.plans[plan.key];
            return (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 flex flex-col gap-5 ${
                plan.highlight
                  ? "bg-indigo-600 border border-indigo-500 shadow-xl shadow-indigo-500/20"
                  : "bg-slate-800 border border-slate-700"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                  {t.login.mostPopular}
                </span>
              )}

              <div>
                <p className={`text-sm font-medium mb-1 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  {planT.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-white"}`}>{planT.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                    /{planT.period}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  {plan.description}
                </p>
              </div>

              <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${
                plan.highlight ? "bg-indigo-500/50 text-white" : "bg-slate-700 text-slate-300"
              }`}>
                {planT.contracts}
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs">
                    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-200" : "text-emerald-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-indigo-100" : "text-slate-300"}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanCta(plan.ctaAction, plan.paypalPlanId)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow"
                    : "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600"
                }`}
              >
                {planT.cta}
              </button>

              {plan.paypal && (
                <p className="text-center text-xs text-slate-500 -mt-2">
                  {t.login.billingNote}
                </p>
              )}
            </div>
            );
          })}
        </div>

        {/* Enterprise row */}
        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-1 text-white">{t.login.enterprise.title}</p>
            <p className="text-sm text-slate-400">{t.login.enterprise.description}</p>
          </div>
          <a
            href="mailto:carlos@mynameisaro.com"
            className="shrink-0 text-sm font-medium border border-slate-600 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
          >
            {t.login.enterprise.contact}
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
          {t.login.footer.copyright}
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <a href="mailto:carlos@mynameisaro.com" className="hover:text-gray-400 transition-colors">{t.login.footer.contact}</a>
          <span>·</span>
          <span>{t.poweredBy}</span>
        </div>
      </footer>
    </div>
  )
}
