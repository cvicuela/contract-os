'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: 'expiry' | 'notice' | 'obligation' | 'alert';
  label: string;
  contractId: string;
  contractName: string;
  severity?: string;
}

interface Contract {
  id: string;
  name: string;
  end_date: string;
  notice_days: number;
  status: string;
}

interface Obligation {
  id: string;
  contract_id: string;
  description: string;
  next_due_date: string | null;
  status: string;
}

interface Alert {
  id: string;
  contract_id: string;
  message: string;
  trigger_date: string;
  severity: string;
  status: string;
  contracts?: { name: string } | null;
}

const EVENT_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  expiry:     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',     label: 'Expiry' },
  notice:     { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Notice Deadline' },
  obligation: { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'Obligation' },
  alert:      { dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Alert' },
};

function addToGoogleCalendar(event: CalendarEvent) {
  const start = event.date.replace(/-/g, '');
  const end = event.date.replace(/-/g, '');
  const title = encodeURIComponent(`ContractOS: ${event.label}`);
  const details = encodeURIComponent(`Contract: ${event.contractName}\nType: ${EVENT_STYLES[event.type].label}\nView at: http://localhost:3001/contracts/${event.contractId}`);
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  window.open(url, '_blank');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cRes, aRes] = await Promise.all([
          fetch('/api/contracts'),
          fetch('/api/alerts'),
        ]);

        const [cData, aData] = await Promise.all([
          cRes.ok ? cRes.json() : { contracts: [] },
          aRes.ok ? aRes.json() : { alerts: [] },
        ]);

        // Fetch all obligations via contracts
        const contracts: Contract[] = cData.contracts ?? [];
        const alerts: Alert[] = aData.alerts ?? [];

        const evts: CalendarEvent[] = [];

        // Contract expiry + notice deadlines
        for (const c of contracts) {
          if (c.end_date && c.status !== 'expired') {
            evts.push({
              date: c.end_date.split('T')[0],
              type: 'expiry',
              label: `${c.name} expires`,
              contractId: c.id,
              contractName: c.name,
            });
            if (c.notice_days > 0) {
              const noticeDate = new Date(c.end_date);
              noticeDate.setDate(noticeDate.getDate() - c.notice_days);
              evts.push({
                date: noticeDate.toISOString().split('T')[0],
                type: 'notice',
                label: `${c.name} — notice deadline`,
                contractId: c.id,
                contractName: c.name,
              });
            }
          }
        }

        // Alerts
        for (const a of alerts) {
          if (a.trigger_date && a.status !== 'dismissed') {
            const contractName = (a.contracts as { name?: string } | null)?.name ?? 'Contract';
            evts.push({
              date: a.trigger_date.split('T')[0],
              type: 'alert',
              label: a.message,
              contractId: a.contract_id,
              contractName,
              severity: a.severity,
            });
          }
        }

        // Fetch obligations per contract
        const obRes = await Promise.all(
          contracts.map((c) =>
            fetch(`/api/contracts/${c.id}`)
              .then((r) => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (let i = 0; i < contracts.length; i++) {
          const data = obRes[i];
          if (!data) continue;
          const obs: Obligation[] = data.contract?.obligations ?? [];
          for (const ob of obs) {
            if (ob.next_due_date && ob.status !== 'completed') {
              evts.push({
                date: ob.next_due_date.split('T')[0],
                type: 'obligation',
                label: ob.description?.split(':')[0] ?? ob.description,
                contractId: contracts[i].id,
                contractName: contracts[i].name,
              });
            }
          }
        }

        setEvents(evts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const todayStr = today.toISOString().split('T')[0];
  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];

  // Events in current month for sidebar
  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return events
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, year, month]);

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6 print-hide">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Contract deadlines, obligations & alerts at a glance</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(EVENT_STYLES).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${val.dot}`} />
              {val.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading events...</div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {[...Array(firstDow)].map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/50" />
              ))}

              {/* Day cells */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = eventsByDate[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const isPast = dateStr < todayStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 text-left transition-colors hover:bg-indigo-50/50 ${
                      isSelected ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : ''
                    } ${isPast ? 'opacity-60' : ''}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev, ei) => (
                        <div
                          key={ei}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${EVENT_STYLES[ev.type].badge}`}
                          title={ev.label}
                        >
                          {ev.label}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: selected day or month list */}
        <div className="space-y-4">
          {/* Selected day panel */}
          {selectedDay && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3 space-y-2">
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No events</p>
                ) : selectedEvents.map((ev, i) => (
                  <div key={i} className={`rounded-lg border px-3 py-2.5 ${EVENT_STYLES[ev.type].badge}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-snug truncate">{ev.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5 truncate">{ev.contractName}</p>
                      </div>
                      <button
                        onClick={() => addToGoogleCalendar(ev)}
                        title="Add to Google Calendar"
                        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
                        </svg>
                      </button>
                    </div>
                    <Link
                      href={`/contracts/${ev.contractId}`}
                      className="text-[10px] underline underline-offset-2 opacity-70 hover:opacity-100 mt-1 block"
                    >
                      View contract →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month events list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {MONTHS[month]} — {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
              {monthEvents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No events this month</p>
              ) : monthEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center flex-shrink-0 w-8">
                    <span className="text-xs font-bold text-gray-800 leading-none">
                      {parseInt(ev.date.split('-')[2])}
                    </span>
                    <span className={`w-2 h-2 rounded-full mt-1 ${EVENT_STYLES[ev.type].dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate leading-snug">{ev.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ev.contractName}</p>
                  </div>
                  <button
                    onClick={() => addToGoogleCalendar(ev)}
                    title="Add to Google Calendar"
                    className="flex-shrink-0 text-gray-300 hover:text-indigo-500 transition-colors mt-0.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
