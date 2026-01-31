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
      {/* Selector Section */}
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

      {/* Main Stats Bento */}
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

      {/* Screen List View */}
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

      {/* OVERHAULED PRINT-ONLY A4 TEMPLATE */}
      <div id="print-area" className="hidden print:block fixed inset-0 bg-white text-black z-[9999] p-8">
        <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm]">
            {/* Elegant Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
               <div>
                  <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-2">Salary Statement</h1>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">Official Record</span>
                    <span className="text-slate-500 text-[10px] font-bold">Billing Cycle: {selectedMonth}</span>
                  </div>
               </div>
               <div className="text-right">
                  <h2 className="text-2xl font-black text-sky-600 tracking-tighter">ATTENDIFY</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise Cloud System</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-1">Generated on: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* Profile & Stats Bento Layout */}
            <div className="grid grid-cols-2 gap-6 mb-10">
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Employee Identity</p>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-slate-950">{employee.name}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Employee ID</p>
                        <p className="text-sm font-bold">{employee.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Designation</p>
                        <p className="text-sm font-bold">{employee.role}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Organization</p>
                      <p className="text-sm font-bold text-sky-600">{user?.companyName || 'N/A'}</p>
                    </div>
                  </div>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Attendance Summary</p>
                  <div className="grid grid-cols-2 gap-y-4">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Working Days</p>
                        <p className="text-lg font-black">{employee.workingDaysPerMonth || 26}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Present Days</p>
                        <p className="text-lg font-black text-emerald-600">{stats.presentDays}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">OT Accrued</p>
                        <p className="text-lg font-black text-amber-500">{stats.totalOTHours.toFixed(2)} Hrs</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Absent/Leaves</p>
                        <p className="text-lg font-black text-rose-500">{stats.absentDays + stats.halfDays * 0.5}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Attendance Ledger Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-10 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Date</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">In</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Out</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">Worked</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">OT</th>
                          <th className="py-3 px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">Total ₹</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {monthlyRecords.map(r => {
                          const dailyTotal = getDailyAmount(r);
                          return (
                              <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-4 text-[10px] font-mono font-bold text-slate-500">{r.date}</td>
                                <td className="py-2.5 px-4 text-[10px] font-bold">{formatTime12h(r.checkIn)}</td>
                                <td className="py-2.5 px-4 text-[10px] font-bold">{formatTime12h(r.checkOut)}</td>
                                <td className="py-2.5 px-4">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                    r.status === 'Duty' ? 'bg-emerald-100 text-emerald-700' : 
                                    ['Absent', 'Unpaid'].includes(r.status) ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-[10px] font-bold text-center">{(r.totalHours || 0).toFixed(2)}</td>
                                <td className="py-2.5 px-4 text-[10px] font-bold text-amber-600 text-center">{(r.otHours || 0).toFixed(2)}</td>
                                <td className="py-2.5 px-4 text-[10px] font-black text-right text-slate-900">₹{Math.round(dailyTotal)}</td>
                              </tr>
                          );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Earnings Final Card */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-900">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Breakdown Detail</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">Base Monthly Salary:</span>
                        <span className="font-black">₹{employee.monthlySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-600">
                        <span className="font-bold">Overtime Compensation:</span>
                        <span className="font-black">+₹{Math.round(stats.otEarnings).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-rose-600">
                        <span className="font-bold">Leave/Absent Deductions:</span>
                        <span className="font-black">-₹{Math.round(stats.deductions).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                      <p className="text-[9px] text-slate-500 font-bold italic">Note: Salary calculation based on a {employee.workingDaysPerMonth || 26}-day cycle. OT is calculated at {employee.otRate || (employee.monthlySalary / (employee.workingDaysPerMonth || 26) / 8).toFixed(0)} INR per hour.</p>
                    </div>
                </div>
                <div className="bg-sky-600 text-white p-10 rounded-[2.5rem] flex flex-col justify-center items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wallet size={80} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-3 relative z-10">Net Payable Amount</span>
                    <span className="text-6xl font-black tracking-tighter relative z-10">₹{Math.round(stats.netSalary).toLocaleString()}</span>
                    <div className="mt-6 flex items-center gap-2 px-4 py-1 bg-white/20 rounded-full relative z-10">
                      <span className="text-[9px] font-black uppercase tracking-widest">Payment Status: Verified</span>
                    </div>
                </div>
            </div>

            {/* Footer with Authenticity */}
            <div className="mt-20 flex justify-between items-end opacity-60">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest">Attendify Cloud Audit ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">System Generated Statement - No physical signature required</p>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900">Authorized Signature</p>
                </div>
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Reports;