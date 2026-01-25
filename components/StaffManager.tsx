
import React, { useState, useRef, useMemo } from 'react';
import { Employee, User } from '../types';
import { 
  Plus, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  X, 
  ShieldCheck, 
  Wallet, 
  Clock, 
  Briefcase,
  Calendar,
  Watch,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square
} from 'lucide-react';

interface Props {
  employees: Employee[];
  users: User[];
  globalWeeklyOffs: number[];
  onAdd: (e: Employee, u: User) => void;
  onUpdate: (e: Employee, u: User | null) => void;
  onDelete: (id: string) => void;
}

const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// Comprehensive list of available modules for permission setting
const AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'calendar', label: 'Attendance' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'reports', label: 'Reports' },
  { id: 'staff', label: 'Staff Manager (Admin Only)' },
  { id: 'approvals', label: 'Leave Approvals' },
  { id: 'settings', label: 'Settings' }
];

const StaffManager: React.FC<Props> = ({ employees, users, globalWeeklyOffs, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Robust unique ID generation
  const nextEmployeeId = useMemo(() => {
    if (employees.length === 0) return 'EMP-001';
    const numericIds = employees
      .map(e => {
        const parts = e.employeeId.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : 0;
      })
      .filter(n => !isNaN(n));
    
    if (numericIds.length === 0) return 'EMP-001';
    const maxId = Math.max(...numericIds);
    return `EMP-${(maxId + 1).toString().padStart(3, '0')}`;
  }, [employees]);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff Member',
    salary: 30000,
    otRate: 200,
    dailyHours: 8.5,
    sl: 12, pl: 15, cl: 10,
    notes: '',
    joinedDate: getTodayStr(),
    weeklyOffs: globalWeeklyOffs,
    username: '',
    password: '',
    accessibleTabs: ['dashboard', 'calendar', 'leaves']
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'Staff Member',
      salary: 30000,
      otRate: 200,
      dailyHours: 8.5,
      sl: 12, pl: 15, cl: 10,
      notes: '',
      joinedDate: getTodayStr(),
      weeklyOffs: globalWeeklyOffs,
      username: '',
      password: '',
      accessibleTabs: ['dashboard', 'calendar', 'leaves']
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const internalId = editingEmployee?.id || Date.now().toString();
    const publicId = editingEmployee?.employeeId || nextEmployeeId;

    const newEmp: Employee = {
      id: internalId,
      employeeId: publicId,
      name: formData.name,
      role: formData.role,
      monthlySalary: formData.salary,
      otRate: formData.otRate,
      dailyWorkHours: formData.dailyHours,
      joinedDate: formData.joinedDate,
      weeklyOffs: formData.weeklyOffs,
      quotas: { SL: formData.sl, PL: formData.pl, CL: formData.cl },
      notes: formData.notes
    };

    const linkedUser = users.find(u => u.linkedEmployeeId === internalId);
    const newUser: User = {
      id: linkedUser?.id || `user-${Date.now()}`,
      username: formData.username,
      password: formData.password,
      fullName: formData.name,
      role: formData.accessibleTabs.includes('staff') ? 'admin' : 'employee',
      accessibleTabs: formData.accessibleTabs,
      linkedEmployeeId: internalId,
      provider: 'credentials'
    };

    if (editingEmployee) onUpdate(newEmp, newUser);
    else onAdd(newEmp, newUser);
    
    setShowModal(false);
    setEditingEmployee(null);
    resetForm();
  };

  const handleEdit = (emp: Employee) => {
    const linkedUser = users.find(u => u.linkedEmployeeId === emp.id);
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      salary: emp.monthlySalary,
      otRate: emp.otRate,
      dailyHours: emp.dailyWorkHours,
      sl: emp.quotas.SL, pl: emp.quotas.PL, cl: emp.quotas.CL,
      notes: emp.notes || '',
      joinedDate: emp.joinedDate ? emp.joinedDate.split('T')[0] : getTodayStr(),
      weeklyOffs: emp.weeklyOffs || globalWeeklyOffs,
      username: linkedUser?.username || '',
      password: linkedUser?.password || '',
      accessibleTabs: linkedUser?.accessibleTabs || ['dashboard', 'calendar', 'leaves']
    });
    setShowModal(true);
  };

  const toggleTab = (tabId: string) => {
    const current = formData.accessibleTabs;
    const updated = current.includes(tabId)
      ? current.filter(id => id !== tabId)
      : [...current, tabId];
    setFormData({ ...formData, accessibleTabs: updated });
  };

  const toggleDay = (day: number) => {
    const current = formData.weeklyOffs;
    const updated = current.includes(day) 
      ? current.filter(d => d !== day) 
      : [...current, day];
    setFormData({...formData, weeklyOffs: updated});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading">Staff Directory</h2>
          <p className="text-slate-500 text-sm">Create and manage accounts for your team</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setEditingEmployee(null); resetForm(); }}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-sky-500/30 active:scale-95"
        >
          <Plus size={18} /> Add New Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {employees.length > 0 ? (
          employees.map(emp => (
            <div key={emp.id} className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-sky-400 border border-white/5 shadow-inner">
                  <UserIcon size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg leading-tight">{emp.name}</h4>
                    <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-white/5 font-mono font-bold tracking-wider">{emp.employeeId}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">{emp.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(emp)} className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all border border-sky-500/20"><Edit2 size={16} /></button>
                <button onClick={() => { if(window.confirm(`Permanently delete account and all records for ${emp.name}?`)) onDelete(emp.id); }} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 glass p-12 rounded-3xl border border-white/5 text-center italic text-slate-600">No registered staff found.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-2xl p-8 rounded-[2rem] border border-sky-500/30 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400">{editingEmployee ? <Edit2 size={24} /> : <Plus size={24} />}</div>
                <div>
                  <h3 className="text-2xl font-bold font-heading">{editingEmployee ? 'Edit' : 'Setup New'} Staff Member</h3>
                  <p className="text-slate-500 text-xs">Credentials, Permissions and Profile</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Credentials & Access */}
              <div className="glass-dark p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-2 text-sky-400">
                  <Lock size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Login & Permissions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username</label>
                    <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" placeholder="User login ID" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-sky-500" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Module Access (Selected items will appear in User's menu)</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TABS.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => toggleTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          formData.accessibleTabs.includes(tab.id)
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                            : 'bg-slate-900 border-white/5 text-slate-600'
                        }`}
                      >
                        {formData.accessibleTabs.includes(tab.id) ? <CheckSquare size={12} /> : <Square size={12} />}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal & Professional Profile */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Briefcase size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Professional Profile</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Employee ID (Read-only)</label>
                    <input readOnly value={editingEmployee?.employeeId || nextEmployeeId} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-slate-500 font-mono font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Job Designation</label>
                    <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Monthly Salary</label>
                    <input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">OT Rate/Hr</label>
                    <input type="number" value={formData.otRate} onChange={e => setFormData({...formData, otRate: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Weekly Offs</label>
                    <div className="flex gap-1">
                      {DAYS_SHORT.map((day, idx) => (
                        <button 
                          key={`off-${idx}`} 
                          type="button" 
                          onClick={() => toggleDay(idx)}
                          className={`flex-1 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${formData.weeklyOffs.includes(idx) ? 'bg-sky-500 text-white' : 'bg-slate-900 border border-white/10 text-slate-500'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Daily Work Hours</label>
                    <input type="number" step="0.5" value={formData.dailyHours} onChange={e => setFormData({...formData, dailyHours: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/30 transition-all active:scale-95">
                  {editingEmployee ? 'Apply Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
