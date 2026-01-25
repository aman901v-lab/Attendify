
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee, Holiday } from '../types.ts';
import { Clock, TrendingUp, Calendar as Cal, AlertCircle, Plus, CheckCircle, User } from 'lucide-react';
import { calculateHours, getOT, getAutoStatus } from '../utils.ts';

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
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === today && r.employeeId === employee.id);
    setIsPunchedIn(!!(todayRecord && todayRecord.checkIn && !todayRecord.checkOut));
    return () => clearInterval(timer);
  }, [records, employee.id]);

  const handleQuickPunch = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const autoStatus = getAutoStatus(dateStr, employee, holidays);

    if (!isPunchedIn) {
      const status = autoStatus ? 'Duty' : 'Duty';
      const notes = autoStatus ? `Punched on ${autoStatus}` : '';
      onAddRecord({ employeeId: employee.id, date: dateStr, checkIn: timeStr, status, notes });
    } else {
      const existing = records.find(r => r.date === dateStr && r.employeeId === employee.id);
      if (existing && existing.checkIn) {
        const totalHours = calculateHours(existing.checkIn, timeStr);
        const otHours = getOT(totalHours, employee.dailyWorkHours);
        onAddRecord({ ...existing, checkOut: timeStr, totalHours, otHours });
      }
    }
  };

  const StatCard = ({ label, value, icon: Icon, color, suffix = "" }: any) => (
    <div className="glass p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-xl">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon size={14} className={`text-${color}-400`} />
        </div>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-xl font-bold font-heading">{value}</span>
        <span className="text-[8px] text-slate-500 font-medium">{suffix}</span>
      </div>
    </div>
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAutoStatus = getAutoStatus(todayStr, employee, holidays);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 relative overflow-hidden border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400">
              <User size={18} />
              <span className="font-bold uppercase tracking-widest text-xs">{employee.role}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{employee.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-sm">Status: <span className={isPunchedIn ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{isPunchedIn ? 'ACTIVE' : 'OFF DUTY'}</span></p>
              {todayAutoStatus && (
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-bold uppercase tracking-widest animate-pulse">
                  Today is {todayAutoStatus}
                </span>
              )}
            </div>
            <div className="text-4xl font-bold font-heading neon-text text-sky-400">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
          
          <button
            onClick={handleQuickPunch}
            className={`w-32 h-32 rounded-full border-4 transition-all duration-500 flex items-center justify-center flex-col gap-1 ${
              isPunchedIn ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] bg-rose-500/10' : 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-emerald-500/10'
            }`}
          >
            <Plus size={32} className={isPunchedIn ? 'rotate-45 text-rose-500' : 'text-emerald-500'} />
            <span className={`font-bold uppercase tracking-widest text-[8px] ${isPunchedIn ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isPunchedIn ? 'OUT' : 'IN'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present" value={stats.presentDays} icon={CheckCircle} color="sky" suffix="days" />
        <StatCard label="OT Hours" value={stats.totalOTHours} icon={Clock} color="amber" suffix="hrs" />
        <StatCard label="Deductions" value={Math.round(stats.deductions)} icon={AlertCircle} color="rose" suffix="INR" />
        <StatCard label="Paid Leaves" value={stats.paidLeavesUsed} icon={Cal} color="purple" suffix="days" />
      </div>

      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold">Estimated Net Payout</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Current Cycle Estimate</p>
          </div>
          <TrendingUp size={20} className="text-sky-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Base Pay</span>
            <p className="text-xl font-bold">₹{employee.monthlySalary.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">OT ({employee.otRate}/hr)</span>
            <p className="text-xl font-bold text-emerald-400">+₹{Math.round(stats.otEarnings).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <span className="text-sky-400 text-[10px] font-bold uppercase tracking-widest">Final Payout</span>
            <p className="text-2xl font-bold neon-text">₹{Math.round(stats.netSalary).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
