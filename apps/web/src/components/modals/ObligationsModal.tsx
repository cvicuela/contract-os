'use client';

import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useI18n } from '@/i18n/context';

interface Obligation {
  id: string;
  contract_id: string;
  description: string;
  frequency: string;
  next_due_date: string;
  status: string;
  risk_level: string;
  contract_name?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function getOverdueDays(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function getOverdueColor(days: number): string {
  return days >= 7 ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold';
}

function getRiskBadge(risk: string): string {
  if (risk === 'high') return 'bg-red-100 text-red-700';
  if (risk === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export default function ObligationsModal({ isOpen, onClose }: Props) {
  const { t, dateLocale } = useI18n();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch('/api/obligations/overdue')
      .then((r) => r.json())
      .then((data) => {
        setObligations(Array.isArray(data) ? data : (data.obligations ?? []));
      })
      .catch(() => setError(t.modals.obligations.failedToLoad))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const markComplete = async (id: string) => {
    setCompleting((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/obligations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        setObligations((prev) => prev.filter((o) => o.id !== id));
      }
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.obligations.title}
      subtitle={
        loading
          ? t.loading
          : t.modals.obligations.subtitle
      }
      printTitle="ContractOS — Overdue Obligations Report"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : obligations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">{t.modals.obligations.noOverdue}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[t.table.description, t.table.name, t.table.nextDue, t.table.daysOverdue, t.table.riskLevel, t.table.actions].map((h) => (
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
                {obligations.map((o) => {
                  const overdueDays = getOverdueDays(o.next_due_date);
                  return (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-xs">{o.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{o.frequency}</p>
                      </td>
                      <td className="px-4 py-3">
                        {o.contract_name ? (
                          <a
                            href={`/contracts/${o.contract_id}`}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                          >
                            {o.contract_name}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {new Date(o.next_due_date).toLocaleDateString(dateLocale, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getOverdueColor(overdueDays)}`}>
                          {overdueDays}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(o.risk_level)}`}
                        >
                          {o.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => markComplete(o.id)}
                          disabled={completing.has(o.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors print:hidden"
                        >
                          {completing.has(o.id) ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Saving
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t.modals.obligations.markComplete}
                            </>
                          )}
                        </button>
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
