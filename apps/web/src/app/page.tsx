'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ExpiringModal from '@/components/modals/ExpiringModal';
import HighRiskModal from '@/components/modals/HighRiskModal';
import AlertsModal from '@/components/modals/AlertsModal';
import ObligationsModal from '@/components/modals/ObligationsModal';
import AllContractsModal from '@/components/modals/AllContractsModal';

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

interface Alert {
  id: string;
  contract_id: string;
  message: string;
  severity: string;
  trigger_date: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_contracts: number;
  active_contracts: number;
  expiring_soon: number;
  high_risk: number;
  pending_alerts: number;
  overdue_obligations: number;
}

function getRiskColor(score: number) {
  if (score <= 3) return { text: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
  if (score <= 6) return { text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };
  return { text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' };
}

function getStatusColors(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-emerald-100 text-emerald-700';
    case 'expired': return 'bg-gray-100 text-gray-600';
    case 'expiring': return 'bg-amber-100 text-amber-700';
    case 'draft': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getDaysLeft(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-28" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [runningChecks, setRunningChecks] = useState(false);
  const [checksResult, setChecksResult] = useState<string | null>(null);

  // Modal state
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [showHighRisk, setShowHighRisk] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showObligations, setShowObligations] = useState(false);

  useEffect(() => {
    // Single request — dashboard API now returns stats + contracts + alerts
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? data)
        setContracts(data.contracts ?? [])
        setAlerts(data.alerts ?? [])
      })
      .catch(() => setStatsError('Failed to load dashboard'))
      .finally(() => {
        setLoadingStats(false)
        setLoadingContracts(false)
        setLoadingAlerts(false)
      })
  }, []);

  const dismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      // silently ignore
    }
  };

  const runChecks = async () => {
    setRunningChecks(true);
    setChecksResult(null);
    try {
      const res = await fetch('/api/scheduler/run');
      const data = await res.json();
      if (data.success) {
        setChecksResult(
          `Checks complete: ${data.alertsCreated} new alert${data.alertsCreated !== 1 ? 's' : ''} created, ${data.overdueObligationsMarked} obligation${data.overdueObligationsMarked !== 1 ? 's' : ''} marked overdue.`
        );
      } else {
        setChecksResult('Checks failed. Please try again.');
      }
    } catch {
      setChecksResult('Checks failed. Please try again.');
    } finally {
      setRunningChecks(false);
      // Auto-clear the result message after 5s
      setTimeout(() => setChecksResult(null), 5000);
    }
  };

  const userName = session?.user?.name?.split(' ')[0] ?? session?.user?.email ?? 'there';

  const statCards = stats
    ? [
        {
          label: 'Total Contracts',
          value: stats.total_contracts,
          accent: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          bg: 'bg-indigo-50',
          onClick: () => setShowAllContracts(true),
        },
        {
          label: 'Active Contracts',
          value: stats.active_contracts,
          accent: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bg: 'bg-emerald-50',
          onClick: () => router.push('/contracts?status=active'),
        },
        {
          label: 'Expiring Soon',
          value: stats.expiring_soon,
          accent: 'text-amber-600',
          icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          onClick: () => setShowExpiring(true),
        },
        {
          label: 'High Risk',
          value: stats.high_risk,
          accent: 'text-red-600',
          icon: (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bg: 'bg-red-50',
          border: 'border-red-200',
          onClick: () => setShowHighRisk(true),
        },
        {
          label: 'Pending Alerts',
          value: stats.pending_alerts,
          accent: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          bg: 'bg-violet-50',
          onClick: () => setShowAlerts(true),
        },
        {
          label: 'Overdue Obligations',
          value: stats.overdue_obligations,
          accent: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          bg: 'bg-orange-50',
          onClick: () => setShowObligations(true),
        },
      ]
    : [];

  const severityIcon = (severity: string) => {
    if (severity === 'critical')
      return <span className="text-red-500 text-lg leading-none">&#9888;</span>;
    if (severity === 'warning')
      return <span className="text-amber-500 font-bold text-lg leading-none">!</span>;
    return <span className="text-blue-500 font-bold text-lg leading-none">&#x2139;</span>;
  };

  const severityBg = (severity: string) => {
    if (severity === 'critical') return 'border-red-200 bg-red-50';
    if (severity === 'warning') return 'border-amber-200 bg-amber-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-8">
      {/* Top header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {getGreeting()}, {userName} &mdash; overview of your contract portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checksResult && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
              {checksResult}
            </span>
          )}
          <button
            onClick={runChecks}
            disabled={runningChecks}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {runningChecks ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run Checks
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/contracts?upload=true')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Contract
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {statsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{statsError}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {loadingStats
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => (
                <button
                  key={card.label}
                  onClick={card.onClick}
                  className={`bg-white rounded-xl border ${card.border ?? 'border-gray-200'} p-5 flex flex-col gap-3 text-left cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group w-full`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                      {card.icon}
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${card.accent} leading-none`}>{card.value}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-snug">{card.label}</div>
                  </div>
                </button>
              ))}
        </div>
      )}

      {/* Recent Contracts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Contracts</h2>
          <Link href="/contracts" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Type', 'Parties', 'End Date', 'Risk', 'Status', 'Days Left'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingContracts ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : contractsError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-red-600">{contractsError}</td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No contracts yet</td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const risk = getRiskColor(c.risk_score);
                  const daysLeft = getDaysLeft(c.end_date);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/contracts/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.type}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="truncate block max-w-[140px]">{c.party_a} / {c.party_b}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                          {c.risk_score}/10
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColors(c.status)}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Active Alerts</h2>
          <Link href="/alerts" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all &rarr;
          </Link>
        </div>
        <div className="p-4 space-y-2">
          {loadingAlerts ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))
          ) : alertsError ? (
            <p className="text-sm text-red-600 px-2">{alertsError}</p>
          ) : alerts.filter((a) => a.status !== 'dismissed').length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No active alerts</div>
          ) : (
            alerts
              .filter((a) => a.status !== 'dismissed')
              .slice(0, 6)
              .map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${severityBg(alert.severity)}`}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {severityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(alert.trigger_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium flex-shrink-0 px-2 py-1 rounded hover:bg-white transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AllContractsModal isOpen={showAllContracts} onClose={() => setShowAllContracts(false)} />
      <ExpiringModal isOpen={showExpiring} onClose={() => setShowExpiring(false)} />
      <HighRiskModal isOpen={showHighRisk} onClose={() => setShowHighRisk(false)} />
      <AlertsModal isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
      <ObligationsModal isOpen={showObligations} onClose={() => setShowObligations(false)} />
    </div>
  );
}
