import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Edit2, Trash2, X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../utils/auth';
import { CustomDatePicker } from './CustomInputs';

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

const CATEGORIES = ['Supplies', 'Utilities', 'Salaries', 'Rent', 'Maintenance', 'Reagents', 'Miscellaneous'];

const emptyForm = () => ({ id: null, expense_date: todayStr(), category: '', description: '', amount: '', notes: '' });

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setExpenses(await getExpenses(`?date=${date}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [date]);

  const dayTotal = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);

  const openAdd = () => { setForm({ ...emptyForm(), expense_date: date }); setModalOpen(true); };
  const openEdit = (e) => {
    setForm({ id: e.id, expense_date: e.expense_date?.split('T')[0] || todayStr(), category: e.category || '', description: e.description, amount: e.amount, notes: e.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) return alert('Please enter a description.');
    if (!form.amount || Number(form.amount) <= 0) return alert('Please enter a valid amount.');
    setSaving(true);
    try {
      const payload = {
        expense_date: form.expense_date,
        category: form.category || null,
        description: form.description.trim(),
        amount: Number(form.amount),
        notes: form.notes || null,
      };
      if (form.id) await updateExpense(form.id, payload);
      else await createExpense(payload);
      setModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteExpense(id);
    fetchData();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Daily Expenses</h1>
          <p className="text-gray-500 mt-1">Record and monitor the center's expenses per day.</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-700 hover:bg-indigo-800 h-12 rounded-xl px-6"><Plus className="mr-2" /> Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Date</label>
          <CustomDatePicker value={date} onChange={setDate} />
        </div>
        <Card className="border-none shadow-lg rounded-2xl md:col-span-2">
          <CardContent className="p-5 flex items-center justify-between h-full">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Total Expenses (selected day)</p>
              <p className="text-2xl font-extrabold text-red-600">{peso(dayTotal)}</p>
            </div>
            <Wallet className="h-8 w-8 text-red-200" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-700" /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Description</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Category</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Notes</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Amount</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-indigo-50/30">
                    <td className="p-5 font-bold text-gray-900">{e.description}</td>
                    <td className="p-5 text-sm text-gray-600">{e.category || '—'}</td>
                    <td className="p-5 text-sm text-gray-500">{e.notes || '—'}</td>
                    <td className="p-5 text-right font-bold text-red-600">{peso(e.amount)}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(e)} variant="ghost" size="sm" className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(e.id)} variant="ghost" size="sm" className="text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-sm text-gray-400">No expenses recorded for this day.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">{form.id ? 'Edit Expense' : 'Add Expense'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Date</label>
                  <CustomDatePicker value={form.expense_date} onChange={(v) => setForm({ ...form, expense_date: v })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Description *</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="e.g. Office supplies" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Category</label>
                    <select className="px-3 py-2.5 w-full border border-gray-300 rounded-xl text-sm bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">— Select —</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Amount *</label>
                    <input type="number" min="0" step="0.01" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Notes</label>
                  <textarea rows={2} className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="p-5 border-t flex gap-2">
                <Button onClick={() => setModalOpen(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-700 hover:bg-indigo-800 rounded-xl">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
