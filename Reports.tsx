import React, { useState } from 'react';
import { AttendanceRecord, Employee, User, Holiday } from './types.ts';
import { 
  FileText, 
  Calendar, 
  Wallet, 
  Printer,
  FileSpreadsheet,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Filter,
  CheckCircle2,
  CalendarDays,
  SlidersHorizontal
} from 'lucide-react';
import { calculateSalary, downloadCSV, formatTime12h, formatDate, getAutoStatus, generateMonthlyRecords, toLocalDateString, getActiveSalaryForMonth } from './utils.ts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Props {
  employee: Employee;
  records: AttendanceRecord[];
  user?: User;
  holidays: Holiday[];
}

const Reports: React.FC<Props> = ({ employee, records, user, holidays }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Duty' | 'Absent' | 'Leaves'>('All');
  
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthlyRecords = generateMonthlyRecords(year, month, employee, records, holidays);
  const pdfMonthlyRecords = generateMonthlyRecords(year, month, employee, records, holidays, true);
    
  const stats = calculateSalary(monthlyRecords, employee, selectedMonth);
  const pdfStats = calculateSalary(pdfMonthlyRecords, employee, selectedMonth);

  const daysInMonth = new Date(year, month, 0).getDate();
  const rowHeight = daysInMonth === 28 ? '4.5mm' : daysInMonth === 29 ? '4.3mm' : daysInMonth === 30 ? '4.1mm' : '3.9mm';

  const handlePrevMonth = () => {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    setSelectedMonth(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    setSelectedMonth(`${nextYear}-${nextMonth.toString().padStart(2, '0')}`);
  };

  const filteredRecords = monthlyRecords.filter(r => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Duty') return r.status === 'Duty' || r.status === 'Half-Day';
    if (statusFilter === 'Absent') return r.status === 'Absent' || r.status === 'Unpaid';
    if (statusFilter === 'Leaves') return ['SL', 'PL', 'CL', 'Holiday', 'Weekly Off'].includes(r.status);
    return true;
  });


  const activeMonthlySalary = getActiveSalaryForMonth(employee, selectedMonth);

  const getDailyAmount = (record: AttendanceRecord) => {
    const workingDays = Number(employee.workingDaysPerMonth) || 26;
    const dailySalary = activeMonthlySalary / workingDays;
    const hourlyRate = dailySalary / 8;
    const otRate = (Number(employee.otRate) > 0) ? Number(employee.otRate) : hourlyRate;

    if (record.status === 'Duty') {
      return dailySalary + ((record.otHours || 0) * otRate);
    } else if (record.status === 'Half-Day') {
      return (dailySalary / 2) + ((record.otHours || 0) * otRate);
    } else if (['SL', 'PL', 'CL'].includes(record.status)) {
      return dailySalary;
    }
    return 0;
  };

  const handlePrint = () => {
    try {
      if (window !== window.parent) {
        setShowPrintWarning(true);
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  const exportExcel = () => {
    let csvContent = "Date,In,Out,Status,Worked (hrs),OT (hrs),Total (INR)\n";
    monthlyRecords.forEach(r => {
      const pay = getDailyAmount(r);
      const inTime = r.checkIn ? formatTime12h(r.checkIn) : '--';
      const outTime = r.checkOut ? formatTime12h(r.checkOut) : '--';
      csvContent += `${formatDate(r.date)},${inTime},${outTime},${r.status.toUpperCase()},${(r.totalHours || 0).toFixed(2)},${(r.otHours || 0).toFixed(2)},${Math.round(pay)}\n`;
    });
    
    csvContent += `\nSUMMARY,,,,,\n`;
    csvContent += `Basic Monthly Salary,${activeMonthlySalary},,,,\n`;
    csvContent += `Total OT Pay,${Math.round(stats.otEarnings)},,,,\n`;
    csvContent += `Total Deductions,${Math.round(stats.deductions)},,,,\n`;
    csvContent += `NET PAYABLE,${Math.round(stats.netSalary)},,,,\n`;

    downloadCSV(csvContent, `${employee.name}_${selectedMonth}_Payroll.csv`);
  };

  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('print-area');
    const pdfContent = document.getElementById('pdf-content');
    if (!printArea || !pdfContent) return;
    
    setIsGeneratingPDF(true);
    
    const originalClasses = printArea.className;
    printArea.className = "fixed inset-0 bg-white text-black z-[9999] overflow-auto block py-8";
    
    const opt = {
      margin:       0,
      filename:     `${employee.name}_Salary_Statement_${selectedMonth}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 1024 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await html2pdf().set(opt).from(pdfContent).save();
    } catch (error) {
      console.error("PDF generation failed", error instanceof Error ? error.message : String(error));
    } finally {
      printArea.className = originalClasses;
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 print:space-y-0 print:pb-0 print:m-0 print:p-0">
      {/* Selector Section */}
      <div className="glass p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-500/10 text-sky-400 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <FileText size={20} className="sm:size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight">Payroll Reports</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Cycle: {selectedMonth}</p>
          </div>
        </div>
        
        {/* Tactile Month Selector with Left/Right chevrons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button 
            onClick={handlePrevMonth}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-300 transition-all shrink-0"
            title="Previous Month"
          >
            <ChevronLeft size={16} className="sm:size-[18px]" />
          </button>
          
          <div className="relative flex-1 md:w-48">
            <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none sm:size-[18px]" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="w-full bg-slate-950 border border-white/10 rounded-lg sm:rounded-xl pl-9 pr-4 py-2 sm:py-3 text-white font-bold text-xs sm:text-sm outline-none focus:border-sky-500 transition-all cursor-pointer text-center" 
            />
          </div>

          <button 
            onClick={handleNextMonth}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-300 transition-all shrink-0"
            title="Next Month"
          >
            <ChevronRight size={16} className="sm:size-[18px]" />
          </button>
        </div>
      </div>

      {/* Main Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 print:hidden">
        {/* Net Payout Widget */}
        <div className="glass p-3 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between shadow-lg md:col-span-6 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-3 sm:gap-6 relative z-10">
            <div className="w-11 h-11 sm:w-16 sm:h-16 bg-emerald-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
               <Wallet size={22} className="sm:size-8" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5 sm:mb-1">Net Payout (Calculated)</p>
              <h4 className="text-2xl sm:text-4xl font-black text-white tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</h4>
            </div>
          </div>
        </div>
        
        {/* Responsive Quick Action Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:col-span-6">
          <button 
            onClick={exportExcel} 
            className="glass px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-500/10 active:scale-95 transition-all group"
          >
            <FileSpreadsheet size={14} className="text-emerald-400 sm:size-6" />
            <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest text-center leading-none">Excel</span>
          </button>

          <button 
            onClick={handlePrint} 
            className="glass px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-2 hover:bg-sky-500/10 active:scale-95 transition-all group"
          >
            <Printer size={14} className="text-sky-400 sm:size-6" />
            <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest text-center leading-none">Print</span>
          </button>

          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPDF} 
            className="glass px-2 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-2 hover:bg-indigo-500/10 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 size={14} className="text-indigo-400 animate-spin sm:size-6" />
            ) : (
              <Download size={14} className="text-indigo-400 sm:size-6" />
            )}
            <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest text-center leading-none">
              {isGeneratingPDF ? 'Wait...' : 'PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Status Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 print:hidden select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mr-2 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-white/5">
            <SlidersHorizontal size={10} /> Filter:
          </span>
          
          {[
            { id: 'All', label: 'All Days', count: monthlyRecords.length },
            { id: 'Duty', label: 'Duty', count: monthlyRecords.filter(r => r.status === 'Duty' || r.status === 'Half-Day').length },
            { id: 'Absent', label: 'Absents', count: monthlyRecords.filter(r => r.status === 'Absent' || r.status === 'Unpaid').length },
            { id: 'Leaves', label: 'Leaves / Offs', count: monthlyRecords.filter(r => ['SL', 'PL', 'CL', 'Holiday', 'Weekly Off'].includes(r.status)).length },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id as any)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all duration-200 flex items-center gap-2 active:scale-95 shrink-0 ${
                statusFilter === btn.id
                  ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/15 font-black'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
              }`}
            >
              <span>{btn.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                statusFilter === btn.id ? 'bg-slate-950/20 text-slate-950' : 'bg-white/5 text-slate-500'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Screen List View (Desktop style Table) */}
      <div className="hidden md:block glass rounded-2xl border border-white/5 overflow-hidden print:hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">In</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Out</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Worked (hrs)</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">OT (hrs)</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Daily Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.map(r => {
                const dailyTotal = getDailyAmount(r);
                return (
                  <tr key={r.date} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-4 text-xs font-mono text-white/60">{formatDate(r.date)}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white/40">{r.checkIn ? formatTime12h(r.checkIn) : '--'}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white/40">{r.checkOut ? formatTime12h(r.checkOut) : '--'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'Duty' ? 'bg-emerald-500/10 text-emerald-400' : 
                        ['Absent', 'Unpaid'].includes(r.status) ? 'bg-rose-500/10 text-rose-400' : 
                        r.status === 'Pending' ? 'bg-slate-500/10 text-slate-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-white text-center">
                      {r.totalHours ? r.totalHours.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-amber-500 text-center">
                      {r.otHours ? r.otHours.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-sky-400 text-right">₹{Math.round(dailyTotal).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 text-xs italic font-medium">
                    No attendance records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (Gorgeously styled and optimized) */}
      <div className="block md:hidden space-y-3 print:hidden">
        {filteredRecords.map(r => {
          const dailyTotal = getDailyAmount(r);
          const hasNotes = !!r.notes;
          
          const statusConfig: Record<string, { bg: string, text: string, border: string, label: string }> = {
            'Duty': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'On Duty' },
            'Half-Day': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Half Day' },
            'Absent': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'Absent' },
            'Unpaid': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'Unpaid' },
            'Weekly Off': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Weekly Off' },
            'Holiday': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Holiday' },
            'Pending': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', label: 'Pending' },
            'SL': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', label: 'Sick Leave' },
            'PL': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', label: 'Privilege Leave' },
            'CL': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', label: 'Casual Leave' },
          };

          const cfg = statusConfig[r.status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', label: r.status };
          
          const dateObj = new Date(r.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

          return (
            <div 
              key={r.date} 
              className="glass rounded-xl p-3 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shadow-md active:bg-white/[0.04] transition-all space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{dayName}</span>
                    <span className="text-sm font-black text-white leading-none">{dayNum}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{dayNum} {monthName} {year}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Attendance Log</p>
                  </div>
                </div>
                
                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Punch Timeline</span>
                  <p className="text-[10px] font-bold text-white/80">
                    {r.checkIn ? formatTime12h(r.checkIn) : '--'} → {r.checkOut ? formatTime12h(r.checkOut) : '--'}
                  </p>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Earnings</span>
                  <p className="text-[10px] font-black text-sky-400 font-mono">
                    ₹{Math.round(dailyTotal).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1">
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-slate-500" />
                  <span>Regular: <strong className="font-mono text-white">{r.totalHours ? r.totalHours.toFixed(1) : '0.0'}h</strong></span>
                </div>

                {(r.otHours || 0) > 0 && (
                  <div className="flex items-center gap-1 text-sky-400">
                    <Zap size={10} className="text-sky-400 animate-pulse" />
                    <span>Overtime: <strong className="font-mono">{r.otHours ? r.otHours.toFixed(1) : '0.0'}h</strong></span>
                  </div>
                )}
              </div>

              {hasNotes && (
                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5 text-[9px] text-slate-400 italic">
                  Note: {r.notes}
                </div>
              )}
            </div>
          );
        })}
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs italic font-medium leading-relaxed border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
            No matching logs found for this filter.
          </div>
        )}
      </div>

      {/* COMPACT PRINT-ONLY A4 TEMPLATE */}
      <div id="print-area" className="hidden print:flex print:justify-center bg-white text-black z-[9999] print:m-0 print:p-0">
        <div id="pdf-content" className="w-[21cm] h-[29.7cm] mx-auto bg-[#ffffff] pt-[2cm] pb-[2cm] pl-[1.5cm] pr-[1.5cm] flex flex-col relative overflow-hidden box-border">
            {/* Header */}
            <div className="h-[2.5cm] flex justify-between items-start flex-none">
               <div className="flex flex-col">
                  <h1 className="text-[22px] font-bold text-[#111111] leading-none m-0 p-0">SALARY STATEMENT</h1>
                  <div className="flex items-center gap-2 mt-[0.3cm]">
                    <span className="bg-black text-white text-[10px] font-bold px-[6px] py-[2px] rounded-sm leading-none">OFFICIAL RECORD</span>
                    <span className="text-[#333333] text-[10px] leading-none">Billing Cycle: {selectedMonth}</span>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <h2 className="text-[18px] font-bold text-[#0B7DBD] leading-none m-0 p-0">ATTENDIFY</h2>
                  <p className="text-[9px] text-[#666666] leading-none mt-1 m-0 p-0">ENTERPRISE CLOUD SYSTEM</p>
                  <p className="text-[9px] text-[#666666] leading-none mt-1 m-0 p-0">Gen: {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
               </div>
            </div>

            {/* Horizontal Line */}
            <div className="h-[1px] bg-[#222222] w-full mt-[0.4cm] mb-[0.4cm] flex-none"></div>

            {/* Employee and Summary Section */}
            <div className="h-[3.8cm] flex justify-between flex-none mb-[0.4cm]">
               {/* Left Card */}
               <div className="w-[8.7cm] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] p-[0.4cm] box-border flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-[#666666] m-0 p-0 leading-none">EMPLOYEE IDENTITY</p>
                  <p className="text-[14px] font-bold text-[#111111] m-0 p-0 leading-none mt-1">{employee.name}</p>
                  
                  <div className="grid grid-cols-2 gap-x-2 mt-2">
                    <div>
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">EMPLOYEE ID</p>
                      <p className="text-[10px] text-[#111111] m-0 p-0 leading-none mt-0.5">{employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">DESIGNATION</p>
                      <p className="text-[10px] text-[#111111] m-0 p-0 leading-none mt-0.5">{employee.role}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">ORGANIZATION</p>
                    <p className="text-[10px] text-[#0B7DBD] font-bold m-0 p-0 leading-none mt-0.5 truncate">{user?.companyName || 'N/A'}</p>
                  </div>
               </div>

               {/* Right Card */}
               <div className="w-[8.7cm] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] p-[0.4cm] box-border flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-[#666666] m-0 p-0 leading-none">ATTENDANCE SUMMARY</p>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">CYCLE DAYS</p>
                      <p className="text-[14px] font-bold text-[#111111] m-0 p-0 leading-none text-right">{employee.workingDaysPerMonth || 26}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">PRESENT</p>
                      <p className="text-[14px] font-bold text-[#111111] m-0 p-0 leading-none text-right">{pdfStats.presentDays}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">OT ACCRUED</p>
                      <p className="text-[14px] font-bold text-[#111111] m-0 p-0 leading-none text-right">{pdfStats.totalOTHours.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-[#777777] m-0 p-0 leading-none">ABSENTS</p>
                      <p className="text-[14px] font-bold text-[#111111] m-0 p-0 leading-none text-right">{pdfStats.absentDays + pdfStats.halfDays * 0.5}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Attendance Ledger Table */}
            <div className="flex-1 flex flex-col border border-[#E5E7EB] rounded-[6px] overflow-hidden mb-[0.4cm]">
                <div className="flex bg-[#F3F4F6] text-[#333333] text-[10px] font-bold border-b border-[#E5E7EB]">
                  <div className="w-[2.5cm] px-[0.2cm] py-[0.2cm] text-left">DATE</div>
                  <div className="w-[2.2cm] px-[0.2cm] py-[0.2cm] text-center">IN</div>
                  <div className="w-[2.2cm] px-[0.2cm] py-[0.2cm] text-center">OUT</div>
                  <div className="w-[3cm] px-[0.2cm] py-[0.2cm] text-center">STATUS</div>
                  <div className="w-[2.5cm] px-[0.2cm] py-[0.2cm] text-right">WORKED</div>
                  <div className="w-[2cm] px-[0.2cm] py-[0.2cm] text-right">OT</div>
                  <div className="w-[3.6cm] px-[0.2cm] py-[0.2cm] text-right">TOTAL ₹</div>
                </div>
                <div className="flex-1 flex flex-col divide-y divide-[#E5E7EB]">
                    {pdfMonthlyRecords.map(r => {
                      const dailyTotal = getDailyAmount(r);
                      return (
                          <div key={r.date} className="flex text-[9px] text-[#111111] items-center" style={{ minHeight: rowHeight }}>
                            <div className="w-[2.5cm] px-[0.2cm] py-[1px] text-left">{formatDate(r.date)}</div>
                            <div className="w-[2.2cm] px-[0.2cm] py-[1px] text-center">{r.checkIn ? formatTime12h(r.checkIn) : '--'}</div>
                            <div className="w-[2.2cm] px-[0.2cm] py-[1px] text-center">{r.checkOut ? formatTime12h(r.checkOut) : '--'}</div>
                            <div className="w-[3cm] px-[0.2cm] py-[1px] text-center flex justify-center">
                              <span className={`px-[4px] py-[1px] rounded-[2px] font-bold uppercase ${
                                r.status === 'Duty' ? 'bg-green-100 text-green-800' : 
                                ['Absent', 'Unpaid'].includes(r.status) ? 'bg-red-100 text-red-800' : 
                                r.status === 'Holiday' ? 'bg-blue-100 text-blue-800' :
                                r.status === 'Weekly Off' ? 'bg-teal-100 text-teal-800' :
                                r.status === 'Pending' ? 'bg-gray-200 text-gray-800' : 'bg-sky-100 text-sky-800'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <div className="w-[2.5cm] px-[0.2cm] py-[1px] text-right tabular-nums">{(r.totalHours || 0).toFixed(2)}</div>
                            <div className="w-[2cm] px-[0.2cm] py-[1px] text-right tabular-nums">{(r.otHours || 0).toFixed(2)}</div>
                            <div className="w-[3.6cm] px-[0.2cm] py-[1px] text-right tabular-nums font-bold">₹{Math.round(dailyTotal)}</div>
                          </div>
                      );
                    })}
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="h-[3.2cm] flex justify-between items-start flex-none pt-[0.4cm]">
                <div className="flex flex-col w-[8.7cm]">
                    <p className="text-[11px] font-bold text-[#111111] m-0 p-0 leading-none mb-2">BREAKDOWN DETAIL</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#333333]">Base Monthly Salary:</span>
                        <span className="font-bold text-[#111111] tabular-nums">₹{activeMonthlySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#333333]">Overtime Compensation:</span>
                        <span className="font-bold text-green-700 tabular-nums">+₹{Math.round(pdfStats.otEarnings).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#333333]">Deductions:</span>
                        <span className="font-bold text-red-700 tabular-nums">-₹{Math.round(pdfStats.deductions).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#666666] mt-2 m-0 p-0 leading-none">Cycle: {employee.workingDaysPerMonth || 26}d. OT: ₹{pdfStats.appliedOTRate || 0}/hr.</p>
                </div>
                <div className="w-[8.5cm] h-[2.5cm] bg-gradient-to-r from-[#0B7DBD] to-[#0A5C8A] rounded-[6px] flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <p className="text-[10px] m-0 p-0 leading-none opacity-90">NET PAYABLE AMOUNT</p>
                    <p className="text-[26px] font-bold m-0 p-0 leading-none mt-1 tabular-nums">₹{Math.round(pdfStats.netSalary).toLocaleString()}</p>
                    <p className="text-[9px] m-0 p-0 leading-none mt-1 opacity-80">VERIFIED STATEMENT</p>
                </div>
            </div>

            {/* Footer */}
            <div className="h-[1.2cm] flex justify-between items-end flex-none pb-[0.2cm]">
                <div className="flex flex-col">
                  <p className="text-[8px] text-[#777777] m-0 p-0 leading-none mb-0.5">AUDIT ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                  <p className="text-[8px] text-[#777777] m-0 p-0 leading-none">SYSTEM GENERATED - NO PHYSICAL SIGNATURE REQUIRED</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-[4cm] border-b border-[#333333] mb-1"></div>
                  <p className="text-[9px] text-[#333333] m-0 p-0 leading-none">AUTHORIZED SIGNATORY</p>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: 100vh !important;
            width: 100vw !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            height: 297mm !important;
            display: block !important;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {showPrintWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Printing Disabled in Preview</h3>
            <p className="text-slate-400 text-sm mb-6">
              The browser preview blocks direct printing. To print this report, please click the <strong>"Open in new tab"</strong> button at the top right of the screen, or use the <strong>"Download PDF"</strong> button instead.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPrintWarning(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all">
                Close
              </button>
              <button onClick={() => { setShowPrintWarning(false); handleDownloadPDF(); }} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;