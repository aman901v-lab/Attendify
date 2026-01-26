import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee, Holiday } from './types.ts';
import { Clock, TrendingUp, Plus, User, Zap } from 'lucide-react';
import { calculateWorkedHours, getOT, toLocalDateString } from './utils.ts';

interface Props {
  stats: any;
  employee: Employee;
  records: AttendanceRecord[];
  holidays: Holiday[];
  onAddRecord: (r: AttendanceRecord) => void;
}

const Dashboard: React.FC<Props> = ({ stats, employee, records, holidays, onAddRecord }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const today = toLocalDateString(new Date());
    const todayRecord = records.find(r => r.date === today && r.employeeId === employee.id);
    setIsPunchedIn(!!(todayRecord && todayRecord.checkIn && !todayRecord.checkOut));
    return () => clearInterval(timer);
  }, [records, employee.id]);

  const handleQuickPunch = () => {
    const now = new Date();
    const dateStr = toLocalDateString(now);
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (!isPunchedIn) {
      onAddRecord({ employeeId: employee.id, date: dateStr, checkIn: timeStr, status: 'Duty', notes: 'Quick Punch In' });
    } else {
      const existing = records.find(r => r.date === dateStr && r.employeeId === employee.id);
      if (existing && existing.checkIn) {
        const workedHours = calculateWorkedHours(existing.checkIn, timeStr);
        const otHours = getOT(workedHours);
        onAddRecord({ ...existing, checkOut: timeStr, totalHours: workedHours, otHours });
      }
    }
  };

  const workingDaysLabel = employee.workingDaysPerMonth || 26;
  
  // Force exactly 2 decimal places for visual consistency
  const displayOTHours = stats?.totalOTHours !== undefined ? Number(stats.totalOTHours).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="glass rounded-[3rem] p-8 border border-white/5 bg-gradient-to-br from-white/10 to-transparent shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Zap size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-4xl font-black text-white tracking-tight">{employee.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{employee.role}</span>
              <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{employee.employeeId}</span>
            </div>
            <div className="text-6xl font-black theme-accent-text neon-text mt-4">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
          
          <button 
            onClick={handleQuickPunch} 
            className={`w-40 h-40 rounded-full border-4 transition-all duration-700 flex flex-col items-center justify-center group active:scale-90 ${isPunchedIn ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]'}`}
          >
            <Plus size={48} className={`transition-transform duration-500 group-hover:scale-110 ${isPunchedIn ? 'rotate-45 text-rose-500' : 'text-emerald-500'}`} />
            <span className={`text-xs font-black uppercase mt-2 tracking-widest ${isPunchedIn ? 'text-rose-500' : 'text-emerald-500'}`}>{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Present Days</p>
          <p className="text-3xl font-black text-white">{stats.presentDays} <span className="text-xs font-bold text-slate-600">DAYS</span></p>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">OT Hours</p>
          <p className="text-3xl font-black text-emerald-400">{displayOTHours} <span className="text-xs font-bold text-slate-600">HRS</span></p>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Absent Days</p>
          <p className="text-3xl font-black text-rose-500">{stats.absentDays} <span className="text-xs font-bold text-slate-600">DAYS</span></p>
        </div>
        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Deductions</p>
          <p className="text-3xl font-black text-white">₹{Math.round(stats.deductions)}</p>
        </div>
      </div>

      {/* Salary Summary Card */}
      <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Payout Summary</h3>
          <TrendingUp className="text-emerald-400" size={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Base Monthly ({workingDaysLabel}d)</p>
            <p className="text-2xl font-black text-white">₹{employee.monthlySalary.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Extra OT Earnings</p>
            <p className="text-2xl font-black text-emerald-400">+₹{Math.round(stats.otEarnings).toLocaleString()}</p>
          </div>
          <div className="bg-sky-500 text-white p-6 rounded-3xl shadow-2xl shadow-sky-500/20 transform md:scale-105">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Net Payable</p>
            <p className="text-4xl font-black tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-8 text-[9px] text-slate-600 text-center font-bold uppercase tracking-[0.2em]">Formula verified: Monthly / {workingDaysLabel} + (OT × Hourly Rate) - Absents</p>
      </div>
    </div>
  );
};

export default Dashboard;