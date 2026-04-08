'use client';

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  contract_id: string;
  message: string;
  severity: string;
  trigger_date: string;
  status: string;
  created_at: string;
  contract_name?: string | null;
}

const FILTERS = ["All", "Unread", "Critical", "Warning"] as const;
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

function getCardBorder(severity: string) {
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
      .catch(() => setError("Failed to load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

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

  const filtered = alerts.filter((a) => {
    if (activeFilter === "All") return a.status !== "dismissed";
    if (activeFilter === "Unread") return a.status === "unread";
    if (activeFilter === "Critical") return a.severity === "critical" && a.status !== "dismissed";
    if (activeFilter === "Warning") return a.severity === "warning" && a.status !== "dismissed";
    return true;
  });

  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2.5">
            Alerts
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor contract deadlines and risks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeFilter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
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
            <h3 className="text-sm font-medium text-gray-700">No alerts</h3>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilter === "All" ? "All caught up — no active alerts" : `No ${activeFilter.toLowerCase()} alerts`}
            </p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-5 flex items-start gap-4 transition-opacity ${
                alert.status === "read" ? "opacity-60" : ""
              } ${getCardBorder(alert.severity)}`}
            >
              <SeverityIcon severity={alert.severity} />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                  {alert.status === "unread" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                      New
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
                      {new Date(alert.trigger_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {alert.status === "unread" && (
                  <button
                    onClick={() => markRead(alert.id)}
                    disabled={actionLoading === alert.id}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {actionLoading === alert.id ? (
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        ...
                      </span>
                    ) : (
                      "Mark Read"
                    )}
                  </button>
                )}
                <button
                  onClick={() => dismiss(alert.id)}
                  disabled={actionLoading === alert.id}
                  className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
