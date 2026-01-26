import React from 'react';
import { LeaveRequest, Employee } from '../types.ts';
import { Check, X, Clock, Calendar } from 'lucide-react';

interface Props {
  requests: LeaveRequest[];
  employees: Employee[];
  onApprove: (req: LeaveRequest) => void;
  onReject: (id: string) => void;
}

const LeaveApproval: React.FC<Props> = ({ requests, employees, onApprove, onReject }) => {
  const pending = requests.filter(r => r.status === 'Pending').sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading">Leave Requests</h2>
        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
          {pending.length} Pending
        </span>
      </div>

      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl border border-white/5 italic text-slate-500">
            No pending leave requests at the moment.
          </div>
        ) : (
          pending.map(req => {
            const emp = employees.find(e => e.id === req.employeeId);
            return (
              <div key={req.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-right duration-300">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{emp?.name || 'Unknown Staff'}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        req.type === 'Unpaid' ? 'bg-slate-500/10 text-slate-400 border-white/10' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {req.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Requested from {req.startDate} to {req.endDate}</p>
                    <p className="text-sm bg-white/5 p-3 rounded-xl italic border border-white/5">"{req.reason}"</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => onApprove(req)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-white"
                  >
                    <Check size={18} /> Approve
                  </button>
                  <button 
                    onClick={() => onReject(req.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                  >
                    <X size={18} /> Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History section */}
      <div className="mt-12">
        <h3 className="text-lg font-bold font-heading mb-4 text-slate-400">Request History</h3>
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5 shadow-xl">
          {requests.filter(r => r.status !== 'Pending').slice(0, 10).map(req => {
            const emp = employees.find(e => e.id === req.employeeId);
            return (
              <div key={req.id} className="p-4 flex items-center justify-between text-sm hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{emp?.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    req.type === 'Unpaid' ? 'bg-slate-800 text-slate-500' : 'bg-sky-500/10 text-sky-500'
                  }`}>
                    {req.type}
                  </span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span className="text-slate-400 text-xs">{req.startDate}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  req.status === 'Approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}>
                  {req.status}
                </span>
              </div>
            );
          })}
          {requests.filter(r => r.status !== 'Pending').length === 0 && (
             <p className="p-8 text-center text-slate-500 text-sm italic">No history records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;