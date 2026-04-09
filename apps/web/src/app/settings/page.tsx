'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/context'

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic Claude', prefix: 'sk-ant-', helpUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'OpenAI GPT', prefix: 'sk-', helpUrl: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', prefix: '', helpUrl: 'https://aistudio.google.com/apikey' },
] as const

export default function SettingsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [provider, setProvider] = useState('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savedProvider, setSavedProvider] = useState<string | null>(null)
  const [savedKeyHint, setSavedKeyHint] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/user/ai-key')
      .then(r => r.json())
      .then(data => {
        if (data.provider) {
          setSavedProvider(data.provider)
          setSavedKeyHint(data.keyHint)
          setProvider(data.provider)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/ai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setSavedProvider(data.provider)
        setSavedKeyHint(data.keyHint)
        setApiKey('')
        setMessage({ type: 'success', text: t.settings.keySaved })
      } else {
        setMessage({ type: 'error', text: data.error || t.settings.keyError })
      }
    } catch {
      setMessage({ type: 'error', text: t.settings.keyError })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleDelete = async () => {
    try {
      await fetch('/api/user/ai-key', { method: 'DELETE' })
      setSavedProvider(null)
      setSavedKeyHint(null)
      setMessage({ type: 'success', text: t.settings.keyDeleted })
    } catch {}
    setTimeout(() => setMessage(null), 4000)
  }

  const selectedProviderInfo = PROVIDERS.find(p => p.id === provider)

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-32" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.settings.subtitle}</p>
      </div>

      {/* AI Configuration Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{t.settings.aiConfig}</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Current status */}
          {savedProvider && savedKeyHint && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    {PROVIDERS.find(p => p.id === savedProvider)?.name}
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {t.settings.keyHint.replace('{hint}', savedKeyHint)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                {t.settings.deleteKey}
              </button>
            </div>
          )}

          {!savedProvider && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">{t.settings.noKeyConfigured}</p>
                <p className="text-xs text-amber-600 mt-0.5">{t.settings.basicAnalysisNote}</p>
              </div>
            </div>
          )}

          {/* Provider selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.settings.aiProvider}</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    provider === p.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* API key input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.settings.apiKey}</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={t.settings.apiKeyPlaceholder}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {selectedProviderInfo && (
              <p className="text-xs text-gray-400 mt-1.5">
                <a href={selectedProviderInfo.helpUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600">
                  {t.settings.getKeyHelp} →
                </a>
              </p>
            )}
          </div>

          {/* Encryption note */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t.settings.encryptionNote}
          </p>

          {/* Message */}
          {message && (
            <div className={`text-sm px-4 py-2.5 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t.loading : t.settings.saveKey}
          </button>
        </div>
      </div>
    </div>
  )
}
