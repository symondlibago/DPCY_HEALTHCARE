import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download, BarChart3, Calendar, TrendingUp, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getSalesReport } from '../utils/auth';
import { downloadSalesReportExcel } from '../utils/excel';
import { SearchableSelect } from './CustomInputs';

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PERIODS = [
  { key: 'daily', label: 'Daily', icon: CalendarDays },
  { key: 'weekly', label: 'Weekly', icon: CalendarRange },
  { key: 'monthly', label: 'Monthly', icon: Calendar },
  { key: 'yearly', label: 'Yearly', icon: BarChart3 },
];

const now = new Date();

export default function SalesReport() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesReport(`?period=${period}&year=${year}&month=${month}`);
      if (res.success) setData(res);
    } finally {
      setLoading(false);
    }
  }, [period, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const years = data?.years?.length ? data.years : [now.getFullYear()];

  const cards = [
    { title: 'Today', value: data?.cards?.today, icon: CalendarDays },
    { title: 'This Week', value: data?.cards?.week, icon: CalendarRange },
    { title: 'This Month', value: data?.cards?.month, icon: Calendar },
    { title: 'This Year', value: data?.cards?.year, icon: TrendingUp },
  ];

  const rows = data?.rows || [];

  const periodTitle = PERIODS.find((p) => p.key === period)?.label || 'Sales';
  const handleExport = () => {
    if (!rows.length) return;
    const scope = period === 'yearly' ? 'All Years' : period === 'daily' ? `${MONTHS[month - 1]} ${year}` : `${year}`;
    downloadSalesReportExcel(rows, {
      title: `${periodTitle} (${scope})`,
      filename: `Sales_${periodTitle}_${period === 'daily' ? MONTHS[month - 1] + '_' : ''}${period === 'yearly' ? 'AllYears' : year}`,
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Sales Report</h1>
          <p className="text-gray-500 mt-1">Overall sales — daily, weekly, monthly, and yearly.</p>
        </div>
        <Button onClick={handleExport} disabled={!rows.length} className="bg-emerald-700 hover:bg-emerald-800 h-12 rounded-xl px-6">
          <Download className="h-4 w-4 mr-2" /> Export Excel
        </Button>
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-none shadow-lg rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase">{c.title}</p>
                    <p className="text-2xl font-extrabold text-emerald-700">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : peso(c.value)}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-emerald-200" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Period controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {PERIODS.map((p) => {
            const Icon = p.icon;
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon className="h-4 w-4" /> {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {period === 'daily' && (
            <div className="w-40">
              <SearchableSelect
                options={MONTHS.map((m, idx) => ({ label: m, value: idx + 1 }))}
                value={month}
                onChange={(v) => setMonth(Number(v))}
                placeholder="Month"
              />
            </div>
          )}
          {period !== 'yearly' && (
            <div className="w-32">
              <SearchableSelect
                options={years.map((y) => ({ label: String(y), value: y }))}
                value={year}
                onChange={(v) => setYear(Number(v))}
                placeholder="Year"
              />
            </div>
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Period</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Transactions</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-bold text-gray-900">{r.label}</td>
                    <td className="p-5 text-right text-sm text-gray-600">{r.count}</td>
                    <td className="p-5 text-right font-bold text-emerald-700">{peso(r.total)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="p-12 text-center text-sm text-gray-400">No sales in this period.</td></tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="p-5 font-extrabold text-gray-900 uppercase text-xs">Total</td>
                    <td className="p-5 text-right font-bold text-gray-700">{data?.count}</td>
                    <td className="p-5 text-right font-extrabold text-emerald-700 text-lg">{peso(data?.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
