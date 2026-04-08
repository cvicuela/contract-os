'use client';

import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { useI18n } from '@/i18n/context';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function severityIcon(severity: string) {
  if (severity === 'critical') {
    return (
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-100">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </span>
    );
  }
  if (severity === 'warning') {
    return (
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100">
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
      </svg>
    </span>
  );
}

function severityRowBg(severity: string): string {
  if (severity === 'critical') return 'border-red-100 bg-red-50/40';
  if (severity === 'warning') return 'border-amber-100 bg-amber-50/40';
  return 'border-blue-100 bg-blue-50/40';
}

function severityLabel(severity: string): string {
  if (severity === 'critical') return 'text-red-700 bg-red-100';
  if (severity === 'warning') return 'text-amber-700 bg-amber-100';
  return 'text-blue-700 bg-blue-100';
}

async function patchAlert(id: string, status: string) {
  return fetch('/api/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
}

export default function AlertsModal({ isOpen, onClose }: Props) {
  const { t, dateLocale } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data) => {
        const all: Alert[] = Array.isArray(data) ? data : (data.alerts ?? []);
        const active = all
          .filter((a) => a.status !== 'dismissed')
          .sort(
            (a, b) =>
              (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
          );
        setAlerts(active);
      })
      .catch(() => setError(t.modals.alerts.failedToLoad))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const dismissAlert = async (id: string) => {
    await patchAlert(id, 'dismissed');
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => a.status === 'unread');
    await Promise.all(unread.map((a) => patchAlert(a.id, 'read')));
    setAlerts((prev) => prev.map((a) => (a.status === 'unread' ? { ...a, status: 'read' } : a)));
  };

  const dismissAll = async () => {
    await Promise.all(alerts.map((a) => patchAlert(a.id, 'dismissed')));
    setAlerts([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.alerts.title}
      subtitle={
        loading
          ? 'Loading...'
          : `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`
      }
      printTitle="ContractOS — Active Alerts Report"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        {!loading && alerts.length > 0 && (
          <div className="flex items-center gap-2 justify-end print:hidden">
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.modals.alerts.markRead}
            </button>
            <button
              onClick={dismissAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              {t.modals.alerts.dismiss}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">{t.modals.alerts.noAlerts}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${severityRowBg(alert.severity)}`}
              >
                {severityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm text-gray-800 flex-1">{alert.message}</p>
                    <span
                      className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${severityLabel(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {alert.contract_name && (
                      <a
                        href={`/contracts/${alert.contract_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {alert.contract_name}
                      </a>
                    )}
                    {alert.trigger_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(alert.trigger_date).toLocaleDateString(dateLocale, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="print:hidden flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded hover:bg-white transition-colors"
                >
                  {t.modals.alerts.dismiss}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
