import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Clock, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getShifts, getShiftHistory, timeInEmployee, timeOutEmployee } from '../utils/auth';
import { CustomDatePicker } from './CustomInputs';

const toLocalDateStr = (d) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

const todayStr = () => toLocalDateStr(new Date());

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [toLocalDateStr(monday), toLocalDateStr(sunday)];
};

const getMonthRange = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [toLocalDateStr(first), toLocalDateStr(last)];
};

const formatDate = (dateStr) =>
  dateStr ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const formatTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDuration = (start, end, nowMs) => {
  if (!start) return '—';
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : nowMs;
  const totalMin = Math.max(0, Math.floor((endMs - startMs) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
};

export default function Shifts() {
  const [quickFilter, setQuickFilter] = useState('today'); // 'today' | 'custom' | 'week' | 'month'
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [logRows, setLogRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const isLogView = quickFilter === 'week' || quickFilter === 'month';
  const isToday = date === todayStr();

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (quickFilter === 'week' || quickFilter === 'month') {
        const [from, to] = quickFilter === 'week' ? getWeekRange() : getMonthRange();
        setLogRows(await getShiftHistory(`?from=${from}&to=${to}`));
      } else {
        setRows(await getShifts(`?date=${date}`));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [quickFilter, date]);

  const filtered = useMemo(() =>
    rows.filter((r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.position?.toLowerCase().includes(search.toLowerCase())
    ), [rows, search]);

  const filteredLog = useMemo(() =>
    logRows.filter((r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.position?.toLowerCase().includes(search.toLowerCase())
    ), [logRows, search]);

  const handleTimeIn = async (employeeId) => {
    setActingId(employeeId);
    try {
      const res = await timeInEmployee(employeeId);
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Failed to start shift.');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to start shift.');
    } finally {
      setActingId(null);
    }
  };

  const handleTimeOut = async (employeeId) => {
    setActingId(employeeId);
    try {
      const res = await timeOutEmployee(employeeId);
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Failed to end shift.');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to end shift.');
    } finally {
      setActingId(null);
    }
  };

  const quickButton = (key, label) => (
    <button
      onClick={() => { setQuickFilter(key); if (key === 'today') setDate(todayStr()); }}
      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
        quickFilter === key ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Start Shift / End Shift</h1>
        <p className="text-gray-500 mt-1">Record employee time in and time out for their shift, and review past records.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        {quickButton('today', 'Today')}
        {quickButton('week', 'This Week')}
        {quickButton('month', 'This Month')}
        <div className="ml-auto">
          <CustomDatePicker label="Specific Day" value={date} onChange={(v) => { setDate(v); setQuickFilter('custom'); }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Search</label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Name, ID, or position..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : isLogView ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Full Name</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Position</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Time In</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Time Out</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLog.map((r) => (
                  <tr key={`${r.employee_id}-${r.shift_date}`} className="hover:bg-emerald-50/30">
                    <td className="p-5 text-sm font-semibold text-gray-700">{formatDate(r.shift_date)}</td>
                    <td className="p-5 font-bold text-gray-900">{r.name}</td>
                    <td className="p-5 text-sm text-gray-600">{r.position}</td>
                    <td className="p-5 text-sm text-gray-700">{formatTime(r.time_in)}</td>
                    <td className="p-5 text-sm text-gray-700">
                      {formatTime(r.time_out)}
                      {r.auto_closed && <span className="ml-1.5 text-[10px] font-bold text-amber-600">(auto 6PM)</span>}
                    </td>
                    <td className="p-5 text-sm font-mono text-gray-600">{formatDuration(r.time_in, r.time_out, nowMs)}</td>
                  </tr>
                ))}
                {filteredLog.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-sm text-gray-400">No shift records for this period.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">ID</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Full Name</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Position</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Account</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Time In</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Time Out</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Duration</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.employee_id} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-mono text-xs font-bold text-gray-600">{r.id_number || '—'}</td>
                    <td className="p-5 font-bold text-gray-900">{r.name}</td>
                    <td className="p-5 text-sm text-gray-600">{r.position}</td>
                    <td className="p-5">
                      {r.has_account ? (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${r.account_role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-green-100 text-green-700'}`}>
                          {r.account_role.charAt(0).toUpperCase() + r.account_role.slice(1)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500">No Account</span>
                      )}
                    </td>
                    <td className="p-5 text-sm text-gray-700">{formatTime(r.time_in)}</td>
                    <td className="p-5 text-sm text-gray-700">
                      {formatTime(r.time_out)}
                      {r.auto_closed && <span className="ml-1.5 text-[10px] font-bold text-amber-600">(auto 6PM)</span>}
                    </td>
                    <td className="p-5 text-sm font-mono text-gray-600">{formatDuration(r.time_in, r.time_out, nowMs)}</td>
                    <td className="p-5 text-right">
                      {!isToday ? (
                        <span className="text-xs text-gray-400">Past date</span>
                      ) : !r.time_in ? (
                        <Button onClick={() => handleTimeIn(r.employee_id)} disabled={actingId === r.employee_id} size="sm" className="bg-emerald-700 hover:bg-emerald-800 rounded-lg">
                          {actingId === r.employee_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogIn className="h-4 w-4 mr-1" />} Start Shift
                        </Button>
                      ) : !r.time_out ? (
                        <Button onClick={() => handleTimeOut(r.employee_id)} disabled={actingId === r.employee_id} size="sm" className="bg-red-600 hover:bg-red-700 rounded-lg">
                          {actingId === r.employee_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />} Done Shift
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          <Clock className="h-3 w-3" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-12 text-center text-sm text-gray-400">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
