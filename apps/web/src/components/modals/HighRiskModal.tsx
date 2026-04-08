'use client';

import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useI18n } from '@/i18n/context';

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

function getRiskPill(score: number) {
  if (score >= 9) return 'bg-red-100 text-red-700 border border-red-200';
  if (score >= 7) return 'bg-orange-100 text-orange-700 border border-orange-200';
  return 'bg-amber-100 text-amber-700 border border-amber-200';
}

function exportCSV(contracts: Contract[]) {
  const headers = ['Name', 'Party A', 'Party B', 'Risk Score', 'End Date', 'AI Summary'];
  const rows = contracts.map((c) => [
    `"${c.name}"`,
    `"${c.party_a}"`,
    `"${c.party_b}"`,
    c.risk_score,
    new Date(c.end_date).toLocaleDateString('en-US'),
    `"${(c.ai_summary ?? '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'high-risk-contracts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function HighRiskModal({ isOpen, onClose }: Props) {
  const { t, dateLocale } = useI18n();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch('/api/contracts')
      .then((r) => r.json())
      .then((data) => {
        const all: Contract[] = Array.isArray(data) ? data : (data.contracts ?? []);
        const highRisk = all
          .filter((c) => c.risk_score >= 7)
          .sort((a, b) => b.risk_score - a.risk_score);
        setContracts(highRisk);
      })
      .catch(() => setError(t.modals.highRisk.failedToLoad))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.highRisk.title}
      subtitle={
        loading
          ? t.loading
          : t.modals.highRisk.subtitle
      }
      printTitle="ContractOS — High Risk Contracts Report"
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
            {t.modals.highRisk.downloadCSV}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">{t.modals.highRisk.noHighRisk}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[t.table.name, t.table.parties, t.table.riskScore, t.table.endDate, t.table.aiSummary].map((h) => (
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
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.type}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="max-w-[160px]">
                        <div className="truncate text-xs">{c.party_a}</div>
                        <div className="truncate text-xs text-gray-400">/ {c.party_b}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${getRiskPill(c.risk_score)}`}
                      >
                        {c.risk_score}/10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(c.end_date).toLocaleDateString(dateLocale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500 max-w-xs truncate">
                        {c.ai_summary ?? <span className="text-gray-300 italic">No summary</span>}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
