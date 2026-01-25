
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
  ShieldCheck
} from 'lucide-react';
import { AttendanceRecord, Employee, LeaveRequest, UserSettings, User } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import Calendar from './components/Calendar.tsx';
import LeaveManager from './components/LeaveManager.tsx';
import SettingsView from './components/SettingsView.tsx';
import Reports from './components/Reports.tsx';
import StaffManager from './components/StaffManager.tsx';
import LeaveApproval from './components/LeaveApproval.tsx';
import AuthView from './components/AuthView.tsx';
import { calculateSalary } from './utils.ts';

const EMPLOYEES_KEY = 'attendify_emps_v1';
const RECORDS_KEY = 'attendify_records_v1';
const LEAVES_KEY = 'attendify_leaves_v1';
const SETTINGS_KEY = 'attendify_settings_v1';
const AUTH_SESSION_KEY = 'attendify_session_v1';
const USERS_LIST_KEY = 'attendify_users_v1'; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
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
    const savedUsers = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
    setUsers(savedUsers);

    const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      const freshUser = savedUsers.find((u: User) => u.username === parsedSession.username);
      setCurrentUser(freshUser || parsedSession);
    }

    setEmployees(JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || '[]'));
    setRecords(JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'));
    setLeaveRequests(JSON.parse(localStorage.getItem(LEAVES_KEY) || '[]'));
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaveRequests));
  }, [employees, records, leaveRequests]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    if (user.accessibleTabs.length > 0) setActiveTab(user.accessibleTabs[0]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const activeEmployee = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.linkedEmployeeId) {
      return employees.find(e => e.id === currentUser.linkedEmployeeId) || null;
    }
    // For admin users without a link, fallback to first employee for preview purposes
    return employees[0] || null;
  }, [employees, currentUser]);

  const stats = useMemo(() => {
    if (!activeEmployee) return null;
    const monthlyRecords = records.filter(r => 
      r.employeeId === activeEmployee.id && 
      r.date.startsWith(new Date().toISOString().slice(0, 7))
    );
    return calculateSalary(monthlyRecords, activeEmployee);
  }, [records, activeEmployee]);

  if (!currentUser) return <AuthView onLogin={handleLogin} usersKey={USERS_LIST_KEY} />;

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
          <div className="p-2 theme-accent-bg rounded-xl shadow-lg flex items-center justify-center">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black font-heading tracking-tight neon-text">Attendify</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{currentUser.role}</p>
            <p className="text-xs text-white font-bold">{currentUser.fullName}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all font-bold text-xs">
            <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="hidden md:flex w-64 glass border-r p-4 flex-col gap-2 z-40 overflow-y-auto">
          {visibleNavItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all w-full ${activeTab === item.id ? 'theme-accent-bg text-white shadow-lg font-bold' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
              <item.icon size={20} /> <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-5xl mx-auto min-h-full">
            <h2 className="text-3xl font-bold font-heading mb-6 capitalize">{activeTab}</h2>
            
            {activeTab === 'dashboard' && stats && activeEmployee && (
              <Dashboard stats={stats} employee={activeEmployee} records={records} holidays={settings.holidays} onAddRecord={(r) => setRecords([...records.filter(x => x.date !== r.date || x.employeeId !== r.employeeId), r])} />
            )}
            {activeTab === 'calendar' && activeEmployee && (
              <Calendar employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} holidays={settings.holidays} onAddRecord={(r) => setRecords([...records.filter(x => x.date !== r.date || x.employeeId !== r.employeeId), r])} onDeleteRecord={(date) => setRecords(records.filter(r => !(r.date === date && r.employeeId === activeEmployee.id)))} />
            )}
            {activeTab === 'leaves' && activeEmployee && (
              <LeaveManager employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} leaveRequests={leaveRequests.filter(l => l.employeeId === activeEmployee.id)} onAddRequest={(r) => setLeaveRequests([...leaveRequests, r])} />
            )}
            {activeTab === 'reports' && activeEmployee && (
              <Reports employee={activeEmployee} records={records.filter(r => r.employeeId === activeEmployee.id)} />
            )}
            {activeTab === 'staff' && (
              <StaffManager 
                employees={employees} 
                users={users} 
                globalWeeklyOffs={settings.weeklyOffs} 
                globalWorkingDays={settings.workingDaysPerMonth} 
                onAdd={(e, u) => { setEmployees([...employees, e]); setUsers([...users, u]); }} 
                onUpdate={(e, u) => { setEmployees(employees.map(x => x.id === e.id ? e : x)); if(u) setUsers(users.map(x => x.id === u.id ? u : x)); }} 
                onDelete={(id) => { setEmployees(employees.filter(x => x.id !== id)); setUsers(users.filter(x => x.linkedEmployeeId !== id)); }} 
              />
            )}
            {activeTab === 'approvals' && (
              <LeaveApproval requests={leaveRequests} employees={employees} onReject={(id) => setLeaveRequests(leaveRequests.map(l => l.id === id ? {...l, status: 'Rejected'} : l))} onApprove={(req) => {
                setLeaveRequests(leaveRequests.map(l => l.id === req.id ? {...l, status: 'Approved'} : l));
                const newRecs: AttendanceRecord[] = [];
                let d = new Date(req.startDate);
                while(d <= new Date(req.endDate)) {
                  newRecs.push({ employeeId: req.employeeId, date: d.toISOString().split('T')[0], status: req.type as any, notes: `Approved Leave: ${req.reason}` });
                  d.setDate(d.getDate() + 1);
                }
                setRecords([...records.filter(r => !(r.employeeId === req.employeeId && newRecs.some(nr => nr.date === r.date))), ...newRecs]);
              }} />
            )}
            {activeTab === 'settings' && (
              <SettingsView settings={settings} onSave={setSettings} />
            )}
          </div>
        </main>
      </div>

      <nav className="md:hidden glass border-t px-2 py-1 flex justify-around z-[60] pb-safe">
        {visibleNavItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === item.id ? 'theme-accent-text opacity-100' : 'opacity-40'}`}>
            <item.icon size={20} /> <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
