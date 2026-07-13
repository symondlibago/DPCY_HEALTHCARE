import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Printer, Trash2, Eye, X, ClipboardList, TrendingUp, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getTransactions, deleteTransaction } from '../utils/auth';
import { CustomDatePicker } from './CustomInputs';
import { generateReceiptPDF } from './ReceiptPDF';
import { downloadTransactionExcel, downloadTransactionsExcel } from '../utils/excel';

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [search, setSearch] = useState('');
  const [viewTx, setViewTx] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Guard against an inverted range (from later than to)
      const from = fromDate <= toDate ? fromDate : toDate;
      const to = fromDate <= toDate ? toDate : fromDate;
      setTransactions(await getTransactions(`?from=${from}&to=${to}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [fromDate, toDate]);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
          t.receipt_no?.toLowerCase().includes(search.toLowerCase())
      ),
    [transactions, search]
  );

  const dayTotal = useMemo(() => filtered.reduce((s, t) => s + Number(t.total || 0), 0), [filtered]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    await deleteTransaction(id);
    fetchData();
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Transaction History</h1>
          <p className="text-gray-500 mt-1">Daily record of completed services and issued receipts.</p>
        </div>
        <Button
          onClick={() => downloadTransactionsExcel(filtered, `Transactions_${fromDate}_to_${toDate}`)}
          disabled={filtered.length === 0}
          className="bg-emerald-700 hover:bg-emerald-800 h-12 rounded-xl px-6"
        >
          <Download className="h-4 w-4 mr-2" /> Export to Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Transactions</p>
              <p className="text-2xl font-extrabold text-gray-900">{filtered.length}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-emerald-200" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg rounded-2xl md:col-span-2">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Total Revenue (selected range)</p>
              <p className="text-2xl font-extrabold text-emerald-700">{peso(dayTotal)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-200" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">From</label>
          <CustomDatePicker value={fromDate} onChange={setFromDate} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">To</label>
          <CustomDatePicker value={toDate} onChange={setToDate} align="right" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Patient name or receipt no..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[720px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Receipt No</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Patient</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Services</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Total</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-mono text-xs font-bold text-gray-600">{t.receipt_no}</td>
                    <td className="p-5 text-sm text-gray-600 whitespace-nowrap">{new Date(t.transaction_date).toLocaleDateString('en-PH')}</td>
                    <td className="p-5 font-bold text-gray-900">{t.patient_name}</td>
                    <td className="p-5 text-sm text-gray-600">{(t.items || []).map((i) => i.name).join(', ')}</td>
                    <td className="p-5 text-right font-bold text-emerald-700">{peso(t.total)}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setViewTx(t)} variant="ghost" size="sm" className="text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg" title="View"><Eye className="h-4 w-4" /></Button>
                        <Button onClick={() => generateReceiptPDF(t, { autoPrint: true })} variant="ghost" size="sm" className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg" title="Print receipt"><Printer className="h-4 w-4" /></Button>
                        <Button onClick={() => downloadTransactionExcel(t)} variant="ghost" size="sm" className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg" title="Download Excel"><FileSpreadsheet className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(t.id)} variant="ghost" size="sm" className="text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-sm text-gray-400">No transactions for this range.</td></tr>
                )}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <AnimatePresence>
        {viewTx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewTx(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">{viewTx.receipt_no}</h3>
                <button onClick={() => setViewTx(null)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[11px] text-gray-400 uppercase font-bold">Patient</p><p className="font-semibold">{viewTx.patient_name}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-bold">Date</p><p className="font-semibold">{new Date(viewTx.transaction_date).toLocaleDateString('en-PH')}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-bold">Age / Sex</p><p className="font-semibold">{viewTx.age || '—'} / {viewTx.sex || '—'}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-bold">Payment</p><p className="font-semibold">{viewTx.payment_method}</p></div>
                  {viewTx.birthdate && <div><p className="text-[11px] text-gray-400 uppercase font-bold">Birthdate</p><p className="font-semibold">{viewTx.birthdate}</p></div>}
                </div>
                {viewTx.address && <div><p className="text-[11px] text-gray-400 uppercase font-bold">Address</p><p className="font-semibold">{viewTx.address}</p></div>}
                <div className="border-t pt-3 space-y-1">
                  {(viewTx.items || []).map((i, x) => (
                    <div key={x} className="flex justify-between">
                      <span className="text-gray-600">{i.name} × {i.qty}</span>
                      <span className="font-semibold">{peso(i.subtotal ?? i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{peso(viewTx.subtotal)}</span></div>
                  {Number(viewTx.discount) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{viewTx.discount_type && viewTx.discount_type !== 'Regular' ? `${viewTx.discount_type} Discount (${Number(viewTx.discount_percent) || 20}%)` : 'Discount'}</span>
                      <span>-{peso(viewTx.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-gray-900 text-lg"><span>Total</span><span className="text-emerald-700">{peso(viewTx.total)}</span></div>
                </div>
              </div>
              <div className="p-5 border-t flex gap-2">
                <Button onClick={() => generateReceiptPDF(viewTx, { autoPrint: true })} className="flex-1 bg-emerald-700 hover:bg-emerald-800 rounded-xl"><Printer className="h-4 w-4 mr-2" /> Print Receipt</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
