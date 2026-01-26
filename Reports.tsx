import React, { useState } from 'react';
import { AttendanceRecord, Employee } from './types.ts';
import { Download, FileText, Calendar, Wallet } from 'lucide-react';
import { calculateSalary, downloadCSV } from './utils.ts';

interface Props {
  employee: Employee;
  records: AttendanceRecord[];
}

const Reports: React.FC<Props> = ({ employee, records }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const monthlyRecords = records.filter(r => r.date.startsWith(selectedMonth)).sort((a,b) => a.date.localeCompare(b.date));
  const stats = calculateSalary(monthlyRecords, employee);

  const exportMonthly = () => {
    let csv = `Employee: ${employee.name},Month: ${selectedMonth}\n`;
    csv += "Date,Status,In,Out,Hours,OT,Notes\n";
    monthlyRecords.forEach(r => {
      csv += `${r.date},${r.status},${r.checkIn || ''},${r.checkOut || ''},${r.totalHours || 0},${r.otHours || 0},"${r.notes || ''}"\n`;
    });
    downloadCSV(csv, `${employee.name}_Report_${selectedMonth}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold">Statements</h2><p className="text-slate-500 text-sm">{employee.name} • Monthly Report</p></div>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={exportMonthly} className="glass p-6 rounded-3xl border border-white/5 hover:border-sky-500/50 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-xl"><FileText className="text-sky-400" /></div>
            <div className="text-left"><h4 className="font-bold">Download CSV</h4><p className="text-[10px] text-slate-500 font-bold uppercase">{monthlyRecords.length} records</p></div>
          </div>
          <Download size={20} className="text-slate-600 group-hover:text-sky-400" />
        </button>
        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl"><Wallet className="text-emerald-400" /></div>
          <div><h4 className="font-bold text-emerald-400">₹{Math.round(stats.netSalary).toLocaleString()}</h4><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Net Payable</p></div>
        </div>
      </div>

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 font-bold text-slate-400 uppercase tracking-tighter">
              <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Hrs</th><th className="px-6 py-4">OT</th><th className="px-6 py-4">Notes</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlyRecords.length > 0 ? monthlyRecords.map(r => (
                <tr key={r.date} className="hover:bg-white/5">
                  <td className="px-6 py-4 font-mono">{r.date}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'Duty' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>{r.status}</span></td>
                  <td className="px-6 py-4">{r.totalHours || '-'}</td>
                  <td className="px-6 py-4 text-amber-400">{r.otHours || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{r.notes}</td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No records for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;