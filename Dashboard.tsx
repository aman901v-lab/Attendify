import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee, Holiday } from './types.ts';
import { Clock, TrendingUp, Calendar as Cal, AlertCircle, Plus, CheckCircle, User } from 'lucide-react';
import { calculateHours, getOT, getAutoStatus, toLocalDateString } from './utils.ts';

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
        const totalHours = calculateHours(existing.checkIn, timeStr);
        const otHours = getOT(totalHours, employee.dailyWorkHours);
        onAddRecord({ ...existing, checkOut: timeStr, totalHours, otHours });
      }
    }
  };

  const workingDaysLabel = employee.workingDaysPerMonth || 26;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">{employee.name}</h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{employee.role} | {employee.employeeId}</p>
            <div className="text-5xl font-bold text-sky-400 neon-text">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
          
          <button onClick={handleQuickPunch} className={`w-32 h-32 rounded-full border-4 transition-all duration-500 flex flex-col items-center justify-center ${isPunchedIn ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
            <Plus size={32} className={isPunchedIn ? 'rotate-45 text-rose-500' : 'text-emerald-500'} />
            <span className={`text-[10px] font-black uppercase mt-1 ${isPunchedIn ? 'text-rose-500' : 'text-emerald-500'}`}>{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Present</p>
          <p className="text-2xl font-bold text-white">{stats.presentDays} <span className="text-xs font-normal text-slate-500">Days</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">OT Hours</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.totalOTHours} <span className="text-xs font-normal text-slate-500">Hrs</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Absents</p>
          <p className="text-2xl font-bold text-rose-500">{stats.absentDays} <span className="text-xs font-normal text-slate-500">Days</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Deductions</p>
          <p className="text-2xl font-bold text-white">₹{Math.round(stats.deductions)}</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 border border-white/5 bg-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Salary Payout Summary</h3>
          <TrendingUp className="text-emerald-400" size={20} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Fixed Monthly ({workingDaysLabel} Days Cycle)</p>
            <p className="text-2xl font-bold text-white">₹{employee.monthlySalary.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Overtime Earnings</p>
            <p className="text-2xl font-bold text-emerald-400">+₹{Math.round(stats.otEarnings).toLocaleString()}</p>
          </div>
          <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20">
            <p className="text-[10px] text-sky-400 font-bold uppercase">Net Payable Amount</p>
            <p className="text-3xl font-bold text-white neon-text">₹{Math.round(stats.netSalary).toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-6 text-[9px] text-slate-500 text-center font-medium uppercase tracking-widest italic">Note: Salary calculation is fixed by admin and based on a {workingDaysLabel}-day working cycle.</p>
      </div>
    </div>
  );
};

export default Dashboard;