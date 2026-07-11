import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Edit2, Trash2, X, Search, HeartHandshake, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import {
  getDiscountEnrollees,
  createDiscountEnrollee,
  updateDiscountEnrollee,
  deleteDiscountEnrollee,
} from '../utils/auth';
import { SearchableSelect } from './CustomInputs';

const DISCOUNT_TYPES = ['PWD', 'Senior', 'Yakap Member'];

const emptyForm = () => ({
  id: null, patient_name: '', age: '', sex: '', address: '', discount_type: 'PWD', notes: '',
});

const typeBadgeClass = (type) => {
  switch (type) {
    case 'PWD': return 'bg-blue-100 text-blue-700';
    case 'Senior': return 'bg-amber-100 text-amber-700';
    case 'Yakap Member': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function DiscountEnrollees() {
  const [enrollees, setEnrollees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setEnrollees(await getDiscountEnrollees());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(
    () => enrollees.filter((e) =>
      e.patient_name.toLowerCase().includes(search.toLowerCase()) &&
      (typeFilter ? e.discount_type === typeFilter : true)
    ),
    [enrollees, search, typeFilter]
  );

  const openAdd = () => { setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (e) => {
    setForm({
      id: e.id, patient_name: e.patient_name, age: e.age ?? '', sex: e.sex || '',
      address: e.address || '', discount_type: e.discount_type, notes: e.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.patient_name.trim()) return alert('Please enter the patient name.');
    if (!form.discount_type) return alert('Please select a discount type.');
    setSaving(true);
    try {
      const payload = {
        patient_name: form.patient_name.trim(),
        age: form.age === '' ? null : Number(form.age),
        sex: form.sex || null,
        address: form.address || null,
        discount_type: form.discount_type,
        notes: form.notes || null,
      };
      if (form.id) await updateDiscountEnrollee(form.id, payload);
      else await createDiscountEnrollee(payload);
      setModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save discount enrollee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this discount enrollee record?')) return;
    await deleteDiscountEnrollee(id);
    fetchData();
  };

  const counts = useMemo(() => {
    const c = { PWD: 0, Senior: 0, 'Yakap Member': 0 };
    enrollees.forEach((e) => { if (c[e.discount_type] !== undefined) c[e.discount_type] += 1; });
    return c;
  }, [enrollees]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Discount Enrollees</h1>
          <p className="text-gray-500 mt-1">PWD, Senior Citizen &amp; Yakap Member registry — auto-added from receipts.</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-700 hover:bg-emerald-800 h-12 rounded-xl px-6"><Plus className="mr-2" /> Add Enrollee</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DISCOUNT_TYPES.map((t) => (
          <Card key={t} className="border-none shadow-md rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t}</p>
                <p className="text-2xl font-bold text-gray-900">{counts[t]}</p>
              </div>
              <HeartHandshake className="h-7 w-7 text-emerald-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Search patient name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-56">
          <SearchableSelect
            options={[{ label: 'All Types', value: '' }, ...DISCOUNT_TYPES.map((t) => ({ label: t, value: t }))]}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
          />
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[820px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Patient</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Type</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Age / Sex</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Source Receipt</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-bold text-gray-900 flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-emerald-300" />{e.patient_name}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${typeBadgeClass(e.discount_type)}`}>{e.discount_type}</span>
                    </td>
                    <td className="p-5 text-sm text-gray-600">{[e.age, e.sex].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="p-5 text-sm text-gray-600">
                      {e.receipt_no ? (
                        <span className="inline-flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-gray-400" />{e.receipt_no}</span>
                      ) : (
                        <span className="text-gray-400">Manual entry</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(e)} variant="ghost" size="sm" className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(e.id)} variant="ghost" size="sm" className="text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-sm text-gray-400">No discount enrollees found.</td></tr>
                )}
              </tbody>
            </table></div>
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
                <h3 className="font-bold text-gray-900">{form.id ? 'Edit Discount Enrollee' : 'Add Discount Enrollee'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Patient Name *</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="e.g. Juan Dela Cruz" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Discount Type *</label>
                  <SearchableSelect
                    options={DISCOUNT_TYPES.map((t) => ({ label: t, value: t }))}
                    value={form.discount_type}
                    onChange={(v) => setForm({ ...form, discount_type: v })}
                    placeholder="Select type"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Age</label>
                    <input type="number" min="0" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Sex</label>
                    <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Address</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Notes</label>
                  <textarea className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="p-5 border-t flex gap-2">
                <Button onClick={() => setModalOpen(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-700 hover:bg-emerald-800 rounded-xl">
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
