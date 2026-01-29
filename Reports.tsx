
import React, { useState } from 'react';
import { AttendanceRecord, Employee, User } from './types.ts';
import { 
  Download, 
  FileText, 
  Calendar, 
  Wallet, 
  FileSpreadsheet, 
  Printer, 
  ArrowRight
} from 'lucide-react';
import { calculateSalary, downloadCSV } from './utils.ts';

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
    const dailySalary = employee.monthlySalary / (employee.workingDaysPerMonth || 26);
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

  const getHeaderInfo = () => {
    return [
      `MONTHLY STATEMENT: ${selectedMonth}`,
      `---------------------------------`,
      `EMPLOYEE ID: ${employee.employeeId}`,
      `FULL NAME: ${employee.name}`,
      `COMPANY: ${user?.companyName || 'N/A'}`,
      `EMAIL: ${user?.email || 'N/A'}`,
      `PHONE: ${user?.phone || 'N/A'}`,
      `---------------------------------`,
      ""
    ].join('\n');
  };

  const getTableData = () => {
    let csv = "Date,In,Out,Status,Worked (hrs),OT (hrs),Total ₹\n";
    monthlyRecords.forEach(r => {
      const dailyTotal = getDailyAmount(r);
      csv += `${r.date},${r.checkIn || '-'},${r.checkOut || '-'},${r.status},${r.totalHours || 0},${r.otHours || 0},${Math.round(dailyTotal)}\n`;
    });
    return csv;
  };

  const exportCSV = () => {
    const data = getHeaderInfo() + getTableData();
    downloadCSV(data, `${employee.name}_${selectedMonth}_Report.csv`);
  };

  const exportExcel = () => {
    const data = getHeaderInfo() + getTableData();
    downloadCSV(data, `${employee.name}_${selectedMonth}_Report.xls`);
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
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Report Generator</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Billing Month: {selectedMonth}</p>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={exportExcel} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 hover:bg-emerald-500/10 transition-all group">
           <FileSpreadsheet size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Excel Export</span>
        </button>
        <button onClick={exportCSV} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 hover:bg-sky-500/10 transition-all group">
           <Download size={32} className="text-sky-500 group-hover:scale-110 transition-transform" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">CSV Export</span>
        </button>
        <button onClick={handlePrint} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 hover:bg-rose-500/10 transition-all group">
           <Printer size={32} className="text-rose-500 group-hover:scale-110 transition-transform" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Print / Save PDF</span>
        </button>
      </div>

      {/* Salary Summary Card */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
             <Wallet size={32} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Monthly Payable (EST.)</p>
            <h4 className="text-4xl font-black text-white tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</h4>
          </div>
        </div>
        <div className="text-center md:text-right">
           <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Cycle Performance</div>
           <div className="text-2xl font-black text-sky-400 mt-1">{monthlyRecords.length} Records</div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">In</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Out</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Worked (hrs)</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">OT (hrs)</th>
                <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Total ₹</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlyRecords.map(r => {
                const dailyTotal = getDailyAmount(r);
                return (
                  <tr key={r.date} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-4 text-xs font-mono text-white/60">{r.date}</td>
                    <td className="px-5 py-4 text-xs font-bold text-white/40">{r.checkIn || '-'}</td>
                    <td className="px-5 py-4 text-xs font-bold text-white/40">{r.checkOut || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'Duty' ? 'bg-emerald-500/10 text-emerald-400' : 
                        ['Absent', 'Unpaid'].includes(r.status) ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-white/70">{r.totalHours || '-'}</td>
                    <td className="px-5 py-4 text-xs font-bold text-amber-500">{r.otHours ? `+${r.otHours}` : '-'}</td>
                    <td className="px-5 py-4 text-xs font-black text-sky-400">₹{Math.round(dailyTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {monthlyRecords.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">No records found for this month</p>
            </div>
          )}
        </div>
      </div>

      {/* PRINT-ONLY TEMPLATE */}
      <div id="print-area" className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[9999] overflow-visible">
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
           <div>
              <h1 className="text-4xl font-black uppercase leading-none">Attendance Report</h1>
              <p className="text-lg font-bold text-slate-500 mt-2">Billing Cycle: {selectedMonth}</p>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-sky-600">ATTENDIFY</h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Employee Statement</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
           <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Details</p>
              <p className="text-base"><strong>Name:</strong> {employee.name}</p>
              <p className="text-base"><strong>Emp ID:</strong> {employee.employeeId}</p>
              <p className="text-base"><strong>Company:</strong> {user?.companyName || 'N/A'}</p>
           </div>
           <div className="space-y-1 text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Info</p>
              <p className="text-base"><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p className="text-base"><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
           </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
           <thead>
              <tr className="border-y-2 border-black bg-slate-50">
                 <th className="py-4 px-3 font-black uppercase text-[10px]">Date</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">In</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">Out</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">Status</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">Worked</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">OT</th>
                 <th className="py-4 px-3 font-black uppercase text-[10px]">Total ₹</th>
              </tr>
           </thead>
           <tbody>
              {monthlyRecords.map(r => {
                 const dailyTotal = getDailyAmount(r);
                 return (
                    <tr key={r.date} className="border-b border-slate-200">
                       <td className="py-3 px-3 text-[10px] font-mono">{r.date}</td>
                       <td className="py-3 px-3 text-[10px]">{r.checkIn || '-'}</td>
                       <td className="py-3 px-3 text-[10px]">{r.checkOut || '-'}</td>
                       <td className="py-3 px-3 text-[10px] font-bold uppercase">{r.status}</td>
                       <td className="py-3 px-3 text-[10px]">{r.totalHours || '0'}</td>
                       <td className="py-3 px-3 text-[10px] font-bold">{r.otHours || '0'}</td>
                       <td className="py-3 px-3 text-[10px] font-black">₹{Math.round(dailyTotal)}</td>
                    </tr>
                 );
              })}
           </tbody>
        </table>

        <div className="grid grid-cols-3 gap-8 bg-slate-50 p-10 rounded-3xl border border-slate-200 mt-auto">
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Salary</p>
              <p className="text-2xl font-black">₹{employee.monthlySalary.toLocaleString()}</p>
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">OT & Earnings</p>
              <p className="text-2xl font-black text-emerald-600">+₹{Math.round(stats.otEarnings).toLocaleString()}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Net Payout</p>
              <p className="text-4xl font-black text-sky-600">₹{Math.round(stats.netSalary).toLocaleString()}</p>
           </div>
        </div>

        <div className="mt-20 flex justify-between pt-8 border-t border-slate-200 opacity-50">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SYSTEM GENERATED DOCUMENT • {new Date().toLocaleString()}</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase">AUTHENTICATED NODES</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; overflow: visible !important; height: auto !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important;
            background: white !important;
            color: black !important;
          }
          @page { size: auto; margin: 10mm; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
