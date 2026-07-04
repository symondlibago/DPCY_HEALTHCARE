import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Edit2, Trash2, X, Search, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getServices, createService, updateService, deleteService } from '../utils/auth';
import { SearchableSelect } from './CustomInputs';

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORIES = ['Laboratory', 'Imaging', 'Diagnostics', 'Drug Testing', 'Clearance', 'Other'];

const emptyForm = () => ({ id: null, name: '', price: '', category: '', is_active: true });

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setServices(await getServices());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase())),
    [services, search]
  );

  const openAdd = () => { setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (s) => { setForm({ id: s.id, name: s.name, price: s.price, category: s.category || '', is_active: !!s.is_active }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Please enter a service name.');
    if (form.price === '' || Number(form.price) < 0) return alert('Please enter a valid price.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category || null,
        is_active: form.is_active,
      };
      if (form.id) await updateService(form.id, payload);
      else await createService(payload);
      setModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service? Past receipts are not affected.')) return;
    await deleteService(id);
    fetchData();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Services</h1>
          <p className="text-gray-500 mt-1">Manage the offered services and their fees.</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-700 hover:bg-emerald-800 h-12 rounded-xl px-6"><Plus className="mr-2" /> Add Service</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Search service or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Service</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Category</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Price</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-bold text-gray-900 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-emerald-300" />{s.name}</td>
                    <td className="p-5 text-sm text-gray-600">{s.category || '—'}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-5 text-right font-bold text-emerald-700">{peso(s.price)}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(s)} variant="ghost" size="sm" className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(s.id)} variant="ghost" size="sm" className="text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-sm text-gray-400">No services found.</td></tr>
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
                <h3 className="font-bold text-gray-900">{form.id ? 'Edit Service' : 'Add Service'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Service Name *</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="e.g. Chest X-ray" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Price *</label>
                    <input type="number" min="0" step="0.01" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Category</label>
                    <SearchableSelect
                      options={[{ label: '— Select —', value: '' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]}
                      value={form.category}
                      onChange={(v) => setForm({ ...form, category: v })}
                      placeholder="— Select —"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input type="checkbox" className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  <span className="text-sm text-gray-700 whitespace-nowrap">Active (available for new receipts)</span>
                </label>
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
