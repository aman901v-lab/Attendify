import React, { useState } from 'react';
import { AttendanceRecord, AttendanceStatus, Employee, Holiday } from '../types.ts';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { calculateHours, getOT, getAutoStatus, toLocalDateString } from '../utils.ts';

interface Props {
  employee: Employee;
  records: AttendanceRecord[];
  holidays: Holiday[];
  onAddRecord: (r: AttendanceRecord) => void;
  onDeleteRecord: (date: string) => void;
}

const STATUS_CONFIG: Record<AttendanceStatus, { color: string, bg: string }> = {
  'Duty': { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  'SL': { color: 'text-rose-400', bg: 'bg-rose-500/20' },
  'PL': { color: 'text-amber-400', bg: 'bg-amber-500/20' },
  'CL': { color: 'text-purple-400', bg: 'bg-purple-500/20' },
  'Unpaid': { color: 'text-slate-400', bg: 'bg-slate-500/20' },
  'Half-Day': { color: 'text-orange-400', bg: 'bg-orange-500/20' },
  'Weekly Off': { color: 'text-sky-400', bg: 'bg-sky-500/10' },
  'Holiday': { color: 'text-pink-400', bg: 'bg-pink-500/20' },
  'Absent': { color: 'text-rose-600', bg: 'bg-rose-600/10' },
};

const Calendar: React.FC<Props> = ({ employee, records, holidays, onAddRecord, onDeleteRecord }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({ status: 'Duty', checkIn: '09:00', checkOut: '17:30', notes: '' });

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = monthStart.getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
    const dateStr = toLocalDateString(d);
    const record = records.find(r => r.date === dateStr);
    const autoStatus = getAutoStatus(dateStr, employee, holidays);
    return { date: dateStr, day: i + 1, record, autoStatus };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    let finalRecord: AttendanceRecord = { employeeId: employee.id, date: selectedDate, status: formData.status as AttendanceStatus, notes: formData.notes || '' };
    if (formData.status === 'Duty' || formData.status === 'Half-Day') {
      if (formData.checkIn && formData.checkOut) {
        const total = calculateHours(formData.checkIn, formData.checkOut);
        finalRecord = { ...finalRecord, checkIn: formData.checkIn, checkOut: formData.checkOut, totalHours: total, otHours: getOT(total, employee.dailyWorkHours) };
      }
    }
    onAddRecord(finalRecord);
    setShowForm(false);
  };

  const openForm = (date: string, existing?: AttendanceRecord, autoStatus?: AttendanceStatus | null) => {
    setSelectedDate(date);
    const defaultStatus = autoStatus || 'Duty';
    setFormData(existing ? { ...existing } : { status: defaultStatus, checkIn: '09:00', checkOut: '17:30', notes: '' });
    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedDate && window.confirm(`Permanently delete record for ${selectedDate}?`)) {
      onDeleteRecord(selectedDate);
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center glass p-4 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold font-heading text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex space-x-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-500 py-2 uppercase tracking-widest">{d}</div>)}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(({ date, day, record, autoStatus }) => {
          const status = record?.status || autoStatus;
          const config = status ? STATUS_CONFIG[status] : null;
          
          return (
            <button 
              key={date} 
              onClick={() => openForm(date, record, autoStatus)} 
              className={`aspect-square glass rounded-xl flex flex-col items-center justify-center relative transition-all border border-white/5 hover:border-sky-500/30 active:scale-95 ${record ? 'bg-sky-500/5 shadow-inner' : (autoStatus ? 'bg-slate-500/5' : '')}`}
            >
              <span className={`text-xs ${record ? 'text-sky-400 font-bold' : (autoStatus ? 'text-slate-400 opacity-60' : 'text-slate-500')}`}>{day}</span>
              {status && config && <div className={`mt-1 h-1 w-1 rounded-full ${config.bg.replace('/20', '')}`} />}
              {!record && autoStatus && (
                <span className="absolute bottom-1 text-[6px] font-black uppercase tracking-tighter text-slate-600">
                  {autoStatus.split(' ')[0]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-md glass p-6 sm:p-8 rounded-[2.5rem] border border-sky-500/30 space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Daily Log</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Edit entry for {selectedDate}</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                <button 
                  key={s} 
                  type="button" 
                  onClick={() => setFormData({...formData, status: s})} 
                  className={`py-2 text-[9px] rounded-xl border font-black uppercase transition-all ${formData.status === s ? 'border-sky-500 bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10' : 'border-white/5 bg-slate-900 text-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {(formData.status === 'Duty' || formData.status === 'Half-Day') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Punch In</label>
                  <input type="time" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-sky-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Punch Out</label>
                  <input type="time" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-sky-500 outline-none" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Notes</label>
               <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 h-24 text-white text-sm resize-none focus:border-sky-500 outline-none" placeholder="Activity description..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-4 bg-sky-500 rounded-2xl font-black text-white shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-widest text-[10px]">Update Record</button>
              {selectedDate && records.some(r => r.date === selectedDate) && (
                <button type="button" onClick={handleDelete} className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all group shadow-lg shadow-rose-500/5">
                  <Trash2 size={20} className="group-active:scale-90 transition-transform" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Calendar;