import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Search, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/auth';
import { CustomDatePicker } from './CustomInputs';

const emptyForm = () => ({
  id: null, id_number: '', name: '', position: '', sex: '', age: '',
  birthday: '', phone_number: '', email: '', address: '', date_hired: '',
  status: 'Active', notes: ''
});

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setEmployees(await getEmployees());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    employees.filter((e) => {
      const matchSearch =
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.id_number?.toLowerCase().includes(search.toLowerCase()) ||
        e.position?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || e.status === filterStatus;
      return matchSearch && matchStatus;
    }), [employees, search, filterStatus]);

  const openAdd = () => { setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (e) => {
    setForm({
      id: e.id, id_number: e.id_number || '', name: e.name || '', position: e.position || '',
      sex: e.sex || '', age: e.age || '', birthday: e.birthday?.split('T')[0] || '',
      phone_number: e.phone_number || '', email: e.email || '', address: e.address || '',
      date_hired: e.date_hired?.split('T')[0] || '', status: e.status || 'Active', notes: e.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Please enter the employee name.');
    if (!form.position.trim()) return alert('Please enter the position.');
    setSaving(true);
    try {
      const payload = {
        id_number: form.id_number || null,
        name: form.name.trim(),
        position: form.position.trim(),
        sex: form.sex || null,
        age: form.age ? Number(form.age) : null,
        birthday: form.birthday || null,
        phone_number: form.phone_number || null,
        email: form.email || null,
        address: form.address || null,
        date_hired: form.date_hired || null,
        status: form.status,
        notes: form.notes || null,
      };
      if (form.id) await updateEmployee(form.id, payload);
      else await createEmployee(payload);
      setModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    await deleteEmployee(id);
    fetchData();
  };

  const field = (label, key, props = {}) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">{label}</label>
      <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employees</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage staff records.</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-700 hover:bg-indigo-800 h-12 rounded-xl px-6"><Plus className="mr-2" /> Add Employee</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Name, ID, or position..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Status</label>
          <select className="px-3 py-2.5 w-full border border-gray-300 rounded-xl text-sm bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-700" /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">ID</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Full Name</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Position</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Contact</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-indigo-50/30">
                    <td className="p-5 font-mono text-xs font-bold text-gray-600">{e.id_number || '—'}</td>
                    <td className="p-5 font-bold text-gray-900">{e.name}</td>
                    <td className="p-5 text-sm text-gray-600">{e.position}</td>
                    <td className="p-5 text-sm text-gray-600">{e.phone_number || e.email || '—'}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{e.status}</span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openEdit(e)} variant="ghost" size="sm" className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(e.id)} variant="ghost" size="sm" className="text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
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

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h3 className="font-bold text-gray-900">{form.id ? 'Edit Employee' : 'Add Employee'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('ID Number', 'id_number', { placeholder: 'e.g. EMP-001' })}
                {field('Full Name *', 'name', { placeholder: 'Full name' })}
                {field('Position *', 'position', { placeholder: 'e.g. Medical Technologist' })}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Sex</label>
                  <select className="px-3 py-2.5 w-full border border-gray-300 rounded-xl text-sm bg-white" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                    <option value="">—</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                {field('Age', 'age', { type: 'number', min: 0, placeholder: 'Age' })}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Birthday</label>
                  <CustomDatePicker value={form.birthday} onChange={(v) => setForm({ ...form, birthday: v })} />
                </div>
                {field('Phone Number', 'phone_number', { placeholder: 'Contact number' })}
                {field('Email', 'email', { type: 'email', placeholder: 'email@example.com' })}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Date Hired</label>
                  <CustomDatePicker value={form.date_hired} onChange={(v) => setForm({ ...form, date_hired: v })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Status</label>
                  <select className="px-3 py-2.5 w-full border border-gray-300 rounded-xl text-sm bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option><option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">{field('Address', 'address', { placeholder: 'Home address' })}</div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Notes</label>
                  <textarea rows={2} className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="p-5 border-t flex gap-2 sticky bottom-0 bg-white">
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
