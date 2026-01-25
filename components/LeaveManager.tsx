
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Employee, LeaveRequest } from '../types';
import { ClipboardList, PieChart, Plus, X, Info } from 'lucide-react';

interface Props {
  employee: Employee;
  records: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onAddRequest: (r: LeaveRequest) => void;
}

const LeaveManager: React.FC<Props> = ({ employee, records, leaveRequests, onAddRequest }) => {
  const [showForm, setShowForm] = useState(false);
  
  const availableTypes = useMemo(() => {
    const types: { value: 'SL' | 'PL' | 'CL' | 'Unpaid'; label: string }[] = [];
    if (employee.quotas.PL > 0) types.push({ value: 'PL', label: 'Paid Leave (PL)' });
    if (employee.quotas.SL > 0) types.push({ value: 'SL', label: 'Sick Leave (SL)' });
    if (employee.quotas.CL > 0) types.push({ value: 'CL', label: 'Casual Leave (CL)' });
    types.push({ value: 'Unpaid', label: 'Unpaid Leave' });
    return types;
  }, [employee.quotas]);

  const [formData, setFormData] = useState({ 
    type: availableTypes[0]?.value || 'Unpaid', 
    start: '', 
    end: '', 
    reason: '' 
  });

  const currentYear = new Date().getFullYear().toString();
  const yearlyRecords = records.filter(r => r.date.startsWith(currentYear));

  const getUsage = (type: string) => yearlyRecords.filter(r => r.status === type).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRequest({
      id: Date.now().toString(),
      employeeId: employee.id,
      type: formData.type as any,
      startDate: formData.start,
      endDate: formData.end,
      reason: formData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });
    setShowForm(false);
  };

  const STYLE_MAP: Record<string, { bg: string, text: string, progress: string }> = {
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', progress: 'bg-rose-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', progress: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', progress: 'bg-purple-500' }
  };

  const LeaveCard = ({ label, used, total, colorKey }: { label: string, used: number, total: number, colorKey: string }) => {
    const remaining = Math.max(0, total - used);
    const progress = (used / total) * 100;
    const styles = STYLE_MAP[colorKey] || STYLE_MAP.emerald;
    
    return (
      <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg">{label}</h4>
          <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${styles.bg} ${styles.text}`}>Yearly</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-heading">{remaining}</span>
          <span className="text-slate-500 text-xs">days left</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${styles.progress}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 font-medium">Used: {used} / {total} days</p>
      </div>
    );
  };

  const hasPaidQuotas = employee.quotas.SL > 0 || employee.quotas.PL > 0 || employee.quotas.CL > 0;
  const workingDaysCycle = employee.workingDaysPerMonth || 26;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Leave Center</h2>
          <p className="text-slate-500 text-sm">Apply and track leave history</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ ...formData, type: availableTypes[0]?.value || 'Unpaid' });
            setShowForm(true);
          }} 
          className="bg-sky-500 hover:bg-sky-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
        >
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {employee.quotas.SL > 0 && <LeaveCard label="Sick (SL)" used={getUsage('SL')} total={employee.quotas.SL} colorKey="rose" />}
        {employee.quotas.PL > 0 && <LeaveCard label="Paid (PL)" used={getUsage('PL')} total={employee.quotas.PL} colorKey="emerald" />}
        {employee.quotas.CL > 0 && <LeaveCard label="Casual (CL)" used={getUsage('CL')} total={employee.quotas.CL} colorKey="purple" />}
        
        {!hasPaidQuotas && (
          <div className="md:col-span-3 glass p-6 rounded-2xl border border-sky-500/10 bg-sky-500/5 flex items-center gap-4">
            <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-bold">No Paid Leave Quotas</h4>
              <p className="text-sm text-slate-400">All leave requests for this profile will be processed as Unpaid Leave.</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5 shadow-xl">
        <div className="p-4 border-b border-white/5 bg-white/5 font-bold flex items-center gap-2">
          <PieChart size={18} className="text-sky-400"/> Request Status
        </div>
        <div className="divide-y divide-white/5">
          {leaveRequests.length > 0 ? leaveRequests.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(r => (
            <div key={r.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{r.type === 'Unpaid' ? 'Unpaid' : r.type} Request</p>
                  {r.type === 'Unpaid' && <span className="text-[8px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">Salary Deducted</span>}
                </div>
                <p className="text-xs text-slate-500">{r.startDate} to {r.endDate}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                r.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {r.status}
              </span>
            </div>
          )) : <p className="p-8 text-center text-slate-500 text-sm italic">No recent requests</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative glass w-full max-w-md p-8 rounded-[2.5rem] border border-sky-500/30 shadow-2xl space-y-4 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold font-heading">Application</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Leave Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value as any})} 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 appearance-none transition-all"
              >
                {availableTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Start Date</label>
                <input type="date" required value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">End Date</label>
                <input type="date" required value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Reason for Leave</label>
              <textarea 
                required 
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})} 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 h-24 text-white focus:outline-none focus:border-sky-500 resize-none"
                placeholder="Brief description..."
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/30 transition-all active:scale-95"
              >
                Submit Leave Request
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-4 font-medium uppercase tracking-widest">Calculated on {workingDaysCycle}-day working cycle</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LeaveManager;
