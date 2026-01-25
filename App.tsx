
import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRequest, UserSettings, User } from './types';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import LeaveManager from './components/LeaveManager';
import SettingsView from './components/SettingsView';
import Reports from './components/Reports';
import StaffManager from './components/StaffManager';
import LeaveApproval from './components/LeaveApproval';
import AuthView from './components/AuthView';
import { calculateSalary } from './utils';

// Firebase Imports
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'midnight',
    monthlySalary: 30000,
    otRate: 200,
    dailyWorkHours: 8.5,
    workingDaysPerMonth: 26,
    quotas: { SL: 12, PL: 15, CL: 10 },
    weeklyOffs: [0],
    holidays: []
  });

  useEffect(() => {
    let unsubUsers: any, unsubEmps: any, unsubRecords: any, unsubLeaves: any, unsubSettings: any;

    try {
      // 1. Fetch Users first and wait for sync
      unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() } as User));
        setUsers(data);
        
        // Handle Session
        const savedSession = localStorage.getItem('attendify_session_v2');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const user = data.find(u => u.username === parsed.username);
          if (user) setCurrentUser(user);
        }
        
        // Data is here, stop loading
        setIsLoading(false);
      }, (err) => {
        console.error("Firebase sync error:", err);
        setInitError("Database sync failed. Please check internet.");
        setIsLoading(false);
      });

      // 2. Fetch other collections in background
      unsubEmps = onSnapshot(collection(db, "employees"), (snapshot) => {
        setEmployees(snapshot.docs.map(doc => doc.data() as Employee));
      });

      unsubRecords = onSnapshot(collection(db, "records"), (snapshot) => {
        setRecords(snapshot.docs.map(doc => doc.data() as AttendanceRecord));
      });

      unsubLeaves = onSnapshot(collection(db, "leaves"), (snapshot) => {
        setLeaveRequests(snapshot.docs.map(doc => doc.data() as LeaveRequest));
      });

      unsubSettings = onSnapshot(doc(db, "config", "global"), (docSnap) => {
        if (docSnap.exists()) {
          const s = docSnap.data() as UserSettings;
          setSettings(s);
          document.body.setAttribute('data-theme', s.theme);
        }
      });
    } catch (e) {
      console.error("Init crash:", e);
      setInitError("Initialization Error. Possible Version Conflict.");
      setIsLoading(false);
    }

    return () => {
      unsubUsers?.();
      unsubEmps?.();
      unsubRecords?.();
      unsubLeaves?.();
      unsubSettings?.();
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('attendify_session_v2', JSON.stringify(user));
    if (user.accessibleTabs.length > 0) setActiveTab(user.accessibleTabs[0]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('attendify_session_v2');
  };

  const activeEmployee = useMemo(() => {
    if (!currentUser) return null;
    return employees.find(e => e.id === currentUser.linkedEmployeeId) || null;
  }, [employees, currentUser]);

  const stats = useMemo(() => {
    if (!activeEmployee) return null;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = records.filter(r => 
      r.employeeId === activeEmployee.id && 
      r.date.startsWith(currentMonth)
    );
    return calculateSalary(monthlyRecords, activeEmployee);
  }, [records, activeEmployee]);

  if (initError) return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30">
        <AlertTriangle size={32} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Sync Error</h2>
        <p className="text-slate-500 text-sm max-w-xs">{initError}</p>
      </div>
      <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg">
        <RefreshCcw size={18} /> Re-establish Cloud Connection
      </button>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/10 rounded-full" />
        <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Encrypted Data</p>
        <p className="text-slate-600 font-bold text-[8px] mt-2 uppercase">Please wait while we secure your connection...</p>
      </div>
    </div>
  );

  if (!currentUser) return <AuthView onLogin={handleLogin} users={users} />;

  const navConfigs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'calendar', icon: CalendarIcon, label: 'Attendance' },
    { id: 'leaves', icon: ClipboardList, label: 'Leaves' },
    { id: 'reports', icon: Download, label: 'Reports' },
    { id: 'staff', icon: Users, label: 'Staff' },
    { id: 'approvals', icon: MessageSquare, label: 'Approvals' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const visibleNavItems = navConfigs.filter(item => currentUser.accessibleTabs.includes(item.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-shrink-0 z-50 glass border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 theme-accent-bg rounded-xl shadow-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black font-heading tracking-tight neon-text">Attendify</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">{currentUser.role}</p>
            <p className="text-xs text-white font-bold">{currentUser.fullName}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl transition-all">
            <LogOut size={16} />
          </button>
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
            {activeTab === 'dashboard' && activeEmployee && <Dashboard stats={stats} employee={activeEmployee} records={records} holidays={settings.holidays} onAddRecord={async (r) => await setDoc(doc(db, "records", `${r.employeeId}_${r.date}`), r)} />}
            {activeTab === 'calendar' && activeEmployee && <Calendar employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} holidays={settings.holidays} onAddRecord={async (r) => await setDoc(doc(db, "records", `${r.employeeId}_${r.date}`), r)} onDeleteRecord={async (date) => await deleteDoc(doc(db, "records", `${activeEmployee.id}_${date}`))} />}
            {activeTab === 'leaves' && activeEmployee && <LeaveManager employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} leaveRequests={leaveRequests.filter(l => l.employeeId === activeEmployee.id)} onAddRequest={async (req) => await setDoc(doc(db, "leaves", req.id), req)} />}
            {activeTab === 'reports' && activeEmployee && <Reports employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} />}
            {activeTab === 'staff' && (
              <StaffManager 
                employees={employees} 
                users={users} 
                globalWeeklyOffs={settings.weeklyOffs} 
                globalWorkingDays={settings.workingDaysPerMonth} 
                onAdd={async (e, u) => {
                  await setDoc(doc(db, "employees", e.id), e);
                  await setDoc(doc(db, "users", u.id), u);
                }} 
                onUpdate={async (e, u) => {
                  await setDoc(doc(db, "employees", e.id), e);
                  if(u) await setDoc(doc(db, "users", u.id), u);
                }} 
                onDelete={async (id) => {
                  await deleteDoc(doc(db, "employees", id));
                  const u = users.find(usr => usr.linkedEmployeeId === id);
                  if(u) await deleteDoc(doc(db, "users", u.id));
                }} 
              />
            )}
            {activeTab === 'settings' && <SettingsView settings={settings} onSave={async (s) => await setDoc(doc(db, "config", "global"), s)} allData={{ users, employees, records, leaveRequests, settings }} onImport={() => {}} />}
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
