import React, { useState } from 'react';
import { AttendanceRecord, Employee, User } from './types.ts';
import { 
  FileText, 
  Calendar, 
  Wallet, 
  Printer
} from 'lucide-react';
import { calculateSalary } from './utils.ts';

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

  return (
    <div className="space-y-6 pb-24">
      {/* Selector Section */}
      <div className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Financial Reports</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Month: {selectedMonth}</p>
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

      {/* Salary Summary Card */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
             <Wallet size={32} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Net Payable (Calculated)</p>
            <h4 className="text-4xl font-black text-white tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</h4>
          </div>
        </div>
        <button onClick={handlePrint} className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl flex items-center gap-3 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20">
           <Printer size={18} />
           Generate PDF Slip
        </button>
      </div>

      {/* Main Table Content */}
      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Punch In/Out</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">OT (Hrs)</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Pay ₹</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlyRecords.map(r => {
                const dailyTotal = getDailyAmount(r);
                return (
                  <tr key={r.date} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-4 text-xs font-mono text-white/60">{r.date}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white/40">
                      {r.checkIn || '--'} → {r.checkOut || '--'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'Duty' ? 'bg-emerald-500/10 text-emerald-400' : 
                        ['Absent', 'Unpaid'].includes(r.status) ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-amber-500 text-center">
                      {r.otHours ? r.otHours.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-sky-400 text-right">₹{Math.round(dailyTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY TEMPLATE - Optimized A4 */}
      <div id="print-area" className="hidden print:block fixed inset-0 bg-white text-black z-[9999]">
        <div className="p-10 max-w-[210mm] mx-auto">
            <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
               <div>
                  <h1 className="text-4xl font-black uppercase leading-none">Salary Slip</h1>
                  <p className="text-sm font-bold text-slate-600 mt-2">Billing Cycle: {selectedMonth}</p>
               </div>
               <div className="text-right">
                  <h2 className="text-2xl font-black text-sky-600">ATTENDIFY</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise HR System</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8 border-b border-slate-200 pb-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Information</p>
                  <p className="text-lg font-black">{employee.name}</p>
                  <p className="text-sm">ID: {employee.employeeId}</p>
                  <p className="text-sm">Role: {employee.role}</p>
                  <p className="text-sm">Company: {user?.companyName || 'N/A'}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Context</p>
                  <p className="text-sm"><strong>Working Cycle:</strong> {employee.workingDaysPerMonth || 26} Days</p>
                  <p className="text-sm"><strong>Present Days:</strong> {stats.presentDays}</p>
                  <p className="text-sm"><strong>Absents/Unpaid:</strong> {stats.absentDays + stats.halfDays * 0.5}</p>
               </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 mb-8">
                <thead>
                    <tr className="bg-slate-100">
                      <th className="py-2 px-3 border border-slate-300 text-[10px] font-black uppercase">Date</th>
                      <th className="py-2 px-3 border border-slate-300 text-[10px] font-black uppercase">Status</th>
                      <th className="py-2 px-3 border border-slate-300 text-[10px] font-black uppercase">OT</th>
                      <th className="py-2 px-3 border border-slate-300 text-[10px] font-black uppercase text-right">Amount ₹</th>
                    </tr>
                </thead>
                <tbody>
                    {monthlyRecords.map(r => {
                      const dailyTotal = getDailyAmount(r);
                      return (
                          <tr key={r.date}>
                            <td className="py-1 px-3 border border-slate-300 text-[10px] font-mono">{r.date}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[10px] font-bold uppercase">{r.status}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[10px]">{(r.otHours || 0).toFixed(2)}</td>
                            <td className="py-1 px-3 border border-slate-300 text-[10px] font-black text-right">₹{Math.round(dailyTotal)}</td>
                          </tr>
                      );
                    })}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 border-t-2 border-black pt-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Earnings Breakdown</p>
                    <div className="flex justify-between text-sm mb-1"><span>Basic Salary:</span> <strong>₹{employee.monthlySalary.toLocaleString()}</strong></div>
                    <div className="flex justify-between text-sm text-emerald-600 mb-1"><span>Overtime Pay:</span> <strong>+₹{Math.round(stats.otEarnings).toLocaleString()}</strong></div>
                    <div className="flex justify-between text-sm text-rose-600"><span>Absence Deductions:</span> <strong>-₹{Math.round(stats.deductions).toLocaleString()}</strong></div>
                </div>
                <div className="bg-sky-600 text-white p-8 rounded-2xl flex flex-col justify-center items-center shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Net Payable</span>
                    <span className="text-5xl font-black">₹{Math.round(stats.netSalary).toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-20 flex justify-between border-t border-slate-200 pt-8 opacity-50">
                <p className="text-[8px] font-bold uppercase tracking-widest">Generated via Attendify Cloud • {new Date().toLocaleString()}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-right">Signature Required _________________</p>
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
