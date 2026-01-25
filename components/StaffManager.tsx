
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

const StaffManager: React.FC<Props> = ({ 
  employees = [], 
  users = [], 
  globalWeeklyOffs = [0], 
  globalWorkingDays = 26, 
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const nextEmployeeId = useMemo(() => {
    if (!employees || employees.length === 0) return 'EMP-001';
    
    const numericIds = employees
      .map(e => {
        if (!e.employeeId || typeof e.employeeId !== 'string') return 0;
        const parts = e.employeeId.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return `EMP-${(maxId + 1).toString().padStart(3, '0')}`;
  }, [employees]);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff Member',
    salary: '30000',
    otRate: '200',
    dailyHours: '8.5',
    workingDays: globalWorkingDays.toString(),
    sl: '12', 
    pl: '15', 
    cl: '10',
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
      workingDays: globalWorkingDays.toString(),
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

    const linkedUser = users.find(u => u.linkedEmployeeId === internalId);
    
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
      name: emp.name || '',
      role: emp.role || 'Staff Member',
      salary: (emp.monthlySalary || 30000).toString(),
      otRate: (emp.otRate || 200).toString(),
      dailyHours: (emp.dailyWorkHours || 8.5).toString(),
      workingDays: (emp.workingDaysPerMonth || globalWorkingDays).toString(),
      sl: (emp.quotas?.SL || 0).toString(), 
      pl: (emp.quotas?.PL || 0).toString(), 
      cl: (emp.quotas?.CL || 0).toString(),
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
    <div className="space-y-6 min-h-[500px] w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Staff Directory</h2>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Manage access & job roles</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setEditingEmployee(null); resetForm(); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 px-6 py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-white uppercase tracking-wider"
        >
          <Plus size={18} /> Register Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {employees && employees.length > 0 ? (
          employees.map(emp => {
            const user = users.find(u => u.linkedEmployeeId === emp.id);
            return (
              <div key={emp.id} className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-xl bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5 shadow-inner shrink-0 ${user?.role === 'admin' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {user?.role === 'admin' ? <ShieldCheck size={24} /> : <UserIcon size={24} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base leading-tight truncate text-white">{emp.name}</h4>
                      {user?.role === 'admin' && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider shrink-0">Admin</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 truncate">{emp.role} • {emp.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleEdit(emp)} className="p-3 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all border border-sky-500/20"><Edit2 size={16} /></button>
                  <button onClick={() => { if(window.confirm(`Are you sure you want to delete ${emp.name}?`)) onDelete(emp.id); }} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 glass-dark p-20 rounded-[3rem] border border-white/5 text-center flex flex-col items-center gap-6 bg-white/5">
            <div className="p-6 bg-white/5 rounded-full text-slate-700 shadow-inner">
               <UserIcon size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-lg">No Staff Registered</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em]">Add members to start tracking</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-2xl p-6 sm:p-10 rounded-[2.5rem] border border-sky-500/30 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/20 rounded-2xl text-sky-400 shadow-lg shadow-sky-500/10">{editingEmployee ? <Edit2 size={24} /> : <Plus size={24} />}</div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-white">{editingEmployee ? 'Edit Profile' : 'New Registration'}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Employee Data & Credentials</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="glass-dark p-6 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Lock size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Security Login</h4>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black border transition-all uppercase tracking-widest ${formData.isAdmin ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-500 border-white/10'}`}
                  >
                    {formData.isAdmin ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                    {formData.isAdmin ? 'Admin' : 'Staff'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Username</label>
                    <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 text-sm shadow-inner" placeholder="Login ID" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white focus:outline-none focus:border-sky-500 text-sm shadow-inner" 
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {!formData.isAdmin && (
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Module Access Control</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TABS.map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => toggleTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-bold border transition-all ${
                            formData.accessibleTabs.includes(tab.id)
                              ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-lg shadow-sky-500/5'
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

              <div className="space-y-5">
                <div className="flex items-center gap-2 text-amber-400 border-b border-white/5 pb-2">
                  <Briefcase size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Employment Details</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Employee Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 text-sm shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Monthly CTC (Salary)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">₹</span>
                      <input 
                        type="number" 
                        value={formData.salary} 
                        onChange={e => setFormData({...formData, salary: e.target.value})} 
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white text-sm shadow-inner" 
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-tighter">OT / Hr</label>
                    <input 
                      type="number" 
                      value={formData.otRate} 
                      onChange={e => setFormData({...formData, otRate: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-tighter">Shift (H)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={formData.dailyHours} 
                      onChange={e => setFormData({...formData, dailyHours: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Work Cycle</label>
                    <select 
                      value={formData.workingDays} 
                      onChange={e => setFormData({...formData, workingDays: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 appearance-none text-sm shadow-inner"
                    >
                      {[26, 27, 28, 29, 30, 31].map(d => (
                        <option key={d} value={d}>{d} Days / Month</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Fixed Off Days</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DAYS_SHORT.map((day, idx) => (
                      <button 
                        key={`off-${idx}`} 
                        type="button" 
                        onClick={() => toggleDay(idx)}
                        className={`min-w-[44px] h-11 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${formData.weeklyOffs.includes(idx) ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-900 border border-white/10 text-slate-500'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-2">
                  <Palmtree size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Paid Leave Balance</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">PL (Privilege)</label>
                    <input 
                      type="number" 
                      value={formData.pl} 
                      onChange={e => setFormData({...formData, pl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">SL (Sick)</label>
                    <input 
                      type="number" 
                      value={formData.sl} 
                      onChange={e => setFormData({...formData, sl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">CL (Casual)</label>
                    <input 
                      type="number" 
                      value={formData.cl} 
                      onChange={e => setFormData({...formData, cl: e.target.value})} 
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-[1.5rem] shadow-2xl shadow-sky-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs">
                  <Check size={20} /> {editingEmployee ? 'Save Changes' : 'Confirm Registration'}
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
