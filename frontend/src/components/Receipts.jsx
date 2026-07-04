import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Search, Loader2, Receipt as ReceiptIcon, Printer, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getServices, createTransaction, getUser } from '../utils/auth';
import { CustomDatePicker } from './CustomInputs';
import { generateReceiptPDF } from './ReceiptPDF';

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayStr = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};

export default function Receipts() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Patient (per-visit)
  const [patient, setPatient] = useState({ name: '', age: '', sex: '', address: '' });
  const [txDate, setTxDate] = useState(todayStr());

  // Cart: { service_id, name, price, qty }
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [tendered, setTendered] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setServices(await getServices(true));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredServices = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search]
  );

  const addService = (svc) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.service_id === svc.id);
      if (existing) {
        return prev.map((i) => (i.service_id === svc.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { service_id: svc.id, name: svc.name, price: Number(svc.price), qty: 1 }];
    });
  };

  const updateItem = (idx, patch) =>
    setItems((prev) => prev.map((i, x) => (x === idx ? { ...i, ...patch } : i)));

  const removeItem = (idx) => setItems((prev) => prev.filter((_, x) => x !== idx));

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0),
    [items]
  );
  const total = Math.max(subtotal - Number(discount || 0), 0);
  const change = tendered ? Math.max(Number(tendered) - total, 0) : 0;

  const resetForm = () => {
    setPatient({ name: '', age: '', sex: '', address: '' });
    setItems([]);
    setDiscount('');
    setTendered('');
    setPaymentMethod('Cash');
    setTxDate(todayStr());
  };

  const handleSave = async (printAfter) => {
    if (!patient.name.trim()) return alert('Please enter the patient name.');
    if (items.length === 0) return alert('Please add at least one service.');

    setSaving(true);
    try {
      const user = getUser();
      const payload = {
        patient_name: patient.name.trim(),
        age: patient.age ? Number(patient.age) : null,
        sex: patient.sex || null,
        address: patient.address || null,
        transaction_date: txDate,
        items: items.map((i) => ({
          service_id: i.service_id,
          name: i.name,
          price: Number(i.price),
          qty: Number(i.qty),
        })),
        discount: Number(discount || 0),
        amount_tendered: tendered ? Number(tendered) : null,
        payment_method: paymentMethod,
        cashier: user?.name || null,
      };

      const res = await createTransaction(payload);
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save transaction.');
        return;
      }
      setLastSaved(data.data);
      generateReceiptPDF(data.data, { autoPrint: printAfter });
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const sexOptions = ['Male', 'Female'];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">New Receipt</h1>
          <p className="text-gray-500 mt-1">Register a patient, select services, and issue an official receipt.</p>
        </div>
      </div>

      {lastSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Receipt <span className="font-bold">{lastSaved.receipt_no}</span> saved successfully.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => generateReceiptPDF(lastSaved, { autoPrint: true })} size="sm" variant="ghost" className="text-green-700 bg-green-100 hover:bg-green-200 rounded-lg">
              <Printer className="h-4 w-4 mr-1" /> Reprint
            </Button>
            <button onClick={() => setLastSaved(null)} className="text-green-600 hover:text-green-800"><X className="h-4 w-4" /></button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Patient + Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient info */}
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Patient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Full Name *</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Patient name" value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Age</label>
                  <input type="number" min="0" className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Age" value={patient.age} onChange={(e) => setPatient({ ...patient, age: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Sex</label>
                  <div className="flex gap-2">
                    {sexOptions.map((s) => (
                      <button key={s} onClick={() => setPatient({ ...patient, sex: patient.sex === s ? '' : s })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${patient.sex === s ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Address</label>
                  <input className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm" placeholder="Address" value={patient.address} onChange={(e) => setPatient({ ...patient, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Date</label>
                  <CustomDatePicker value={txDate} onChange={setTxDate} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services picker */}
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Services Offered</h2>
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-xl text-sm" placeholder="Search service..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredServices.map((svc) => (
                    <button key={svc.id} onClick={() => addService(svc)}
                      className="text-left p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition group">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800 leading-snug">{svc.name}</span>
                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 shrink-0" />
                      </div>
                      <span className="text-xs font-bold text-emerald-700">{peso(svc.price)}</span>
                    </button>
                  ))}
                  {filteredServices.length === 0 && (
                    <p className="col-span-full text-center text-sm text-gray-400 py-6">No services found. Add services in the Services page.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Cart / receipt summary */}
        <div>
          <Card className="border-none shadow-xl rounded-2xl sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4 text-emerald-700" /> Receipt
              </h2>

              {items.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No services selected yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{it.name}</span>
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateItem(idx, { qty: Math.max(1, it.qty - 1) })} className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100"><Minus className="h-3 w-3" /></button>
                          <input type="number" min="1" value={it.qty} onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-10 text-center text-sm border border-gray-200 rounded py-1" />
                          <button onClick={() => updateItem(idx, { qty: it.qty + 1 })} className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100"><Plus className="h-3 w-3" /></button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">₱</span>
                          <input type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })} className="w-20 text-right text-sm border border-gray-200 rounded py-1 px-1" />
                        </div>
                      </div>
                      <div className="text-right text-xs font-bold text-gray-600 mt-1">{peso(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span className="font-semibold">{peso(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">₱</span>
                    <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-20 text-right text-sm border border-gray-200 rounded py-1 px-1" placeholder="0.00" />
                  </div>
                </div>
                <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-1">
                  <span>Total</span><span className="text-emerald-700">{peso(total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Tendered</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">₱</span>
                    <input type="number" min="0" step="0.01" value={tendered} onChange={(e) => setTendered(e.target.value)} className="w-20 text-right text-sm border border-gray-200 rounded py-1 px-1" placeholder="0.00" />
                  </div>
                </div>
                {tendered && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Change</span><span className="font-semibold">{peso(change)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={() => handleSave(true)} disabled={saving} className="w-full bg-emerald-700 hover:bg-emerald-800 h-11 rounded-xl">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
                  Save &amp; Print Receipt
                </Button>
                <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="w-full h-10 rounded-xl">
                  Save without printing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
