
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
  UserPlus
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRequest, UserSettings, User, AppTheme } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import Calendar from './components/Calendar.tsx';
import LeaveManager from './components/LeaveManager.tsx';
import SettingsView from './components/SettingsView.tsx';
import Reports from './components/Reports.tsx';
import StaffManager from './components/StaffManager.tsx';
import LeaveApproval from './components/LeaveApproval.tsx';
import AuthView from './components/AuthView.tsx';
import { calculateSalary } from './utils.ts';

const EMPLOYEES_KEY = 'neon_employees_v2';
const RECORDS_KEY = 'neon_records_v2';
const LEAVES_KEY = 'neon_leaves_v2';
const SETTINGS_KEY = 'neon_settings_v2';
const AUTH_SESSION_KEY = 'neon_user_session';
const USERS_LIST_KEY = 'attendify_auth_users';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // App Data State
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'midnight',
    monthlySalary: 30000,
    otRate: 200,
    dailyWorkHours: 8.5,
    quotas: { SL: 12, PL: 15, CL: 10 },
    weeklyOffs: [0],
    holidays: []
  });

  // Load state from local storage
  useEffect(() => {
    const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (savedSession) setCurrentUser(JSON.parse(savedSession));

    const savedUsers = localStorage.getItem(USERS_LIST_KEY);
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    const savedEmps = localStorage.getItem(EMPLOYEES_KEY);
    if (savedEmps) setEmployees(JSON.parse(savedEmps));

    const savedRecords = localStorage.getItem(RECORDS_KEY);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedLeaves = localStorage.getItem(LEAVES_KEY);
    if (savedLeaves) setLeaveRequests(JSON.parse(savedLeaves));

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Sync theme to body element
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync session if currentUser data changes in users list
  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
      }
    }
  }, [users, currentUser]);

  const handleLogin = (user: User) => {
    // If the user logging in isn't in our current memory (like initial admin), add them
    setUsers(prev => {
      if (!prev.find(u => u.id === user.id)) {
        return [...prev, user];
      }
      return prev;
    });
    
    setCurrentUser(user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    if (user.accessibleTabs.length > 0) {
      setActiveTab(user.accessibleTabs[0]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const activeEmployee = useMemo(() => {
    if (!currentUser || employees.length === 0) return null;
    if (currentUser.role === 'admin') return employees[0];
    return employees.find(e => e.id === currentUser.linkedEmployeeId) || null;
  }, [employees, currentUser]);

  const stats = useMemo(() => {
    if (!activeEmployee) return null;
    const monthlyRecords = records.filter(r => 
      r.employeeId === activeEmployee.id && 
      r.date.startsWith(new Date().toISOString().slice(0, 7))
    );
    return calculateSalary(monthlyRecords, activeEmployee);
  }, [records, activeEmployee]);

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  const navConfigs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'calendar', icon: CalendarIcon, label: 'Attendance' },
    { id: 'leaves', icon: ClipboardList, label: 'Leaves' },
    { id: 'reports', icon: Download, label: 'Reports' },
    { id: 'staff', icon: Users, label: 'Staff Manager' },
    { id: 'approvals', icon: MessageSquare, label: 'Approvals' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const visibleNavItems = navConfigs.filter(item => 
    currentUser.accessibleTabs.includes(item.id)
  );

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full group ${
        activeTab === id 
          ? 'theme-accent-bg text-white shadow-lg shadow-sky-500/30 font-bold' 
          : 'opacity-60 hover:opacity-100 hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
      <span className="hidden lg:block text-sm">{label}</span>
    </button>
  );

  const MobileNavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-300 ${
        activeTab === id 
          ? 'theme-accent-text' 
          : 'opacity-40'
      }`}
    >
      <div className={`p-2 rounded-xl transition-all ${activeTab === id ? 'bg-white/5' : ''}`}>
        <Icon size={20} className={activeTab === id ? 'scale-110' : ''} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );

  const tabLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    calendar: 'Attendance Log',
    leaves: 'Leave Center',
    reports: 'Monthly Reports',
    staff: 'Staff Directory',
    approvals: 'Admin Approvals',
    settings: 'App Settings'
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-shrink-0 z-50 glass border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 theme-accent-bg rounded-lg md:rounded-xl shadow-lg flex items-center justify-center">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <h1 className="text-lg md:text-2xl font-black font-heading tracking-tight neon-text">Attendify</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 md:gap-3 glass border px-3 py-1.5 rounded-xl shadow-inner">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full theme-accent-bg flex items-center justify-center font-bold text-[10px] md:text-xs shadow-lg text-white">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] md:text-xs font-bold leading-tight">{currentUser.fullName}</span>
              <span className="text-[8px] md:text-[10px] opacity-60 font-bold uppercase tracking-wider text-slate-400">
                {currentUser.role} @{currentUser.username}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-lg md:rounded-xl transition-all duration-300 font-bold text-[10px] md:text-xs group active:scale-95 shadow-lg shadow-rose-500/5"
          >
            <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="hidden md:flex w-20 lg:w-64 glass border-r p-4 flex-col gap-2 z-40 overflow-y-auto scrollbar-hide">
          <nav className="flex flex-col gap-2">
            {visibleNavItems.map(item => (
              <NavItem key={item.id} id={item.id} icon={item.icon} label={item.label} />
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto h-full">
            <div key={`title-${activeTab}`} className="mb-6 md:mb-8 animate-in slide-in-from-left-4 fade-in duration-500">
              <h2 className="text-2xl md:text-3xl font-bold font-heading">
                {tabLabels[activeTab]}
              </h2>
              <div className="h-1 w-10 md:w-12 theme-accent-bg rounded-full mt-2 neon-accent" />
            </div>

            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-6 duration-500">
              {activeTab === 'dashboard' && (
                <>
                  {activeEmployee && stats ? (
                    <Dashboard 
                      stats={stats} 
                      employee={activeEmployee} 
                      records={records} 
                      holidays={settings.holidays}
                      onAddRecord={(r) => {
                        const filtered = records.filter(rec => !(rec.date === r.date && rec.employeeId === r.employeeId));
                        setRecords([...filtered, r]);
                      }} 
                    />
                  ) : (
                    <div className="glass p-12 rounded-[2.5rem] border border-white/5 text-center space-y-6">
                      <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto text-sky-400">
                        <Users size={40} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">Welcome to Attendify</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                          {currentUser.role === 'admin' 
                            ? "Start by adding your first staff member in the Staff Directory to begin tracking attendance and payroll." 
                            : "Your profile is being set up. Please contact your administrator to link your employee records."}
                        </p>
                      </div>
                      {currentUser.role === 'admin' && (
                        <button 
                          onClick={() => setActiveTab('staff')}
                          className="px-8 py-3 theme-accent-bg text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                        >
                          <UserPlus size={18} /> Register Staff Member
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'calendar' && activeEmployee && (
                <Calendar 
                  employee={activeEmployee} 
                  records={records.filter(r => r.employeeId === activeEmployee.id)}
                  holidays={settings.holidays}
                  onAddRecord={(r) => {
                    const filtered = records.filter(rec => !(rec.date === r.date && rec.employeeId === r.employeeId));
                    setRecords([...filtered, r]);
                  }}
                  onDeleteRecord={(date) => {
                    setRecords(records.filter(r => !(r.date === date && r.employeeId === activeEmployee.id)));
                  }}
                />
              )}
              {activeTab === 'leaves' && activeEmployee && (
                <LeaveManager 
                  employee={activeEmployee}
                  records={records.filter(r => r.employeeId === activeEmployee.id)}
                  leaveRequests={leaveRequests.filter(l => l.employeeId === activeEmployee.id)}
                  onAddRequest={(r) => setLeaveRequests([...leaveRequests, r])}
                />
              )}
              {activeTab === 'reports' && activeEmployee && (
                <Reports 
                  employee={activeEmployee} 
                  records={records.filter(r => r.employeeId === activeEmployee.id)} 
                />
              )}

              {activeTab === 'staff' && currentUser.role === 'admin' && (
                <StaffManager 
                  employees={employees}
                  users={users}
                  globalWeeklyOffs={settings.weeklyOffs}
                  onAdd={(e, u) => {
                    setEmployees([...employees, e]);
                    setUsers([...users, u]);
                  }}
                  onUpdate={(e, u) => {
                    setEmployees(employees.map(emp => emp.id === e.id ? e : emp));
                    if (u) setUsers(users.map(usr => usr.id === u.id ? u : usr));
                  }}
                  onDelete={(id) => {
                    setEmployees(employees.filter(e => e.id !== id));
                    setUsers(users.filter(u => u.linkedEmployeeId !== id));
                  }}
                />
              )}

              {activeTab === 'approvals' && currentUser.role === 'admin' && (
                <LeaveApproval 
                  requests={leaveRequests}
                  employees={employees}
                  onApprove={(req) => {
                    setLeaveRequests(leaveRequests.map(l => l.id === req.id ? { ...l, status: 'Approved' } : l));
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    const newRecords: AttendanceRecord[] = [];
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                      const dateStr = d.toISOString().split('T')[0];
                      newRecords.push({
                        employeeId: req.employeeId,
                        date: dateStr,
                        status: req.type,
                        notes: `Approved Leave: ${req.reason}`
                      });
                    }
                    const filteredRecords = records.filter(r => 
                      !(r.employeeId === req.employeeId && newRecords.some(nr => nr.date === r.date))
                    );
                    setRecords([...filteredRecords, ...newRecords]);
                  }}
                  onReject={(id) => setLeaveRequests(leaveRequests.map(l => l.id === id ? { ...l, status: 'Rejected' } : l))}
                />
              )}

              {activeTab === 'settings' && currentUser.role === 'admin' && (
                <SettingsView 
                  settings={settings}
                  onSave={setSettings}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <nav className="md:hidden flex-shrink-0 glass border-t px-2 py-1 flex items-center justify-around z-50 safe-area-bottom">
        {visibleNavItems.map(item => (
          <MobileNavItem key={item.id} id={item.id} icon={item.icon} label={item.label} />
        ))}
      </nav>
    </div>
  );
};

export default App;
