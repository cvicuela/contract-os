'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

function addToGoogleCalendar(title: string, date: string, details: string) {
  const d = date.replace(/-/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}/${d}&details=${encodeURIComponent(details)}`;
  window.open(url, '_blank');
}

interface Contract {
  id: string;
  name: string;
  type: string;
  party_a: string;
  party_b: string;
  start_date: string;
  end_date: string;
  renewal_type: string;
  notice_days: number;
  risk_score: number;
  status: string;
  file_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

interface Obligation {
  id: string;
  contract_id: string;
  description: string;
  frequency: string;
  next_due_date: string;
  status: string;
  risk_level: string;
}

interface Alert {
  id: string;
  contract_id: string;
  message: string;
  severity: string;
  trigger_date: string;
  status: string;
  created_at: string;
}

function getRiskColors(score: number) {
  if (score <= 3) return { text: "text-emerald-700", bg: "bg-emerald-100", gauge: "bg-emerald-500", label: "Low" };
  if (score <= 6) return { text: "text-amber-700", bg: "bg-amber-100", gauge: "bg-amber-500", label: "Medium" };
  return { text: "text-red-700", bg: "bg-red-100", gauge: "bg-red-500", label: "High" };
}

function getStatusColors(status: string) {
  switch (status.toLowerCase()) {
    case "active": return "bg-emerald-100 text-emerald-700";
    case "expired": return "bg-gray-100 text-gray-600";
    case "expiring": return "bg-amber-100 text-amber-700";
    case "draft": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function getObligationRiskColors(level: string) {
  switch (level.toLowerCase()) {
    case "high": return "bg-red-100 text-red-700";
    case "medium": return "bg-amber-100 text-amber-700";
    default: return "bg-emerald-100 text-emerald-700";
  }
}

function getSeverityColors(severity: string) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 min-w-[140px]">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [contract, setContract] = useState<Contract | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [cRes, oRes, aRes] = await Promise.all([
          fetch(`/api/contracts/${id}`),
          fetch(`/api/contracts/${id}/obligations`),
          fetch(`/api/contracts/${id}/alerts`),
        ]);

        if (!cRes.ok) throw new Error("Contract not found");

        const [cData, oData, aData] = await Promise.all([
          cRes.json(),
          oRes.ok ? oRes.json() : [],
          aRes.ok ? aRes.json() : [],
        ]);

        setContract(cData.contract ?? cData);
        setObligations(Array.isArray(oData) ? oData : oData.obligations ?? []);
        setAlerts(Array.isArray(aData) ? aData : aData.alerts ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load contract");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleMarkExpired = async () => {
    if (!contract) return;
    setActionLoading("expire");
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "expired" }),
      });
      if (res.ok) {
        const data = await res.json();
        setContract(data.contract ?? data);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract? This cannot be undone.")) return;
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/contracts");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-screen-xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-6 bg-gray-100 rounded w-96" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-48 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8 max-w-screen-xl mx-auto">
        <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contracts
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Contract not found"}
        </div>
      </div>
    );
  }

  const risk = getRiskColors(contract.risk_score);
  const gaugeWidth = `${contract.risk_score * 10}%`;

  const calendarTitle = `Contract Expiry: ${contract.name}`;
  const calendarDetails = `Contract: ${contract.name}\nParties: ${contract.party_a} / ${contract.party_b}\nRisk: ${contract.risk_score}/10\nView at: http://localhost:3001/contracts/${id}`;

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6">

      {/* ── Print-only header ── */}
      <div className="print-header hidden">
        <div>
          <span className="print-header-brand">ContractOS</span>
          <div style={{fontSize:'9pt',color:'#666',marginTop:'2pt'}}>Contract Intelligence Platform</div>
        </div>
        <span className="print-header-date">
          Printed {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className="print-footer hidden">
        ContractOS — Powered by Claude AI &nbsp;|&nbsp; Confidential
      </div>

      {/* Back + Actions */}
      <div className="flex items-center justify-between print-hide">
        <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contracts
        </Link>
        <div className="flex items-center gap-2">
          {contract.end_date && (
            <button
              onClick={() => addToGoogleCalendar(calendarTitle, contract.end_date, calendarDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Add expiry to Google Calendar"
            >
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
              </svg>
              Add to Calendar
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Contract Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{contract.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{contract.type}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColors(contract.status)}`}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                Risk: {contract.risk_score}/10 &mdash; {risk.label}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Added {new Date(contract.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contract Details</h2>
            <DetailRow label="Party A" value={contract.party_a} />
            <DetailRow label="Party B" value={contract.party_b} />
            <DetailRow label="Start Date" value={new Date(contract.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
            <DetailRow label="End Date" value={new Date(contract.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
            <DetailRow label="Renewal Type" value={contract.renewal_type} />
            <DetailRow label="Notice Days" value={`${contract.notice_days} days`} />
          </div>

          {/* AI Summary */}
          {contract.ai_summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-900">AI Summary</h2>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">Claude AI</span>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">{contract.ai_summary}</p>
            </div>
          )}

          {/* Obligations */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Obligations</h2>
            </div>
            {obligations.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No obligations recorded</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50">
                      {["Description", "Frequency", "Due Date", "Status", "Risk", ""].map((h) => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${h === '' ? 'print-hide' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {obligations.map((ob) => (
                      <tr key={ob.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800 max-w-xs">
                          <span className="line-clamp-2">{ob.description}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{ob.frequency ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {ob.next_due_date
                            ? new Date(ob.next_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColors(ob.status)}`}>
                            {ob.status.charAt(0).toUpperCase() + ob.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getObligationRiskColors(ob.risk_level)}`}>
                            {ob.risk_level.charAt(0).toUpperCase() + ob.risk_level.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 print-hide">
                          {ob.next_due_date && (
                            <button
                              onClick={() => addToGoogleCalendar(
                                `Obligation: ${ob.description?.split(':')[0]}`,
                                ob.next_due_date!,
                                `Contract: ${contract.name}\n${ob.description}`
                              )}
                              title="Add to Google Calendar"
                              className="text-gray-300 hover:text-blue-500 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Risk Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Risk Analysis</h2>

            {/* Risk Gauge */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Risk Score</span>
                <span className={`text-2xl font-bold ${risk.text}`}>{contract.risk_score}<span className="text-sm font-normal text-gray-400">/10</span></span>
              </div>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${risk.gauge} rounded-full transition-all`}
                  style={{ width: gaugeWidth }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Risk segments */}
            <div className="flex gap-1 mb-5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${
                    i < contract.risk_score
                      ? i < 3 ? "bg-emerald-400" : i < 6 ? "bg-amber-400" : "bg-red-400"
                      : "bg-gray-100"
                  }`}
                />
              ))}
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${risk.bg} ${risk.text}`}>
              <span className={`w-2 h-2 rounded-full ${risk.gauge}`} />
              {risk.label} Risk
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Alerts</h2>
            </div>
            <div className="p-4 space-y-2">
              {alerts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No alerts for this contract</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`px-3 py-2.5 rounded-lg border text-xs ${getSeverityColors(alert.severity)}`}>
                    <p className="font-medium leading-snug">{alert.message}</p>
                    <p className="mt-1 opacity-70">
                      {new Date(alert.trigger_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {contract.file_url && (
                <a
                  href={contract.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download File
                </a>
              )}
              <button
                onClick={handleMarkExpired}
                disabled={actionLoading !== null || contract.status === "expired"}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm font-medium rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === "expire" ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {contract.status === "expired" ? "Already Expired" : "Mark as Expired"}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === "delete" ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Delete Contract
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
