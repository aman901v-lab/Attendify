
import React, { useState, useMemo } from 'react';
import { Employee, User } from '../types';
import { 
  Plus, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  X, 
  ShieldCheck, 
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Check,
  HeartPulse,
  Palmtree,
  Coffee
} from 'lucide-react';

interface Props {
  employees: Employee[];
  users: User[];
  globalWeeklyOffs: number[];
  globalWorkingDays: number;
  onAdd: (e: Employee, u: User) => void;
  onUpdate: (e: Employee, u: User | null) => void;
  onDelete: (id: string) => void;
}

const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const AVAILABLE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'calendar', label: 'Attendance' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'reports', label: 'Reports' },
  { id: 'staff', label: 'Staff Manager' },
  { id: 'approvals', label: 'Leave Approvals' },
  { id: 'settings', label: 'Settings' }
];

const StaffManager: React.FC<Props> = ({ employees, users, globalWeeklyOffs, globalWorkingDays, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

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
    salary: '30000' as string | number,
    otRate: '200' as string | number,
    dailyHours: '8.5' as string | number,
    workingDays: globalWorkingDays as string | number,
    sl: '12' as string | number, 
    pl: '15' as string | number, 
    cl: '10' as string | number,
    notes: '',
    joinedDate: getTodayStr(),
    weeklyOffs: globalWeeklyOffs,
    username: '',
    password: '',
    isAdmin: false,
    accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports']
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'Staff Member',
      salary: '30000',
      otRate: '200',
      dailyHours: '8.5',
      workingDays: globalWorkingDays,
      sl: '12', pl: '15', cl: '10',
      notes: '',
      joinedDate: getTodayStr(),
      weeklyOffs: globalWeeklyOffs,
      username: '',
      password: '',
      isAdmin: false,
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports']
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
      monthlySalary: Number(formData.salary) || 0,
      otRate: Number(formData.otRate) || 0,
      dailyWorkHours: Number(formData.dailyHours) || 0,
      workingDaysPerMonth: Number(formData.workingDays) || 26,
      joinedDate: formData.joinedDate,
      weeklyOffs: formData.weeklyOffs,
      quotas: { 
        SL: Number(formData.sl) || 0, 
        PL: Number(formData.pl) || 0, 
        CL: Number(formData.cl) || 0 
      },
      notes: formData.notes
    };

    const linkedUser = users.find(u => u.linkedEmployeeId === internalId || (u.username === formData.username));
    
    const newUser: User = {
      id: linkedUser?.id || `user-${Date.now()}`,
      username: formData.username,
      password: formData.password || linkedUser?.password || '123456',
      fullName: formData.name,
      role: formData.isAdmin ? 'admin' : 'employee',
      accessibleTabs: formData.isAdmin 
        ? ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings']
        : formData.accessibleTabs,
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
      workingDays: emp.workingDaysPerMonth || globalWorkingDays,
      sl: emp.quotas.SL, 
      pl: emp.quotas.PL, 
      cl: emp.quotas.CL,
      notes: emp.notes || '',
      joinedDate: emp.joinedDate ? emp.joinedDate.split('T')[0] : getTodayStr(),
      weeklyOffs: emp.weeklyOffs || globalWeeklyOffs,
      username: linkedUser?.username || '',
      password: linkedUser?.password || '',
      isAdmin: linkedUser?.role === 'admin',
      accessibleTabs: linkedUser?.accessibleTabs || ['dashboard', 'calendar', 'leaves', 'reports']
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
          <p className="text-slate-500 text-sm">Manage employee profiles and system access</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setEditingEmployee(null); resetForm(); }}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-sky-500/30 active:scale-95"
        >
          <Plus size={18} /> Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {employees.length > 0 ? (
          employees.map(emp => {
            const user = users.find(u => u.linkedEmployeeId === emp.id);
            return (
              <div key={emp.id} className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5 shadow-inner ${user?.role === 'admin' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {user?.role === 'admin' ? <ShieldCheck size={28} /> : <UserIcon size={28} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg leading-tight">{emp.name}</h4>
                      {user?.role === 'admin' && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider">Admin</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">{emp.role} • {emp.employeeId}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(emp)} className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all border border-sky-500/20"><Edit2 size={16} /></button>
                  <button onClick={() => { if(window.confirm(`Delete ${emp.name}?`)) onDelete(emp.id); }} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })
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
                  <h3 className="text-2xl font-bold font-heading">{editingEmployee ? 'Edit' : 'Create'} Staff Member</h3>
                  <p className="text-slate-500 text-xs">Profile & Access Control</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-dark p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Lock size={16} />
                    <h4 className="text-xs font-bold uppercase tracking-widest">Portal Access</h4>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${formData.isAdmin ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-800 text-slate-500 border-white/10'}`}
                  >
                    {formData.isAdmin ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                    {formData.isAdmin ? 'Admin Access Granted' : 'Standard User Access'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username (Login ID)</label>
                    <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" placeholder="e.g. rahul_admin" />
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
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {!formData.isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Module Access</label>
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
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Briefcase size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Job Configuration</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Employee Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Monthly Salary (CTC)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm">₹</span>
                      <input 
                        type="number" 
                        value={formData.salary} 
                        onChange={e => setFormData({...formData, salary: e.target.value})} 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white" 
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">OT Rate / Hour</label>
                    <input 
                      type="number" 
                      value={formData.otRate} 
                      onChange={e => setFormData({...formData, otRate: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Work Shift (Hrs)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={formData.dailyHours} 
                      onChange={e => setFormData({...formData, dailyHours: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Working Days/Month</label>
                    <select 
                      value={formData.workingDays} 
                      onChange={e => setFormData({...formData, workingDays: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 appearance-none transition-all"
                    >
                      {[26, 27, 28, 29, 30, 31].map(d => (
                        <option key={d} value={d}>{d} Days Cycle</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Weekly Offs</label>
                  <div className="flex gap-1">
                    {DAYS_SHORT.map((day, idx) => (
                      <button 
                        key={`off-${idx}`} 
                        type="button" 
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${formData.weeklyOffs.includes(idx) ? 'bg-sky-500 text-white' : 'bg-slate-900 border border-white/10 text-slate-500'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leave Quota Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Palmtree size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Annual Leave Quotas (Paid Days)</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <Palmtree size={10} className="text-emerald-400" /> PL (Paid)
                    </label>
                    <input 
                      type="number" 
                      value={formData.pl} 
                      onChange={e => setFormData({...formData, pl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <HeartPulse size={10} className="text-rose-400" /> SL (Sick)
                    </label>
                    <input 
                      type="number" 
                      value={formData.sl} 
                      onChange={e => setFormData({...formData, sl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <Coffee size={10} className="text-purple-400" /> CL (Casual)
                    </label>
                    <input 
                      type="number" 
                      value={formData.cl} 
                      onChange={e => setFormData({...formData, cl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500" 
                      placeholder="0" 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Check size={20} /> {editingEmployee ? 'Apply Changes' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
