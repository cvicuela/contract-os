'use client';

import { useEffect, useState, useMemo } from 'react';
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

type SortKey = keyof Contract;
type SortDir = 'asc' | 'desc';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRiskPill(score: number) {
  if (score >= 7) return 'bg-red-100 text-red-700';
  if (score >= 4) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getStatusPill(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-emerald-100 text-emerald-700';
    case 'expired': return 'bg-gray-100 text-gray-600';
    case 'expiring': return 'bg-amber-100 text-amber-700';
    case 'draft': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function exportCSV(contracts: Contract[]) {
  const headers = [
    'Name', 'Type', 'Party A', 'Party B', 'Start Date', 'End Date',
    'Renewal Type', 'Notice Days', 'Risk Score', 'Status', 'Created At',
  ];
  const rows = contracts.map((c) => [
    `"${c.name}"`,
    `"${c.type}"`,
    `"${c.party_a}"`,
    `"${c.party_b}"`,
    formatDate(c.start_date),
    formatDate(c.end_date),
    `"${c.renewal_type}"`,
    c.notice_days,
    c.risk_score,
    c.status,
    formatDate(c.created_at),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all-contracts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'party_a', label: 'Party A' },
  { key: 'party_b', label: 'Party B' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'renewal_type', label: 'Renewal' },
  { key: 'notice_days', label: 'Notice' },
  { key: 'risk_score', label: 'Risk' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
];

export default function AllContractsModal({ isOpen, onClose }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSearch('');

    fetch('/api/contracts')
      .then((r) => r.json())
      .then((data) => {
        setContracts(Array.isArray(data) ? data : (data.contracts ?? []));
      })
      .catch(() => setError('Failed to load contracts'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.party_a.toLowerCase().includes(q) ||
          c.party_b.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [contracts, search, sortKey, sortDir]);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) {
      return <svg className="w-3 h-3 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    }
    return sortDir === 'asc' ? (
      <svg className="w-3 h-3 text-indigo-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    ) : (
      <svg className="w-3 h-3 text-indigo-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="All Contracts"
      subtitle={
        loading
          ? 'Loading...'
          : `${filtered.length} of ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`
      }
      printTitle="ContractOS — All Contracts Report"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="print:hidden inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              {search ? 'No contracts match your search' : 'No contracts yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon colKey={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => window.open(`/contracts/${c.id}`, '_blank')}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[180px] truncate">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.type}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{c.party_a}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{c.party_b}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.end_date)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.renewal_type}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.notice_days}d</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getRiskPill(c.risk_score)}`}>
                        {c.risk_score}/10
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPill(c.status)}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(c.created_at)}</td>
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
