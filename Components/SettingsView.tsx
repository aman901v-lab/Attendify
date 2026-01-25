
import React, { useState, useRef } from 'react';
import { UserSettings, Holiday, AppTheme } from '../types';
import { Save, Wallet, Watch, ShieldAlert, Calendar as CalendarIcon, Trash2, Plus, X, Download, Upload, Palette } from 'lucide-react';
import { downloadCSV } from '../utils';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

  const handleSave = () => {
    onSave(localSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleWeeklyOff = (day: number) => {
    const current = localSettings.weeklyOffs || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day) 
      : [...current, day];
    setLocalSettings({ ...localSettings, weeklyOffs: updated });
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    if (localSettings.holidays.some(h => h.date === newHoliday.date)) {
      alert("A holiday already exists for this date.");
      return;
    }
    setLocalSettings({
      ...localSettings,
      holidays: [...(localSettings.holidays || []), newHoliday]
    });
    setNewHoliday({ date: '', name: '' });
  };

  const removeHoliday = (date: string) => {
    setLocalSettings({
      ...localSettings,
      holidays: (localSettings.holidays || []).filter(h => h.date !== date)
    });
  };

  const handleExportHolidays = () => {
    if (localSettings.holidays.length === 0) {
      alert("No holidays to export.");
      return;
    }
    let csv = "Date,Holiday Name\n";
    localSettings.holidays.forEach(h => {
      csv += `${h.date},"${h.name.replace(/"/g, '""')}"\n`;
    });
    downloadCSV(csv, `attendify_holidays_${new Date().getFullYear()}.csv`);
  };

  const handleImportHolidays = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert("Invalid CSV file.");
        return;
      }

      const importedHolidays: Holiday[] = [];
      const existingDates = new Set(localSettings.holidays.map(h => h.date));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/,(.+)/);
        if (parts.length >= 2) {
          const date = parts[0].trim();
          let name = parts[1].trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            if (name.startsWith('"') && name.endsWith('"')) {
              name = name.substring(1, name.length - 1).replace(/""/g, '"');
            }
            if (!existingDates.has(date)) {
              importedHolidays.push({ date, name });
            }
          }
        }
      }

      if (importedHolidays.length > 0) {
        setLocalSettings({
          ...localSettings,
          holidays: [...localSettings.holidays, ...importedHolidays]
        });
      }
      if (holidayFileInputRef.current) holidayFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border">
        <h2 className="text-2xl font-bold mb-1 font-heading">Preferences</h2>
        <p className="opacity-60 text-sm">Personalize your system environment</p>
      </div>

      {/* Visual Themes */}
      <div className="glass p-6 rounded-3xl border space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="theme-accent-text" size={20} />
          <h3 className="font-bold text-lg">Visual Experience</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setLocalSettings({...localSettings, theme: theme.id})}
              className={`relative overflow-hidden group p-4 rounded-2xl border-2 transition-all text-left ${
                localSettings.theme === theme.id ? 'theme-accent-border' : 'border-transparent'
              }`}
              style={{ backgroundColor: theme.colors[0] }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.id === 'nordic' ? '#1a1a1a' : '#EAEAEA' }}>
                  {theme.label}
                </span>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
              </div>
              <div className="flex gap-1">
                <div className="h-1.5 w-1/2 rounded-full opacity-20" style={{ backgroundColor: theme.colors[1] }} />
                <div className="h-1.5 w-1/4 rounded-full opacity-40" style={{ backgroundColor: theme.colors[1] }} />
              </div>
              {localSettings.theme === theme.id && (
                <div className="absolute top-2 right-2 theme-accent-text">
                  <Plus className="rotate-45" size={12} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Financials */}
      <div className="glass p-6 rounded-3xl border space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="theme-accent-text" size={20} />
          <h3 className="font-bold text-lg">Financial Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Monthly Base Salary (INR)</label>
            <input
              type="number"
              value={localSettings.monthlySalary}
              onChange={e => setLocalSettings({ ...localSettings, monthlySalary: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none theme-accent-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold opacity-60 uppercase tracking-widest">OT Hourly Rate (INR)</label>
            <input
              type="number"
              value={localSettings.otRate}
              onChange={e => setLocalSettings({ ...localSettings, otRate: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none theme-accent-border"
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="glass p-6 rounded-3xl border space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Watch className="theme-accent-text" size={20} />
          <h3 className="font-bold text-lg">Attendance Logic</h3>
        </div>
        
        <div className="space-y-3">
          <label className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Global Weekly Offs</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => toggleWeeklyOff(idx)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                  localSettings.weeklyOffs?.includes(idx)
                    ? 'theme-accent-bg text-white shadow-lg'
                    : 'bg-white/5 opacity-40'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Public Holidays */}
      <div className="glass p-6 rounded-3xl border space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="theme-accent-text" size={20} />
            <h3 className="font-bold text-lg">Public Holidays</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportHolidays} className="p-2 glass rounded-xl transition-colors"><Download size={16} /></button>
            <button onClick={() => holidayFileInputRef.current?.click()} className="p-2 glass rounded-xl transition-colors"><Upload size={16} /></button>
            <input type="file" accept=".csv" ref={holidayFileInputRef} onChange={handleImportHolidays} className="hidden" />
          </div>
        </div>

        <div className="flex gap-2">
          <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
          <input type="text" placeholder="Holiday Name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
          <button onClick={addHoliday} className="p-2 theme-accent-bg rounded-xl text-white"><Plus size={18} /></button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {(localSettings.holidays || []).length > 0 ? (
            [...localSettings.holidays].sort((a, b) => a.date.localeCompare(b.date)).map(holiday => (
              <div key={holiday.date} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{holiday.name}</span>
                  <span className="text-[10px] opacity-60">{holiday.date}</span>
                </div>
                <button onClick={() => removeHoliday(holiday.date)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            ))
          ) : (
            <p className="text-center opacity-40 text-xs py-4 italic">No public holidays configured</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-4 theme-accent-bg text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Save size={20} /> {showSuccess ? 'Preferences Saved!' : 'Save System Configuration'}
      </button>
    </div>
  );
};

export default SettingsView;
