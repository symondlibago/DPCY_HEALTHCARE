import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, KeyRound, X, Lock, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getUsers, resetUserPassword, changeOwnPassword, getUser } from '../utils/auth';

const emptyPasswordForm = () => ({ password: '', password_confirmation: '' });
const emptySelfForm = () => ({ current_password: '', password: '', password_confirmation: '' });

function SuperAdminSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [form, setForm] = useState(emptyPasswordForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    ), [users, search]);

  const openReset = (user) => {
    setModalUser(user);
    setForm(emptyPasswordForm());
    setError('');
  };

  const closeModal = () => {
    setModalUser(null);
    setForm(emptyPasswordForm());
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.password_confirmation) return setError('Passwords do not match.');

    setSaving(true);
    try {
      const res = await resetUserPassword(modalUser.id, form);
      const data = await res.json();
      if (!data.success) {
        setError(data.errors?.password?.[0] || data.message || 'Failed to update password.');
        return;
      }
      closeModal();
    } catch (e) {
      console.error(e);
      setError('Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage user accounts and reset passwords.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Name</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Email</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase">Role</th>
                  <th className="p-5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-emerald-50/30">
                    <td className="p-5 font-bold text-gray-900">{u.name}</td>
                    <td className="p-5 text-sm text-gray-600">{u.email}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <Button onClick={() => openReset(u)} size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg shadow-sm">
                        <KeyRound className="h-4 w-4 mr-1.5" /> Reset Password
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-sm text-gray-400">No users found.</td></tr>
                )}
              </tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {modalUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">Reset Password — {modalUser.name}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">New Password</label>
                  <input type="password" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                  <input type="password" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Re-enter password" />
                </div>
              </div>
              <div className="p-5 border-t flex gap-2">
                <Button onClick={closeModal} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
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

function SelfServiceSettings({ user }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(emptySelfForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!form.current_password) return setError('Please enter your current password.');
    if (form.password.length < 8) return setError('New password must be at least 8 characters.');
    if (form.password !== form.password_confirmation) return setError('New passwords do not match.');

    setSaving(true);
    try {
      const res = await changeOwnPassword(form);
      const data = await res.json();
      if (!data.success) {
        setError(data.errors?.password?.[0] || data.message || 'Failed to update password.');
        return;
      }
      setSuccess('Password updated successfully.');
      setForm(emptySelfForm());
    } catch (e) {
      console.error(e);
      setError('Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account.</p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
            <Lock className="h-4 w-4 text-emerald-700" />
          </div>
          <span className="font-bold text-gray-900">Password and Security</span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-center overflow-hidden"
          >
            <Card className="border-none shadow-xl rounded-2xl w-full max-w-md mt-2">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Signed in as <span className="font-bold text-gray-900">{user?.name}</span> ({user?.email})
                </p>

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Current Password</label>
                  <input type="password" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} placeholder="Your current password" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">New Password</label>
                  <input type="password" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Confirm New Password</label>
                  <input type="password" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Re-enter new password" />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-xl">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Update Password
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const user = getUser();
  return user?.role === 'super_admin' ? <SuperAdminSettings /> : <SelfServiceSettings user={user} />;
}
