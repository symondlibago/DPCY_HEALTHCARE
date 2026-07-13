import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { getYakapSettings, updateYakapSettings, readResponse, formatErrors } from 'src/utils/auth';

export default function YakapEnrollees() {
  const [count, setCount] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getYakapSettings();
      setCount(String(data.manual_count ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await updateYakapSettings({ manual_count: count === '' ? 0 : Number(count) });
      const result = await readResponse(res);
      if (!result.ok) {
        alert(formatErrors(result.errors, result.message || 'Failed to save Yakap enrollee count.'));
        return;
      }
      setCount(String(result.data.manual_count));
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert('Failed to save Yakap enrollee count.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Yakap Enrollees</h1>
        <p className="text-gray-500 mt-1">Manually set the total number of Yakap enrollees. This total is reflected on the Dashboard Overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-md rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Yakap Enrollees</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (Number(count) || 0)}</p>
            </div>
            <ShieldCheck className="h-7 w-7 text-emerald-300" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Set Yakap Enrollee Count</h2>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-emerald-700" /></div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="space-y-1.5 max-w-xs">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Number of Yakap Enrollees</label>
                <input
                  type="number"
                  min="0"
                  className="px-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm"
                  placeholder="0"
                  value={count}
                  onChange={(e) => { setCount(e.target.value); setSaved(false); }}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 h-11 rounded-xl px-6">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              {saved && <p className="text-sm text-emerald-700 font-medium">Saved.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
