
import React, { useState, useRef } from 'react';
import { UserSettings, Holiday, AppTheme } from '../types';
import { 
  Save, 
  Wallet, 
  Watch, 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  Palette, 
  Palmtree, 
  HeartPulse, 
  Coffee, 
  Briefcase,
  Database,
  FileJson
} from 'lucide-react';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  allData: any;
  onImport: (data: any) => void;
}

const THEMES: { id: AppTheme; label: string; colors: string[] }[] = [
  { id: 'obsidian', label: 'Obsidian Gold', colors: ['#0F0F14', '#D4AF37'] },
  { id: 'midnight', label: 'Blue Steel', colors: ['#0B132B', '#3A86FF'] },
  { id: 'nordic', label: 'Nordic Frost', colors: ['#F5F7FA', '#6C9EFF'] },
];

const SettingsView: React.FC<Props> = ({ settings, onSave, allData, onImport }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });
  const holidayFileInputRef = useRef<HTMLInputElement>(null);
  const systemImportRef = useRef<HTMLInputElement>(null);

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

  const handleExportSystem = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendify_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSystem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm("This will replace all current data. Continue?")) {
          onImport(data);
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setLocalSettings({
      ...localSettings,
      holidays: [...localSettings.holidays, newHoliday]
    });
    setNewHoliday({ date: '', name: '' });
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Database size={18} className="text-emerald-400"/> Data Management
        </h3>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest -mt-2">
          Transfer your staff and attendance to a new device
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleExportSystem}
            className="flex items-center justify-center gap-3 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl border border-emerald-500/20 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Download size={16} /> Export Full Backup
          </button>
          <button 
            onClick={() => systemImportRef.current?.click()}
            className="flex items-center justify-center gap-3 py-4 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/20 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Upload size={16} /> Import Backup File
          </button>
          <input type="file" ref={systemImportRef} className="hidden" accept=".json" onChange={handleImportSystem} />
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-sky-400" size={20} />
            <h3 className="font-bold text-lg text-white">Holiday List</h3>
          </div>
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
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">PL</label>
            <input type="number" value={quotaInputs.PL} onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">SL</label>
            <input type="number" value={quotaInputs.SL} onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CL</label>
            <input type="number" value={quotaInputs.CL} onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Briefcase size={18} className="text-sky-400"/> Default Job Logic
        </h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">System Default Working Cycle (26/30 Days)</label>
          <select 
            value={localSettings.workingDaysPerMonth} 
            onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} 
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 appearance-none transition-all"
          >
            {[26, 27, 28, 29, 30, 31].map(d => (
              <option key={d} value={d}>{d} Days Cycle</option>
            ))}
          </select>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Note: This will be used for all new staff added. Attendance is calculated as (Salary / Working Days).</p>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Palette size={18} className="text-sky-400"/> Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setLocalSettings({...localSettings, theme: t.id})} className={`p-3 rounded-xl border-2 transition-all text-[10px] font-bold ${localSettings.theme === t.id ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-white/5 bg-white/5 text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">
        {showSuccess ? 'Settings Updated!' : 'Update System Configuration'}
      </button>
    </div>
  );
};

export default SettingsView;
