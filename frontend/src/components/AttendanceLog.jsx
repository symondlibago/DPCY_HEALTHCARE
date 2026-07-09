import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, UserCheck, UserX, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getAttendance, getAttendanceHistory, markAttendance } from '../utils/auth';
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

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
    status === 'present' ? 'bg-emerald-100 text-emerald-700'
      : status === 'absent' ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500'
  }`}>
    {status === 'present' ? <UserCheck className="h-3 w-3" /> : status === 'absent' ? <UserX className="h-3 w-3" /> : <MinusCircle className="h-3 w-3" />}
    {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not Marked'}
  </span>
);

export default function AttendanceLog() {
  const [quickFilter, setQuickFilter] = useState('today'); // 'today' | 'custom' | 'week' | 'month'
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [logRows, setLogRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);

  const isLogView = quickFilter === 'week' || quickFilter === 'month';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (quickFilter === 'week' || quickFilter === 'month') {
        const [from, to] = quickFilter === 'week' ? getWeekRange() : getMonthRange();
        setLogRows(await getAttendanceHistory(`?from=${from}&to=${to}`));
      } else {
        setRows(await getAttendance(`?date=${date}`));
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

  const handleMark = async (employeeId, status) => {
    setActingId(employeeId);
    try {
      const res = await markAttendance(employeeId, { attendance_date: date, status });
      const data = await res.json();
      if (!data.success) return alert(data.message || 'Failed to update attendance.');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update attendance.');
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
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Attendance Log</h1>
        <p className="text-gray-500 mt-1">Mark employee attendance as present or absent for any date, and review past records.</p>
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
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLog.map((r) => (
                  <tr key={`${r.employee_id}-${r.attendance_date}`} className="hover:bg-emerald-50/30">
                    <td className="p-5 text-sm font-semibold text-gray-700">{formatDate(r.attendance_date)}</td>
                    <td className="p-5 font-bold text-gray-900">{r.name}</td>
                    <td className="p-5 text-sm text-gray-600">{r.position}</td>
                    <td className="p-5"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {filteredLog.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-sm text-gray-400">No attendance records for this period.</td></tr>
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
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Status</th>
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
                    <td className="p-5"><StatusBadge status={r.status} /></td>
                    <td className="p-5 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => handleMark(r.employee_id, r.status === 'present' ? 'not_marked' : 'present')}
                          disabled={actingId === r.employee_id}
                          size="sm"
                          className={`rounded-lg ${r.status === 'present' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'}`}
                        >
                          {actingId === r.employee_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />} Present
                        </Button>
                        <Button
                          onClick={() => handleMark(r.employee_id, r.status === 'absent' ? 'not_marked' : 'absent')}
                          disabled={actingId === r.employee_id}
                          size="sm"
                          className={`rounded-lg ${r.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                        >
                          {actingId === r.employee_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserX className="h-4 w-4 mr-1" />} Absent
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-sm text-gray-400">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
