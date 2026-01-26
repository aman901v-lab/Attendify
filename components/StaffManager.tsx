import React, { useState, useMemo } from 'react';
import { Employee, User } from '../types.ts';
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
  Stethoscope,
  Sun,
  Zap,
  Building2,
  CalendarDays,
  Mail,
  Phone
} from 'lucide-react';

interface Props {
  employees: Employee[];
  users: User[];
  globalWeeklyOffs: number[];
  globalWorkingDays: number;
  onAdd: (e: Employee, u: User) => void;
  onUpdate: (e: Employee, u: User | null) => void;
  onDelete: (id: string) => void;
  currentUser: User;
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
  onDelete,
  currentUser
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const nextEmployeeId = useMemo(() => {
    if (!employees || employees.length === 0) return 'EMP-001';
    const numericIds = employees.map(e => {
        if (!e.employeeId || typeof e.employeeId !== 'string') return 0;
        const parts = e.employeeId.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : 0;
      }).filter(n => !isNaN(n) && n > 0);
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return `EMP-${(maxId + 1).toString().padStart(3, '0')}`;
  }, [employees]);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff Member',
    salary: '30000',
    otRate: '200',
    dailyHours: '8.5',
    workingDays: '26',
    sl: '12', 
    pl: '15', 
    cl: '10',
    notes: '',
    joinedDate: getTodayStr(),
    weeklyOffs: globalWeeklyOffs,
    username: '',
    password: '',
    isAdmin: false,
    accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports'],
    companyName: '',
    companyJoinedDate: getTodayStr(),
    email: '',
    phone: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'Staff Member',
      salary: '30000',
      otRate: '200',
      dailyHours: '8.5',
      workingDays: '26',
      sl: '12', pl: '15', cl: '10',
      notes: '',
      joinedDate: getTodayStr(),
      weeklyOffs: globalWeeklyOffs,
      username: '',
      password: '',
      isAdmin: false,
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports'],
      companyName: '',
      companyJoinedDate: getTodayStr(),
      email: '',
      phone: ''
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
    const cleanUsername = formData.username.toLowerCase().trim();
    
    const newUser: User = {
      id: linkedUser?.id || `user-${Date.now()}`,
      username: cleanUsername,
      password: formData.password || linkedUser?.password || '123456',
      fullName: formData.name,
      role: formData.isAdmin ? 'admin' : 'employee',
      accessibleTabs: formData.isAdmin 
        ? ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings']
        : formData.accessibleTabs,
      linkedEmployeeId: internalId,
      provider: 'credentials',
      companyName: formData.companyName,
      companyJoinedDate: formData.companyJoinedDate,
      email: formData.email,
      phone: formData.phone,
      emailVerified: linkedUser?.emailVerified ?? false,
      phoneVerified: linkedUser?.phoneVerified ?? false
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
      workingDays: (emp.workingDaysPerMonth || 26).toString(),
      sl: (emp.quotas?.SL || 0).toString(), 
      pl: (emp.quotas?.PL || 0).toString(), 
      cl: (emp.quotas?.CL || 0).toString(),
      notes: emp.notes || '',
      joinedDate: emp.joinedDate ? emp.joinedDate.split('T')[0] : getTodayStr(),
      weeklyOffs: emp.weeklyOffs || globalWeeklyOffs,
      username: linkedUser?.username || '',
      password: linkedUser?.password || '',
      isAdmin: linkedUser?.role === 'admin',
      accessibleTabs: linkedUser?.accessibleTabs || ['dashboard', 'calendar', 'leaves', 'reports'],
      companyName: linkedUser?.companyName || '',
      companyJoinedDate: linkedUser?.companyJoinedDate || emp.joinedDate || getTodayStr(),
      email: linkedUser?.email || '',
      phone: linkedUser?.phone || ''
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
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setFormData({...formData, weeklyOffs: updated});
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-6 rounded-[2.5rem] border border-white/5">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Staff Management</h2>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Register and manage team access</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setEditingEmployee(null); resetForm(); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 px-6 py-4 rounded-2xl font-black text-xs transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-white uppercase tracking-wider"
        >
          <Plus size={18} /> Register Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {employees.map(emp => {
            const user = users.find(u => u.linkedEmployeeId === emp.id);
            const isSelf = user?.id === currentUser.id;
            const isMaster = user?.username === 'aman.verma';
            const deletable = !isSelf && !isMaster;

            return (
              <div key={emp.id} className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-sky-500/20 transition-all shadow-lg bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner shrink-0 ${user?.role === 'admin' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {user?.role === 'admin' ? <ShieldCheck size={24} /> : <UserIcon size={24} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base leading-tight truncate text-white">{emp.name}</h4>
                      {user?.role === 'admin' && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase tracking-widest shrink-0">Admin</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1 truncate">{emp.role} • {emp.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleEdit(emp)} className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-sky-500 hover:text-white transition-all border border-white/10" title="Edit Profile">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    disabled={!deletable}
                    onClick={() => { if(window.confirm(`Delete ${emp.name}? This cannot be undone.`)) onDelete(emp.id); }} 
                    className={`p-3 rounded-xl transition-all border ${deletable ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20' : 'bg-slate-950 text-slate-700 border-white/5 cursor-not-allowed opacity-50'}`}
                    title={isSelf ? "Self-account cannot be deleted" : "Delete Staff"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
        })}
        {employees.length === 0 && (
          <div className="md:col-span-2 py-24 text-center glass rounded-[3rem] border border-white/5">
             <UserIcon size={48} className="mx-auto text-slate-800 mb-4" />
             <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Staff directory is empty</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-2xl p-6 sm:p-10 rounded-[2.5rem] border border-sky-500/30 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black font-heading text-white uppercase tracking-tight">{editingEmployee ? 'Update Profile' : 'Staff Registration'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Lock size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Login Credentials</h4>
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})} className={`px-4 py-2 rounded-xl text-[9px] font-black border uppercase tracking-widest transition-all ${formData.isAdmin ? 'bg-amber-600 text-white border-amber-500 shadow-lg' : 'bg-slate-900 text-slate-500 border-white/10'}`}>
                    {formData.isAdmin ? 'Privileged Admin' : 'Standard Member'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm outline-none" placeholder="Username / Login ID" />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white focus:border-sky-500 text-sm outline-none" placeholder="Password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-sky-500 text-sm outline-none" placeholder="Email Address" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-sky-500 text-sm outline-none" placeholder="Phone Number" />
                  </div>
                </div>
                {!formData.isAdmin && (
                  <div className="space-y-3 pt-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Visible Modules:</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TABS.map(tab => (
                        <button key={tab.id} type="button" onClick={() => toggleTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black border transition-all ${formData.accessibleTabs.includes(tab.id) ? 'bg-sky-500 text-white border-sky-400' : 'bg-slate-950 border-white/5 text-slate-700'}`}>{tab.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400 border-b border-white/5 pb-2"><Briefcase size={16} /><h4 className="text-[10px] font-black uppercase tracking-widest">Job Particulars</h4></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm outline-none" placeholder="Full Employee Name" />
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">₹</span>
                    <input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white text-sm outline-none" placeholder="Monthly Salary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-sm outline-none focus:border-sky-500" placeholder="Current Company Name" />
                  </div>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="date" value={formData.companyJoinedDate} onChange={e => setFormData({...formData, companyJoinedDate: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-sm outline-none focus:border-sky-500" title="Current Company Joined Date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <select value={formData.workingDays} onChange={e => setFormData({...formData, workingDays: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold appearance-none outline-none">
                      {[26, 27, 28, 29, 30, 31].map(d => <option key={d} value={d}>{d} Day Cycle</option>)}
                    </select>
                  </div>
                  <input type="number" value={formData.otRate} onChange={e => setFormData({...formData, otRate: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" placeholder="OT/Hr" />
                  <input type="number" step="0.5" value={formData.dailyHours} onChange={e => setFormData({...formData, dailyHours: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" placeholder="Shift" />
                </div>
                <div className="flex gap-2 pb-2 overflow-x-auto">
                   {DAYS_SHORT.map((day, idx) => (
                     <button key={idx} type="button" onClick={() => toggleDay(idx)} className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${formData.weeklyOffs.includes(idx) ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-950 border border-white/5 text-slate-700'}`}>{day}</button>
                   ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-2"><Sun size={16}/><h4 className="text-[10px] font-black uppercase tracking-widest">Yearly Quotas</h4></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-600 uppercase ml-1">Paid (PL)</label><input type="number" value={formData.pl} onChange={e => setFormData({...formData, pl: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-600 uppercase ml-1">Sick (SL)</label><input type="number" value={formData.sl} onChange={e => setFormData({...formData, sl: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black text-slate-600 uppercase ml-1">Casual (CL)</label><input type="number" value={formData.cl} onChange={e => setFormData({...formData, cl: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-xs" /></div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-3xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">
                 {editingEmployee ? 'Commit Updates' : 'Authorize & Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;