import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee, Holiday } from './types.ts';
import { 
  Clock, 
  TrendingUp, 
  Plus, 
  User, 
  Zap, 
  CalendarCheck, 
  CalendarX, 
  Award, 
  Calendar, 
  Coffee, 
  Timer, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  IndianRupee,
  Activity,
  ArrowUpRight,
  MapPin,
  Briefcase,
  Play,
  Square
} from 'lucide-react';
import { calculateWorkedHours, getOT, toLocalDateString, formatDate, formatTime12h } from './utils.ts';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeDuration, setActiveDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeCycleDays, setActiveCycleDays] = useState(Number(employee.workingDaysPerMonth) || 26);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Time & Status Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync punch status and active counter
  useEffect(() => {
    const today = toLocalDateString(currentTime);
    const todayRecord = records.find(r => r.date === today && r.employeeId === employee.id);
    const punched = !!(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
    setIsPunchedIn(punched);

    if (punched && todayRecord?.checkIn) {
      const updateDuration = () => {
        const [inH, inM] = todayRecord.checkIn!.split(':').map(Number);
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const inMinutes = inH * 60 + inM;
        let diffMinutes = currentMinutes - inMinutes;
        
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // handle cross-midnight if any
        }
        
        setActiveDuration({
          hours: Math.floor(diffMinutes / 60),
          minutes: diffMinutes % 60,
          seconds: now.getSeconds()
        });
      };
      
      updateDuration();
      const durationInterval = setInterval(updateDuration, 1000);
      return () => clearInterval(durationInterval);
    } else {
      setActiveDuration({ hours: 0, minutes: 0, seconds: 0 });
    }
  }, [records, employee.id, currentTime]);

  const handleQuickPunch = () => {
    const now = new Date();
    const dateStr = toLocalDateString(now);
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (!isPunchedIn) {
      onAddRecord({ 
        employeeId: employee.id, 
        date: dateStr, 
        checkIn: timeStr, 
        status: 'Duty', 
        notes: 'Quick Punch In via Smart Dashboard' 
      });
    } else {
      const existing = records.find(r => r.date === dateStr && r.employeeId === employee.id);
      if (existing && existing.checkIn) {
        const workedHours = calculateWorkedHours(existing.checkIn, timeStr);
        const otHours = getOT(workedHours);
        onAddRecord({ 
          ...existing, 
          checkOut: timeStr, 
          totalHours: workedHours, 
          otHours,
          status: 'Duty' 
        });
      }
    }
  };

  // Calculate stats for present percentage
  const totalDaysInMonth = activeCycleDays;
  const presentDaysCount = stats?.presentDays || 0;
  const attendanceRate = Math.min(100, Math.round((presentDaysCount / totalDaysInMonth) * 100));

  // Get Today's record (if any)
  const todayStr = toLocalDateString(currentTime);
  const todayRecord = records.find(r => r.date === todayStr && r.employeeId === employee.id);

  // Find next upcoming holiday
  const upcomingHoliday = (() => {
    const todayISO = toLocalDateString(currentTime);
    const futureHolidays = holidays
      .filter(h => h.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date));
    return futureHolidays.length > 0 ? futureHolidays[0] : null;
  })();

  const getHolidayCountdown = (holidayDateStr: string) => {
    const today = new Date(toLocalDateString(currentTime));
    const hDate = new Date(holidayDateStr);
    const diffTime = hDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today! 🎉";
    if (diffDays === 1) return "Tomorrow 🗓️";
    return `In ${diffDays} days ⏳`;
  };

  // Welcome Messages depending on hours
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // Get last 4 records for recent feed
  const sortedRecentRecords = [...records]
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  // Calculate salary components for segmented breakdown bar
  const baseSalaryValue = Number(stats?.monthlySalary || employee.monthlySalary) || 0;
  const otValue = Number(stats?.otEarnings) || 0;
  const deductionValue = Number(stats?.deductions) || 0;
  const netValue = Number(stats?.netSalary) || 0;
  const totalFinancialVolume = baseSalaryValue + otValue;
  
  const basePercent = totalFinancialVolume > 0 ? (baseSalaryValue / totalFinancialVolume) * 100 : 100;
  const otPercent = totalFinancialVolume > 0 ? (otValue / totalFinancialVolume) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-6 px-1 sm:px-0 max-w-7xl mx-auto"
    >
      {/* 1. Cohesive Header Card: Merging Profile Info & Digital Clock in One Sleek Container */}
      <div className="glass rounded-3xl p-5 sm:p-6 border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent shadow-2xl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
          
          {/* Profile Section - Left (Takes 7 cols on Desktop) */}
          <div className="md:col-span-7 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-6">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-sky-400/30 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg relative group">
                <span className="text-lg sm:text-xl font-black text-sky-400">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0B132B] flex items-center justify-center shadow-md bg-emerald-500">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-sky-500/20 inline-flex items-center gap-1">
                  <Sparkles size={8} /> {getGreeting()}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {isPunchedIn ? 'On Duty' : 'Checked Out'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">{employee.name}</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1 text-slate-300">
                  <Briefcase size={12} className="text-slate-500 shrink-0" /> {employee.role}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="font-mono text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                  ID: {employee.employeeId}
                </span>
              </div>
            </div>
          </div>

          {/* Integrated Real-Time Clock - Right (Takes 5 cols on Desktop) */}
          <div className="md:col-span-5 flex flex-row md:flex-col justify-between md:justify-center items-center gap-4 text-left md:text-center">
            
            {/* Clock Segment */}
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono flex items-baseline justify-start md:justify-center gap-0.5 select-none">
                <span className="neon-text theme-accent-text text-sky-400">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="text-lg font-bold opacity-30 text-slate-400 animate-pulse">:</span>
                <span className="text-lg sm:text-xl font-black text-slate-400">
                  {currentTime.toLocaleTimeString('en-US', { second: '2-digit' })}
                </span>
                <span className="text-xs font-black text-slate-500 uppercase ml-1">
                  {currentTime.toLocaleTimeString('en-US', { hour12: true }).slice(-2)}
                </span>
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest md:text-center text-left">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long' })} • UTC+{Math.abs(currentTime.getTimezoneOffset() / 60)}
              </div>
            </div>

            {/* Date Pill Badge */}
            <div className="text-[10px] font-bold text-slate-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-all text-right md:text-center shrink-0">
              {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Moved Shift Control Desk Up: Highly Interactive & Stylish Segment */}
      <div className="glass rounded-3xl p-5 sm:p-6 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shadow-xl relative overflow-hidden">
        {/* Interactive indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
          isPunchedIn ? 'bg-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.3)]' : 'bg-slate-700'
        }`} />

        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          
          {/* Shift Stats and Title */}
          <div className="space-y-3.5 text-center md:text-left flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-2 border-b border-white/5 pb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">Shift Control Desk</h3>
              </div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded">
                Rate: {attendanceRate}% attendance
              </div>
            </div>

            {/* Time Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-left font-mono">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">In Punch</span>
                <p className="text-xs font-bold text-white mt-0.5">{todayRecord?.checkIn ? formatTime12h(todayRecord.checkIn) : '--:--'}</p>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-left font-mono">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Out Punch</span>
                <p className="text-xs font-bold text-white mt-0.5">{todayRecord?.checkOut ? formatTime12h(todayRecord.checkOut) : '--:--'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-left font-mono flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Cycle Status</span>
                <p className="text-xs font-bold text-sky-400 mt-0.5">Active Cycle</p>
              </div>
            </div>

            {/* Shift Duration Pill */}
            <AnimatePresence mode="wait">
              {isPunchedIn && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center justify-center md:justify-start gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl"
                >
                  <Timer size={13} className="animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Duration Logged:</span>
                  <span className="font-mono text-xs sm:text-sm font-black tracking-tight ml-1">
                    {String(activeDuration.hours).padStart(2, '0')}h : {String(activeDuration.minutes).padStart(2, '0')}m : {String(activeDuration.seconds).padStart(2, '0')}s
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compact Glow Action Button (Extremely optimized for mobile tap / desktop hover) */}
          <div className="shrink-0 w-full md:w-auto flex justify-center items-center border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            <button 
              onClick={handleQuickPunch}
              className={`w-full md:w-44 py-3.5 sm:py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 text-sm font-black uppercase tracking-widest border ${
                isPunchedIn 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/30 shadow-[0_8px_25px_rgba(244,63,94,0.25)]' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400/30 shadow-[0_8px_25px_rgba(16,185,129,0.25)]'
              }`}
            >
              {isPunchedIn ? (
                <>
                  <Square size={16} className="fill-current shrink-0" />
                  <span>Punch Out</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-current shrink-0" />
                  <span>Punch In</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Stats Bento Grid - Highly Compact & Grid Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Present Days Card */}
        <div 
          onMouseEnter={() => setHoveredCard('present')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`glass p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[110px] ${
            hoveredCard === 'present' ? 'border-emerald-500/30 -translate-y-0.5 shadow-[0_8px_20px_rgba(16,185,129,0.08)] bg-gradient-to-b from-white/[0.04] to-transparent' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Present Days</p>
            <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
              <CalendarCheck size={14} />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-black text-white">{stats?.presentDays || 0}</span>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">/ {activeCycleDays}d Target</span>
            </div>
            {/* Smooth mini progress track */}
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* OT Hours Card */}
        <div 
          onMouseEnter={() => setHoveredCard('ot')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`glass p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[110px] ${
            hoveredCard === 'ot' ? 'border-sky-500/30 -translate-y-0.5 shadow-[0_8px_20px_rgba(56,189,248,0.08)] bg-gradient-to-b from-white/[0.04] to-transparent' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">OT Hours</p>
            <div className="p-1.5 bg-sky-500/15 text-sky-400 rounded-lg">
              <Zap size={14} className="group-hover:animate-bounce" />
            </div>
          </div>
          <div className="space-y-0.5 mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-black text-sky-400">
                {stats?.totalOTHours !== undefined ? Number(stats.totalOTHours).toFixed(1) : '0.0'}
              </span>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Hrs</span>
            </div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider truncate">
              +₹{Math.round(stats?.otEarnings || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Absent Days Card */}
        <div 
          onMouseEnter={() => setHoveredCard('absent')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`glass p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[110px] ${
            hoveredCard === 'absent' ? 'border-rose-500/30 -translate-y-0.5 shadow-[0_8px_20px_rgba(244,63,94,0.08)] bg-gradient-to-b from-white/[0.04] to-transparent' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Absent Days</p>
            <div className="p-1.5 bg-rose-500/15 text-rose-400 rounded-lg">
              <CalendarX size={14} />
            </div>
          </div>
          <div className="space-y-0.5 mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl sm:text-2xl font-black text-rose-500">{stats?.absentDays || 0}</span>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Days</span>
            </div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider truncate">
              {stats?.halfDays || 0} Half-days
            </p>
          </div>
        </div>

        {/* Leaves & Quotas Card */}
        <div 
          onMouseEnter={() => setHoveredCard('leaves')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`glass p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[110px] ${
            hoveredCard === 'leaves' ? 'border-amber-500/30 -translate-y-0.5 shadow-[0_8px_20px_rgba(245,158,11,0.08)] bg-gradient-to-b from-white/[0.04] to-transparent' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Leave Quota</p>
            <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg">
              <Calendar size={14} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[8px] text-slate-400 mt-2">
              <div className="bg-slate-950/40 py-1 rounded border border-white/5">
                <p className="text-[7px] font-bold text-slate-500 uppercase">SL</p>
                <p className="font-bold text-amber-400">{employee.quotas?.SL || 0}</p>
              </div>
              <div className="bg-slate-950/40 py-1 rounded border border-white/5">
                <p className="text-[7px] font-bold text-slate-500 uppercase">PL</p>
                <p className="font-bold text-sky-400">{employee.quotas?.PL || 0}</p>
              </div>
              <div className="bg-slate-950/40 py-1 rounded border border-white/5">
                <p className="text-[7px] font-bold text-slate-500 uppercase">CL</p>
                <p className="font-bold text-emerald-400">{employee.quotas?.CL || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Hub: Payout Summary with Breakdown Segmented Bar */}
      <div className="glass rounded-3xl p-5 sm:p-6 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shadow-xl space-y-5 relative overflow-hidden">
        {/* Subtle Ambient light behind financials */}
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-white uppercase tracking-tight">Active Payroll Hub</h3>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">Formula: Base Pay / Cycle Days × Present Days + Overtime Pay - Deductions</p>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 shrink-0">
            <TrendingUp size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Active cycle</span>
          </div>
        </div>

        {/* Financial Numbers Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-10">
          <div className="space-y-1">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <Briefcase size={10} className="shrink-0 text-slate-400" /> Base Pay
            </p>
            <p className="text-sm sm:text-xl font-black text-white flex items-center font-mono">
              <IndianRupee size={12} className="text-slate-400 sm:size-4 shrink-0" />
              {baseSalaryValue.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-sky-400 shrink-0" /> OT Pay
            </p>
            <p className="text-sm sm:text-xl font-black text-sky-400 flex items-center font-mono">
              <span className="text-slate-500 text-xs font-bold mr-0.5">+</span>
              <IndianRupee size={12} className="text-sky-400 sm:size-4 shrink-0" />
              {Math.round(otValue).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <CalendarX size={10} className="text-rose-400 shrink-0" /> Deducts
            </p>
            <p className="text-sm sm:text-xl font-black text-rose-500 flex items-center font-mono">
              <span className="text-slate-500 text-xs font-bold mr-0.5">-</span>
              <IndianRupee size={12} className="text-rose-500 sm:size-4 shrink-0" />
              {Math.round(deductionValue).toLocaleString()}
            </p>
          </div>

          <div className="bg-sky-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-sky-500/10 border border-sky-400/20 col-span-2 lg:col-span-1">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] opacity-80 mb-0.5">Estimated Net Payout</p>
            <div className="flex items-center font-mono font-black text-xl sm:text-2xl tracking-tighter">
              <span>₹</span>
              <span>{Math.round(netValue).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Horizontal Salary Breakdown Segmented Bar */}
        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 font-bold px-0.5 uppercase tracking-wider">
            <span>Payout Composition</span>
            <span className="font-mono text-slate-500">Total: ₹{(baseSalaryValue + otValue).toLocaleString()}</span>
          </div>
          
          <div className="w-full h-2.5 sm:h-3 bg-slate-950 rounded-full overflow-hidden flex border border-white/5 p-0.5">
            {baseSalaryValue > 0 && (
              <div 
                className="h-full bg-gradient-to-r from-slate-400 to-slate-200 rounded-l-full relative group transition-all duration-500"
                style={{ width: `${basePercent}%` }}
              />
            )}
            {otValue > 0 && (
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 relative group transition-all duration-500"
                style={{ width: `${otPercent}%` }}
              />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-black text-slate-400 uppercase tracking-widest px-0.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>Base Pay ({Math.round(basePercent)}%)</span>
            </div>
            {otValue > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>OT Pay ({Math.round(otPercent)}%)</span>
              </div>
            )}
            {deductionValue > 0 && (
              <div className="flex items-center gap-1 text-rose-500">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Deductions Offset</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recent Activity Feed & Upcoming Holiday (Side-by-side or stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Recent Activity Feed - takes 3 cols */}
        <div className="lg:col-span-3 glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent shadow-xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-sky-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">Recent Activity</h3>
            </div>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">Last 4 entries</span>
          </div>

          {sortedRecentRecords.length > 0 ? (
            <div className="space-y-3">
              {sortedRecentRecords.map((rec, i) => {
                const workedHrs = rec.totalHours || 0;
                const hasOT = rec.otHours && rec.otHours > 0;
                
                const statusColors: Record<string, string> = {
                  'Duty': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  'Weekly Off': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                  'Holiday': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  'Absent': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  'Half-Day': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                };

                const defaultColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                const statusStyle = statusColors[rec.status] || defaultColor;

                return (
                  <div key={i} className="group bg-slate-950/20 hover:bg-slate-950/40 border border-white/5 hover:border-white/10 p-3 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="p-2 bg-white/5 rounded-lg text-slate-400 font-mono text-[9px] text-center min-w-[50px] border border-white/5 shrink-0">
                        <p className="font-bold uppercase tracking-wider">{new Date(rec.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-sm font-black text-white leading-none mt-0.5">{new Date(rec.date).getDate()}</p>
                      </div>

                      <div className="space-y-0.5 text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${statusStyle} shrink-0`}>
                            {rec.status}
                          </span>
                          {rec.notes && <span className="text-[9px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-xs">{rec.notes}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {rec.checkIn ? formatTime12h(rec.checkIn) : '--:--'} → {rec.checkOut ? formatTime12h(rec.checkOut) : '--:--'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-1.5 sm:pt-0 shrink-0">
                      <div className="space-y-0.5 text-left sm:text-right">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Worked</p>
                        <p className="text-xs font-black text-white font-mono">{workedHrs} <span className="text-[9px] text-slate-500 font-bold">HRS</span></p>
                      </div>
                      {hasOT && (
                        <div className="space-y-0.5 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/10">
                          <p className="text-[7px] font-black text-sky-400 uppercase tracking-widest">OT Earned</p>
                          <p className="text-[10px] font-black text-sky-400 font-mono">+{rec.otHours}h</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs italic font-medium leading-relaxed border border-dashed border-white/10 rounded-xl bg-slate-950/20">
              No attendance records found. Use the Control Desk to punch in!
            </div>
          )}
        </div>

        {/* Upcoming Holiday & Quick Tips - takes 2 cols */}
        <div className="lg:col-span-2 glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xl flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Holiday Desk</h3>
            </div>
            <Sparkles size={14} className="text-slate-600" />
          </div>

          {upcomingHoliday ? (
            <div className="space-y-2 py-2 text-left">
              <div className="text-[11px] font-black text-white tracking-tight bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                <span className="truncate">{upcomingHoliday.name}</span>
                <span className="text-amber-400 font-mono text-[9px] shrink-0">{getHolidayCountdown(upcomingHoliday.date)}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-medium text-slate-500 px-1 font-mono">
                <span>Date: {formatDate(upcomingHoliday.date)}</span>
                <span>Type: Gazetted</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-[11px] italic font-medium leading-relaxed">
              No upcoming company holidays listed.
            </div>
          )}

          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
              <Coffee size={12} />
            </div>
            <div className="text-[8px] sm:text-[9px] text-slate-400 font-semibold leading-relaxed">
              Notes can be updated during checkout for easier month-end audit approvals.
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default Dashboard;
