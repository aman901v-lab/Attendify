import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  Settings as SettingsIcon,
  Download,
  Users,
  MessageSquare,
  LogOut,
  ShieldCheck,
  RefreshCcw,
  Lock,
  Database,
  Palette,
  User as UserIcon,
  Loader2,
  UserPlus
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRequest, UserSettings, User, AppTheme } from './types.ts';

// Corrected Paths with extensions for browser ESM resolution
import Dashboard from './Dashboard.tsx'; 
import Reports from './Reports.tsx';
import Calendar from './components/Calendar.tsx';
import LeaveManager from './components/LeaveManager.tsx';
import SettingsView from './components/SettingsView.tsx';
import StaffManager from './components/StaffManager.tsx';
import LeaveApproval from './components/LeaveApproval.tsx';
import AuthView from './components/AuthView.tsx';
import { calculateSalary, toLocalDateString } from './utils.ts';

// Firebase Imports
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [initError, setInitError] = useState<{message: string, code?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local Theme Preference
  const [localTheme, setLocalTheme] = useState<AppTheme>(
    (localStorage.getItem('attendify_theme_v11') as AppTheme) || 'midnight'
  );

  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'midnight',
    monthlySalary: 30000,
    otRate: 0,
    dailyWorkHours: 8,
    workingDaysPerMonth: 26,
    quotas: { SL: 12, PL: 15, CL: 10 },
    weeklyOffs: [0],
    holidays: []
  });

  // Apply Theme Effect
  useEffect(() => {
    document.body.setAttribute('data-theme', localTheme);
    localStorage.setItem('attendify_theme_v11', localTheme);
  }, [localTheme]);

  const toggleTheme = () => {
    const themes: AppTheme[] = ['midnight', 'obsidian', 'nordic'];
    const currentIndex = themes.indexOf(localTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setLocalTheme(themes[nextIndex]);
  };

  useEffect(() => {
    let unsubUsers: any;
    let isInitialLoad = true;

    const setupSync = () => {
      try {
        unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ ...doc.data() } as User));
          setUsers(data);
          
          if (isInitialLoad) {
            const savedSession = localStorage.getItem('attendify_session_v11');
            if (savedSession) {
              const parsed = JSON.parse(savedSession);
              // Priority: If it's your master admin account, refresh it correctly
              const user = data.find(u => u.username?.toLowerCase() === parsed.username?.toLowerCase());
              if (user) setCurrentUser(user);
            }
            isInitialLoad = false;
          }
          
          setIsSyncing(false);
          setInitError(null);
        }, (err) => {
          console.error("Firestore Error:", err.code);
          if (err.code === 'permission-denied') {
            setInitError({ 
              message: "Database Permissions Locked. Please update Firestore Rules.", 
              code: 'PERMISSION_DENIED' 
            });
          } else {
            setInitError({ message: "Cloud Connection Error: " + err.message });
          }
          setIsLoading(false);
        });

        // Background Listeners
        const unsubEmps = onSnapshot(collection(db, "employees"), (snap) => {
          setEmployees(snap.docs.map(d => d.data() as Employee));
          setIsLoading(false);
        });
        
        onSnapshot(collection(db, "records"), (snap) => setRecords(snap.docs.map(d => d.data() as AttendanceRecord)));
        onSnapshot(collection(db, "leaves"), (snap) => setLeaveRequests(snap.docs.map(d => d.data() as LeaveRequest)));
        onSnapshot(doc(db, "config", "global"), (snap) => {
          if (snap.exists()) {
            const s = snap.data() as UserSettings;
            setSettings(s);
          }
        });

        return () => unsubEmps();

      } catch (e) {
        setInitError({ message: "System Initialization Failed." });
        setIsLoading(false);
      }
    };

    setupSync();
    return () => unsubUsers?.();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('attendify_session_v11', JSON.stringify(user));
    if (user.accessibleTabs?.length > 0) setActiveTab(user.accessibleTabs[0]);
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('attendify_session_v11');
  };

  const handleUpdateUser = async (u: User) => {
    try {
      await setDoc(doc(db, "users", u.id), u, { merge: true });
      setCurrentUser(u);
      localStorage.setItem('attendify_session_v11', JSON.stringify(u));
    } catch (err) {
      console.error("User update failed", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Max 2MB allowed.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `profile_${currentUser.id}_${Date.now()}`;
      const storageRef = ref(storage, `profiles/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const updatedUser = { ...currentUser, photoURL: url };
      await handleUpdateUser(updatedUser);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check your internet or storage rules.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeEmployee = useMemo(() => {
    if (!currentUser) return null;
    return employees.find(e => e.id === currentUser.linkedEmployeeId) || null;
  }, [employees, currentUser]);

  const stats = useMemo(() => {
    if (!activeEmployee) return null;
    const now = new Date();
    const currentMonth = toLocalDateString(now).slice(0, 7);
    const monthlyRecords = records.filter(r => 
      r.employeeId === activeEmployee.id && 
      r.date.startsWith(currentMonth)
    );
    return calculateSalary(monthlyRecords, activeEmployee);
  }, [records, activeEmployee]);

  const handleDeleteRecord = async (date: string) => {
    if (!activeEmployee) return;
    try {
      const docId = `${activeEmployee.id}_${date}`;
      await deleteDoc(doc(db, "records", docId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (initError) return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20 shadow-2xl">
        {initError.code === 'PERMISSION_DENIED' ? <Lock size(40} /> : <Database size={40} />}
      </div>
      <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Access Restricted</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed font-medium">{initError.message}</p>
      <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]">
        <RefreshCcw size={16} /> Reconnect Now
      </button>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Cloud Data...</p>
    </div>
  );

  if (!currentUser) return <AuthView onLogin={handleLogin} users={users} isSyncing={isSyncing} />;

  const navConfigs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'calendar', icon: CalendarIcon, label: 'Attendance' },
    { id: 'leaves', icon: ClipboardList, label: 'Leaves' },
    { id: 'reports', icon: Download, label: 'Reports' },
    { id: 'staff', icon: Users, label: 'Staff' },
    { id: 'approvals', icon: MessageSquare, label: 'Approvals' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const visibleNavItems = navConfigs.filter(item => 
    currentUser.role === 'admin' || currentUser.accessibleTabs?.includes(item.id)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-shrink-0 z-50 glass border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 theme-accent-bg rounded-xl shadow-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black font-heading tracking-tight text-white">Attendify</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
            <Palette size={16} className="theme-accent-text" />
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">{localTheme}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">{currentUser.role}</p>
              <p className="text-xs text-white font-bold">{currentUser.fullName}</p>
            </div>
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-10 h-10 rounded-full border-2 theme-accent-border overflow-hidden bg-slate-800 flex items-center justify-center relative shadow-inner">
                {isUploading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"><Loader2 size={20} className="text-white animate-spin" /></div>}
                {currentUser.photoURL ? <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-400" />}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="hidden md:flex w-64 glass border-r p-4 flex-col gap-2 z-40">
          {visibleNavItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all w-full ${activeTab === item.id ? 'theme-accent-bg text-white shadow-lg font-bold' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
              <item.icon size={18} /> <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-5xl mx-auto">
            {/* Improved Empty State for Admin */}
            {!activeEmployee && (activeTab === 'dashboard' || activeTab === 'calendar') && (
              <div className="glass p-12 rounded-[2.5rem] border border-sky-500/20 text-center flex flex-col items-center gap-6">
                <div className="p-6 bg-sky-500/10 rounded-[2rem] text-sky-400"><UserPlus size={48} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Admin Console Active</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm font-medium">
                    {currentUser.role === 'admin' ? "You are logged in as Admin. Navigate to 'Staff' to link yourself to an employee record or manage your team." : "Link your user account to an employee profile in Staff Manager."}
                  </p>
                </div>
                {currentUser.role === 'admin' && (
                   <button onClick={() => setActiveTab('staff')} className="px-8 py-3 bg-sky-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 active:scale-95 transition-all">Go to Staff Manager</button>
                )}
              </div>
            )}
            {activeTab === 'dashboard' && activeEmployee && <Dashboard stats={stats} employee={activeEmployee} records={records} holidays={settings.holidays} onAddRecord={async (r) => await setDoc(doc(db, "records", `${r.employeeId}_${r.date}`), r)} />}
            {activeTab === 'calendar' && activeEmployee && <Calendar employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} holidays={settings.holidays} onAddRecord={async (r) => await setDoc(doc(db, "records", `${r.employeeId}_${r.date}`), r)} onDeleteRecord={handleDeleteRecord} />}
            {activeTab === 'leaves' && activeEmployee && <LeaveManager employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} leaveRequests={leaveRequests.filter(l => l.id.startsWith(activeEmployee.id))} onAddRequest={async (req) => await setDoc(doc(db, "leaves", req.id), req)} />}
            {activeTab === 'reports' && activeEmployee && <Reports employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} />}
            {activeTab === 'staff' && <StaffManager employees={employees} users={users} globalWeeklyOffs={settings.weeklyOffs} globalWorkingDays={settings.workingDaysPerMonth} onAdd={async (e, u) => { await setDoc(doc(db, "employees", e.id), e); await setDoc(doc(db, "users", u.id), u); }} onUpdate={async (e, u) => { await setDoc(doc(db, "employees", e.id), e); if(u) await setDoc(doc(db, "users", u.id), u); }} onDelete={async (id) => { await deleteDoc(doc(db, "employees", id)); const u = users.find(usr => usr.linkedEmployeeId === id); if(u) await deleteDoc(doc(db, "users", u.id)); }} currentUser={currentUser} />}
            {activeTab === 'approvals' && <LeaveApproval requests={leaveRequests} employees={employees} onApprove={async (req) => await setDoc(doc(db, "leaves", req.id), { ...req, status: 'Approved' })} onApproveRecord={async (r) => await setDoc(doc(db, "records", `${r.employeeId}_${r.date}`), r)} onReject={async (id) => { const req = leaveRequests.find(l => l.id === id); if (req) await setDoc(doc(db, "leaves", req.id), { ...req, status: 'Rejected' }); }} />}
            {activeTab === 'settings' && currentUser && <SettingsView settings={settings} onSave={async (s) => await setDoc(doc(db, "config", "global"), s)} currentUser={currentUser} onUpdateUser={handleUpdateUser} onUpdateAvatar={() => fileInputRef.current?.click()} />}
          </div>
        </main>
      </div>

      <nav className="md:hidden glass border-t px-2 py-1 flex justify-around z-[60] pb-safe">
        {visibleNavItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === item.id ? 'theme-accent-text opacity-100' : 'opacity-40'}`}>
            <item.icon size={18} /> <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;