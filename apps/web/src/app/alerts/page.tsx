'use client';

import { useEffect, useState } from "react";
import SnoozeButton from "@/components/SnoozeButton";
import { useI18n } from '@/i18n/context';

interface Alert {
  id: string;
  contract_id: string;
  message: string;
  severity: string;
  trigger_date: string;
  status: string;
  snoozed_until: string | null;
  is_snoozed: boolean;
  deadline: string | null;
  created_at: string;
  contract_name?: string | null;
}

const FILTERS = ["All", "Unread", "Critical", "Warning", "Snoozed"] as const;
type Filter = typeof FILTERS[number];

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return (
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100 flex-shrink-0">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  if (severity === "warning")
    return (
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
        <span className="text-amber-500 text-lg font-bold leading-none">!</span>
      </div>
    );
  return (
    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    </div>
  );
}

function getCardBorder(severity: string, snoozed: boolean) {
  if (snoozed) return "border-violet-200 bg-violet-50/40";
  if (severity === "critical") return "border-red-200 bg-red-50";
  if (severity === "warning") return "border-amber-200 bg-amber-50";
  return "border-blue-200 bg-blue-50";
}

function getSeverityBadge(severity: string) {
  if (severity === "critical") return "bg-red-100 text-red-700";
  if (severity === "warning") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse flex items-start gap-4">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { t, dateLocale } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlerts = () => {
    setLoading(true);
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(Array.isArray(data) ? data : data.alerts ?? []))
      .catch(() => setError(t.alertsPage.failedToLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const patchAlert = async (alertId: string, payload: Record<string, string>) => {
    setActionLoading(alertId);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, ...(data.alert ?? data) } : a))
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const markRead = (id: string) => patchAlert(id, { status: "read" });
  const dismiss = (id: string) => patchAlert(id, { status: "dismissed" });

  const handleSnoozed = (id: string, snoozedUntil: string) => {
    setAlerts((prev) =>
      prev.map((a) => a.id === id ? { ...a, snoozed_until: snoozedUntil, is_snoozed: true } : a)
    );
  };

  const today = new Date().toISOString().split('T')[0];

  const filtered = alerts.filter((a) => {
    if (a.status === "dismissed") return false;
    if (activeFilter === "All") return !a.is_snoozed;
    if (activeFilter === "Unread") return a.status === "unread" && !a.is_snoozed;
    if (activeFilter === "Critical") return a.severity === "critical" && !a.is_snoozed;
    if (activeFilter === "Warning") return a.severity === "warning" && !a.is_snoozed;
    if (activeFilter === "Snoozed") return !!(a.snoozed_until && a.snoozed_until >= today);
    return true;
  });

  const unreadCount = alerts.filter((a) => a.status === "unread" && !a.is_snoozed).length;
  const snoozedCount = alerts.filter((a) => a.is_snoozed).length;

  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
          {t.alertsPage.title}
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.alertsPage.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        {FILTERS.map((f) => {
          const filterLabels: Record<Filter, string> = {
            All: t.alertsPage.filterAll,
            Unread: t.alertsPage.filterUnread,
            Critical: t.alertsPage.filterCritical,
            Warning: t.alertsPage.filterWarning,
            Snoozed: t.alertsPage.filterSnoozed,
          };
          return (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeFilter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {filterLabels[f]}
            {f === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
            {f === "Snoozed" && snoozedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold">
                {snoozedCount}
              </span>
            )}
          </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Alerts list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-700">
              {activeFilter === "Snoozed" ? t.alertsPage.noSnoozed : t.alertsPage.noAlerts}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilter === "All" ? t.alertsPage.allCaughtUp :
               activeFilter === "Snoozed" ? t.alertsPage.nothingSnoozed :
               t.alertsPage.noFiltered.replace('{filter}', activeFilter.toLowerCase())}
            </p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4 transition-opacity ${
                alert.status === "read" ? "opacity-60" : ""
              } ${getCardBorder(alert.severity, alert.is_snoozed)}`}
            >
              <SeverityIcon severity={alert.severity} />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityBadge(alert.severity)}`}>
                    {t.severity[alert.severity as keyof typeof t.severity] ?? (alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1))}
                  </span>
                  {alert.is_snoozed && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t.alertsPage.snoozedUntil.replace('{date}', new Date(alert.snoozed_until!).toLocaleDateString(dateLocale, { month: "short", day: "numeric" }))}
                    </span>
                  )}
                  {alert.status === "unread" && !alert.is_snoozed && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                      {t.alertsPage.new}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{alert.message}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {alert.contract_name && (
                    <span className="text-xs text-gray-400">
                      Contract: <span className="text-gray-600 font-medium">{alert.contract_name}</span>
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    Triggers:{" "}
                    <span className="text-gray-600">
                      {new Date(alert.trigger_date).toLocaleDateString(dateLocale, {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </span>
                  {alert.deadline && (
                    <span className="text-xs text-gray-400">
                      Deadline:{" "}
                      <span className="text-gray-600 font-medium">
                        {new Date(alert.deadline).toLocaleDateString(dateLocale, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-row sm:flex-row items-center gap-2 flex-shrink-0 self-end sm:self-start">
                <SnoozeButton
                  itemId={alert.id}
                  deadline={alert.deadline}
                  snoozedUntil={alert.snoozed_until}
                  apiPath="/api/alerts"
                  onSnoozed={handleSnoozed}
                />
                {alert.status === "unread" && !alert.is_snoozed && (
                  <button
                    onClick={() => markRead(alert.id)}
                    disabled={actionLoading === alert.id}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {actionLoading === alert.id ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : t.alertsPage.markRead}
                  </button>
                )}
                <button
                  onClick={() => dismiss(alert.id)}
                  disabled={actionLoading === alert.id}
                  className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {t.alertsPage.dismiss}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
