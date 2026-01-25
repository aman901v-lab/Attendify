
import React, { useState, useRef } from 'react';
import { UserSettings, Holiday, AppTheme } from '../types';
import { Save, Wallet, Watch, Calendar as CalendarIcon, Trash2, Plus, Download, Upload, Palette, Palmtree, HeartPulse, Coffee, Briefcase } from 'lucide-react';
import { downloadCSV } from '../utils';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
}

const THEMES: { id: AppTheme; label: string; colors: string[] }[] = [
  { id: 'obsidian', label: 'Obsidian Gold', colors: ['#0F0F14', '#D4AF37'] },
  { id: 'midnight', label: 'Blue Steel', colors: ['#0B132B', '#3A86FF'] },
  { id: 'nordic', label: 'Nordic Frost', colors: ['#F5F7FA', '#6C9EFF'] },
];

const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });
  const holidayFileInputRef = useRef<HTMLInputElement>(null);

  // Using separate local strings for quota inputs to avoid sticky zeros
  const [quotaInputs, setQuotaInputs] = useState({
    PL: settings.quotas.PL.toString(),
    SL: settings.quotas.SL.toString(),
    CL: settings.quotas.CL.toString()
  });

  const handleSave = () => {
    const finalSettings = {
      ...localSettings,
      quotas: {
        PL: Number(quotaInputs.PL) || 0,
        SL: Number(quotaInputs.SL) || 0,
        CL: Number(quotaInputs.CL) || 0
      }
    };
    onSave(finalSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setLocalSettings({
      ...localSettings,
      holidays: [...localSettings.holidays, newHoliday]
    });
    setNewHoliday({ date: '', name: '' });
  };

  const handleImportHolidays = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const imported: Holiday[] = [];
      lines.forEach((line, i) => {
        if (i === 0 || !line.trim()) return;
        const [date, name] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (date && name) imported.push({ date, name });
      });
      setLocalSettings(prev => ({ ...prev, holidays: [...prev.holidays, ...imported] }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-sky-400" size={20} />
            <h3 className="font-bold text-lg text-white">Holiday List (CSV Upload)</h3>
          </div>
          <button 
            onClick={() => holidayFileInputRef.current?.click()} 
            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 text-xs font-bold"
          >
            <Upload size={14} /> Upload CSV
          </button>
          <input type="file" ref={holidayFileInputRef} className="hidden" accept=".csv" onChange={handleImportHolidays} />
        </div>
        
        <div className="flex gap-2 mb-4">
          <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs flex-1 text-white" />
          <input type="text" placeholder="Holiday Name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs flex-1 text-white" />
          <button onClick={addHoliday} className="bg-sky-500 p-2 rounded-xl text-white"><Plus size={18} /></button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {localSettings.holidays.map((h, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-xs">
                <p className="font-bold text-white">{h.name}</p>
                <p className="text-slate-500">{h.date}</p>
              </div>
              <button onClick={() => setLocalSettings({...localSettings, holidays: localSettings.holidays.filter((_, idx) => idx !== i)})} className="text-rose-500"><Trash2 size={14}/></button>
            </div>
          ))}
          {localSettings.holidays.length === 0 && <p className="text-center text-slate-600 text-[10px] py-4 italic">No holidays defined.</p>}
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Palmtree size={18} className="text-emerald-400"/> Default Leave Quotas
        </h3>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest -mt-2">
          Values used as defaults for new staff members
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Palmtree size={10} className="text-emerald-400" /> PL (Paid)
            </label>
            <input 
              type="number" 
              value={quotaInputs.PL} 
              onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} 
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <HeartPulse size={10} className="text-rose-400" /> SL (Sick)
            </label>
            <input 
              type="number" 
              value={quotaInputs.SL} 
              onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} 
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Coffee size={10} className="text-purple-400" /> CL (Casual)
            </label>
            <input 
              type="number" 
              value={quotaInputs.CL} 
              onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} 
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500" 
            />
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Briefcase size={18} className="text-sky-400"/> Default Job Logic
        </h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Default Working Days/Month</label>
          <select 
            value={localSettings.workingDaysPerMonth} 
            onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} 
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 appearance-none transition-all"
          >
            {[26, 27, 28, 29, 30, 31].map(d => (
              <option key={d} value={d}>{d} Days Cycle</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Palette size={18} className="text-sky-400"/> Theme & System</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setLocalSettings({...localSettings, theme: t.id})} className={`p-3 rounded-xl border-2 transition-all text-[10px] font-bold ${localSettings.theme === t.id ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-white/5 bg-white/5 text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all">
        {showSuccess ? 'Settings Saved!' : 'Save All Changes'}
      </button>
    </div>
  );
};

export default SettingsView;
