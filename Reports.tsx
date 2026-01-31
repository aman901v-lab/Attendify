import React, { useState } from 'react';
import { AttendanceRecord, Employee, User } from './types.ts';
import { 
  FileText, 
  Calendar, 
  Wallet, 
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { calculateSalary, downloadCSV, formatTime12h } from './utils.ts';

interface Props {
  employee: Employee;
  records: AttendanceRecord[];
  user?: User;
}

const Reports: React.FC<Props> = ({ employee, records, user }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const monthlyRecords = records
    .filter(r => r.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  const stats = calculateSalary(monthlyRecords, employee);

  const getDailyAmount = (record: AttendanceRecord) => {
    const workingDays = employee.workingDaysPerMonth || 26;
    const dailySalary = employee.monthlySalary / workingDays;
    const hourlyRate = dailySalary / 8;
    const otRate = employee.otRate || hourlyRate;

    if (record.status === 'Duty') {
      return dailySalary + ((record.otHours || 0) * otRate);
    } else if (record.status === 'Half-Day') {
      return (dailySalary / 2) + ((record.otHours || 0) * otRate);
    } else if (['SL', 'PL', 'CL', 'Holiday', 'Weekly Off'].includes(record.status)) {
      return dailySalary;
    }
    return 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const exportExcel = () => {
    let csvContent = "Date,In,Out,Status,Worked (hrs),OT (hrs),Total (INR)\n";
    monthlyRecords.forEach(r => {
      const pay = getDailyAmount(r);
      const inTime = formatTime12h(r.checkIn);
      const outTime = formatTime12h(r.checkOut);
      csvContent += `${r.date},${inTime},${outTime},${r.status},${(r.totalHours || 0).toFixed(2)},${(r.otHours || 0).toFixed(2)},${Math.round(pay)}\n`;
    });
    
    csvContent += `\nSUMMARY,,,,,\n`;
    csvContent += `Basic Monthly Salary,${employee.monthlySalary},,,,\n`;
    csvContent += `Total OT Pay,${Math.round(stats.otEarnings)},,,,\n`;
    csvContent += `Total Deductions,${Math.round(stats.deductions)},,,,\n`;
    csvContent += `NET PAYABLE,${Math.round(stats.netSalary)},,,,\n`;

    downloadCSV(csvContent, `${employee.name}_${selectedMonth}_Payroll.csv`);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Payroll Reports</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Cycle: {selectedMonth}</p>
          </div>
        </div>
        <div className="relative group w-full md:w-auto">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" />
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-white font-bold text-sm outline-none focus:border-sky-500 transition-all cursor-pointer" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between shadow-xl">
           <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
               <Wallet size={32} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Net Payout (Calculated)</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</h4>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportExcel} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 transition-all group">
            <FileSpreadsheet size={32} className="text-emerald-500 group-hover:scale-110 transition-all" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Excel Export</span>
          </button>
          <button onClick={handlePrint} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-sky-500/10 transition-all group">
            <Printer size={32} className="text-sky-500 group-hover:scale-110 transition-all" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">In</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Out</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Worked (hrs)</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">OT (hrs)</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Total ₹</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlyRecords.map(r => {
                const dailyTotal = getDailyAmount(r);
                return (
                  <tr key={r.date} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 text-xs font-mono text-white/60">{r.date}</td>
                    <td className="px-4 py-4 text-[10px] font-bold text-white/40">{formatTime12h(r.checkIn)}</td>
                    <td className="px-4 py-4 text-[10px] font-bold text-white/40">{formatTime12h(r.checkOut)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'Duty' ? 'bg-emerald-500/10 text-emerald-400' : 
                        ['Absent', 'Unpaid'].includes(r.status) ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-white text-center">
                      {r.totalHours ? r.totalHours.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-amber-500 text-center">
                      {r.otHours ? r.otHours.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 text-xs font-black text-sky-400 text-right">₹{Math.round(dailyTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY A4 TEMPLATE */}
      <div id="print-area" className="hidden print:block fixed inset-0 bg-white text-black z-[9999]">
        <div className="p-10 max-w-[210mm] mx-auto border-2 border-black">
            <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
               <div>
                  <h1 className="text-4xl font-black uppercase leading-none">Salary Statement</h1>
                  <p className="text-sm font-bold text-slate-600 mt-2">Billing Period: {selectedMonth}</p>
               </div>
               <div className="text-right">
                  <h2 className="text-2xl font-black text-sky-600">ATTENDIFY</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Cloud System</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8 border-b border-slate-200 pb-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Profile</p>
                  <p className="text-lg font-black">{employee.name}</p>
                  <p className="text-sm">ID: {employee.employeeId}</p>
                  <p className="text-sm">Position: {employee.role}</p>
                  <p className="text-sm">Company: {user?.companyName || 'N/A'}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Stats</p>
                  <p className="text-sm"><strong>Cycle Days:</strong> {employee.workingDaysPerMonth || 26}</p>
                  <p className="text-sm"><strong>Present Count:</strong> {stats.presentDays} Days</p>
                  <p className="text-sm"><strong>OT Accrued:</strong> {stats.totalOTHours.toFixed(2)} Hrs</p>
               </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 mb-8">
                <thead>
                    <tr className="bg-slate-100">
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase">Date</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase">In</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase">Out</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase">Status</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase text-center">Worked (hrs)</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase text-center">OT (hrs)</th>
                      <th className="py-2 px-3 border border-slate-300 text-[9px] font-black uppercase text-right">Total ₹</th>
                    </tr>
                </thead>
                <tbody>
                    {monthlyRecords.map(r => {
                      const dailyTotal = getDailyAmount(r);
                      return (
                          <tr key={r.date}>
                            <td className="py-1 px-3 border border-slate-300 text-[9px] font-mono">{r.date}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px]">{formatTime12h(r.checkIn)}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px]">{formatTime12h(r.checkOut)}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px] font-bold uppercase">{r.status}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px] text-center">{(r.totalHours || 0).toFixed(2)}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px] text-center">{(r.otHours || 0).toFixed(2)}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[9px] font-black text-right">₹{Math.round(dailyTotal)}</td>
                          </tr>
                      );
                    })}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 border-t-2 border-black pt-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Earnings Breakdown</p>
                    <div className="flex justify-between text-sm mb-1"><span>Base Monthly:</span> <strong>₹{employee.monthlySalary.toLocaleString()}</strong></div>
                    <div className="flex justify-between text-sm text-emerald-600 mb-1"><span>Extra OT Pay:</span> <strong>+₹{Math.round(stats.otEarnings).toLocaleString()}</strong></div>
                    <div className="flex justify-between text-sm text-rose-600"><span>Absent Deductions:</span> <strong>-₹{Math.round(stats.deductions).toLocaleString()}</strong></div>
                </div>
                <div className="bg-sky-600 text-white p-8 rounded-2xl flex flex-col justify-center items-center shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Net Payable Amount</span>
                    <span className="text-5xl font-black">₹{Math.round(stats.netSalary).toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-16 flex justify-between border-t border-slate-200 pt-8 opacity-50">
                <p className="text-[8px] font-bold uppercase tracking-widest">Generated via Attendify • {new Date().toLocaleString()}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-right">Authorized Signature _________________</p>
            </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          body * { visibility: hidden !important; overflow: visible !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: 100% !important;
            display: block !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;