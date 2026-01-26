
import React, { useState } from 'react';
import { AttendanceRecord, Employee, User } from './types.ts';
import { 
  Download, 
  FileText, 
  Calendar, 
  Wallet, 
  FileSpreadsheet, 
  FileJson, 
  Printer, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  BadgeCheck 
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

  const getHeaderInfo = () => {
    return [
      `REPORT PERIOD: ${selectedMonth}`,
      `EMPLOYEE ID: ${employee.employeeId}`,
      `NAME: ${employee.name}`,
      `COMPANY: ${user?.companyName || 'N/A'}`,
      `EMAIL: ${user?.email || 'N/A'}`,
      `PHONE: ${user?.phone || 'N/A'}`,
      `GENERATED: ${new Date().toLocaleString()}`,
      ""
    ].join('\n');
  };

  const getTableCSV = () => {
    let csv = "Date,Status,Hours,OT,Notes\n";
    monthlyRecords.forEach(r => {
      csv += `${r.date},${r.status},${r.totalHours || 0},${r.otHours || 0},"${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    return csv;
  };

  const exportCSV = () => {
    const fullData = getHeaderInfo() + "\n" + getTableCSV();
    downloadCSV(fullData, `${employee.name}_${selectedMonth}_Report.csv`);
  };

  const exportExcel = () => {
    // Basic CSV formatted with .xls extension often opens correctly in Excel with tab/comma handling
    const fullData = getHeaderInfo() + "\n" + getTableCSV();
    downloadCSV(fullData, `${employee.name}_${selectedMonth}_Report.xls`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Configuration & Selection */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-white/5">
             <FileText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Export Center</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Multi-Format Telemetry</p>
          </div>
        </div>
        
        <div className="relative group w-full md:w-auto">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-12 py-4 text-white font-black text-sm outline-none focus:border-sky-500 transition-all cursor-pointer shadow-2xl" 
          />
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500 opacity-50" />
        </div>
      </div>

      {/* Export Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={exportExcel} className="glass group p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent hover:scale-[1.02] transition-all flex flex-col items-center text-center">
           <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 text-emerald-400 shadow-inner group-hover:scale-110 transition-transform"><FileSpreadsheet size={32} /></div>
           <h4 className="text-lg font-black text-white uppercase">Download Excel</h4>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Structured Spreadsheet</p>
        </button>

        <button onClick={exportCSV} className="glass group p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-sky-500/10 to-transparent hover:scale-[1.02] transition-all flex flex-col items-center text-center">
           <div className="p-4 bg-sky-500/10 rounded-2xl mb-4 text-sky-400 shadow-inner group-hover:scale-110 transition-transform"><Download size={32} /></div>
           <h4 className="text-lg font-black text-white uppercase">Download CSV</h4>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Raw Data Values</p>
        </button>

        <button onClick={handlePrint} className="glass group p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-rose-500/10 to-transparent hover:scale-[1.02] transition-all flex flex-col items-center text-center">
           <div className="p-4 bg-rose-500/10 rounded-2xl mb-4 text-rose-400 shadow-inner group-hover:scale-110 transition-transform"><Printer size={32} /></div>
           <h4 className="text-lg font-black text-white uppercase">Download PDF</h4>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Professional Document</p>
        </button>
      </div>

      {/* Summary Stat */}
      <div className="glass p-10 rounded-[3.5rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-emerald-500/10 rounded-3xl text-emerald-400 shadow-inner"><Wallet size={40} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mb-1">Total Net Salary</p>
            <h4 className="text-5xl font-black text-white tracking-tighter">₹{Math.round(stats.netSalary).toLocaleString()}</h4>
          </div>
        </div>
        <div className="text-center sm:text-right">
           <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Records Found</p>
           <p className="text-3xl font-black text-sky-400">{monthlyRecords.length}</p>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="glass rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hours</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">OT</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlyRecords.map((r) => (
                <tr key={r.date} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5 font-mono text-xs text-white/70">{r.date}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === 'Duty' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-white/60">{r.totalHours || '-'}</td>
                  <td className="px-8 py-5 text-sm font-bold text-amber-500">{r.otHours ? `+${r.otHours}` : '-'}</td>
                  <td className="px-8 py-5 text-[10px] text-slate-500 italic truncate max-w-[200px]">"{r.notes || 'No entry'}"</td>
                </tr>
              ))}
              {monthlyRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">No records for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print-Only Template (PDF) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[99999] overflow-y-auto">
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
           <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Attendance Report</h1>
              <p className="text-xl font-bold text-slate-600 mt-2">{selectedMonth}</p>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-sky-600">ATTENDIFY</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest">CLOUD MANAGEMENT SYSTEM</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Profile</p>
              <p className="text-lg"><strong>Name:</strong> {employee.name}</p>
              <p className="text-lg"><strong>ID:</strong> {employee.employeeId}</p>
              <p className="text-lg"><strong>Company:</strong> {user?.companyName || 'N/A'}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Identity</p>
              <p className="text-lg"><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p className="text-lg"><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
           </div>
        </div>

        <table className="w-full text-left border-collapse mb-12">
           <thead>
              <tr className="border-b-2 border-black bg-slate-100">
                 <th className="py-4 px-4 font-black uppercase text-sm">Date</th>
                 <th className="py-4 px-4 font-black uppercase text-sm">Status</th>
                 <th className="py-4 px-4 font-black uppercase text-sm">Hours</th>
                 <th className="py-4 px-4 font-black uppercase text-sm">OT</th>
                 <th className="py-4 px-4 font-black uppercase text-sm">Notes</th>
              </tr>
           </thead>
           <tbody>
              {monthlyRecords.map(r => (
                 <tr key={r.date} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-sm font-mono">{r.date}</td>
                    <td className="py-3 px-4 text-sm font-bold uppercase">{r.status}</td>
                    <td className="py-3 px-4 text-sm">{r.totalHours || '-'}</td>
                    <td className="py-3 px-4 text-sm font-bold text-sky-700">{r.otHours ? `+${r.otHours}` : '-'}</td>
                    <td className="py-3 px-4 text-sm italic text-slate-600 truncate max-w-[200px]">{r.notes}</td>
                 </tr>
              ))}
           </tbody>
        </table>

        <div className="grid grid-cols-3 gap-8 bg-slate-50 p-12 rounded-[2rem] border border-slate-200">
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Gross Salary</p>
              <p className="text-3xl font-black">₹{employee.monthlySalary.toLocaleString()}</p>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total OT</p>
              <p className="text-3xl font-black text-emerald-600">+₹{Math.round(stats.otEarnings).toLocaleString()}</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Net Payable</p>
              <p className="text-4xl font-black text-sky-600">₹{Math.round(stats.netSalary).toLocaleString()}</p>
           </div>
        </div>

        <div className="mt-20 flex justify-between pt-10 border-t border-slate-200">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SYSTEM VERIFIED DOCUMENT - GENERATED ON {new Date().toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAGE 1 OF 1</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
