'use client';

import { useEffect, useState } from 'react';
import Modal from '../Modal';

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
  file_url?: string | null;
  ai_summary?: string | null;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function getDaysUntilExpiry(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysColor(days: number): string {
  if (days <= 30) return 'text-red-600 font-semibold';
  if (days <= 60) return 'text-amber-600 font-semibold';
  return 'text-blue-600 font-semibold';
}

function getUrgencyBarColor(days: number): string {
  if (days <= 30) return 'bg-red-400';
  if (days <= 60) return 'bg-amber-400';
  return 'bg-blue-400';
}

function getUrgencyBarWidth(days: number): string {
  // 90 days = 100%, scale down accordingly
  const pct = Math.max(0, Math.min(100, ((90 - days) / 90) * 100));
  return `${pct}%`;
}

function exportCSV(contracts: Contract[]) {
  const headers = ['Name', 'Type', 'End Date', 'Days Left', 'Risk Score', 'Status'];
  const rows = contracts.map((c) => [
    `"${c.name}"`,
    `"${c.type}"`,
    new Date(c.end_date).toLocaleDateString('en-US'),
    getDaysUntilExpiry(c.end_date),
    c.risk_score,
    c.status,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expiring-contracts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpiringModal({ isOpen, onClose }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch('/api/contracts?status=active')
      .then((r) => r.json())
      .then((data) => {
        const all: Contract[] = Array.isArray(data) ? data : (data.contracts ?? []);
        const expiring = all
          .filter((c) => getDaysUntilExpiry(c.end_date) <= 90)
          .sort((a, b) => getDaysUntilExpiry(a.end_date) - getDaysUntilExpiry(b.end_date));
        setContracts(expiring);
      })
      .catch(() => setError('Failed to load contracts'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expiring Contracts"
      subtitle={
        loading
          ? 'Loading...'
          : `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} expiring within 90 days`
      }
      printTitle="ContractOS — Expiring Contracts Report"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex justify-end">
          <button
            onClick={() => exportCSV(contracts)}
            disabled={contracts.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors print:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">No contracts expiring in the next 90 days</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Contract Name', 'Type', 'End Date', 'Days Left', 'Risk Score', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const days = getDaysUntilExpiry(c.end_date);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors relative">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {/* Urgency bar */}
                          <div className="mt-1.5 h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getUrgencyBarColor(days)}`}
                              style={{ width: getUrgencyBarWidth(days) }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.type}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(c.end_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getDaysColor(days)}>{days}d</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            c.risk_score >= 7
                              ? 'bg-red-100 text-red-700'
                              : c.risk_score >= 4
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.risk_score}/10
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/contracts/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                        >
                          View &rarr;
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
