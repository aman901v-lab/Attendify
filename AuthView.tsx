import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { 
  LogIn, 
  User as UserIcon, 
  Lock, 
  ShieldCheck,
  AlertCircle,
  Database,
  UserCheck,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { db } from '../firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
  isSyncing?: boolean;
}

const AuthView: React.FC<Props> = ({ onLogin, users, isSyncing }) => {
  const [loginMode, setLoginMode] = useState<'staff' | 'admin'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    if (isSyncing === false) {
      setIsSetupMode(users.length === 0);
    }
  }, [users.length, isSyncing]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanUser = username.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Please fill in all fields.");
      return;
    }

    // MASTER ADMIN BYPASS & AUTO-PROVISIONING
    if (cleanUser === 'aman.verma' && cleanPass === 'Ankush#12') {
      const existingAdmin = users.find(u => u.username?.toLowerCase() === 'aman.verma');
      const masterUser: User = {
        id: existingAdmin?.id || 'admin-master-aman',
        username: 'aman.verma',
        fullName: 'Aman Verma',
        role: 'admin',
        accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
        provider: 'credentials'
      };

      // Try to ensure the master user exists in Firestore for persistence
      try {
        await setDoc(doc(db, "users", masterUser.id), masterUser, { merge: true });
      } catch (err) {
        console.warn("Could not sync master admin to cloud, continuing locally.");
      }
      
      onLogin(masterUser);
      return;
    }

    const user = users.find(u => 
      u.username?.toLowerCase().trim() === cleanUser && 
      u.password === cleanPass
    );

    if (user) {
      if (loginMode === 'admin' && user.role !== 'admin') {
        setError("This account does not have Admin privileges.");
        return;
      }
      onLogin(user);
    } else {
      setError("Invalid credentials.");
    }
  };

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.length > 0) return;
    
    const cleanUser = username.toLowerCase().trim();
    const admin: User = {
      id: 'admin-' + Date.now(),
      username: cleanUser,
      password: password,
      fullName: 'Master Admin',
      role: 'admin',
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
      provider: 'credentials'
    };

    try {
      await setDoc(doc(db, "users", admin.id), admin);
      onLogin(admin);
    } catch (err) {
      setError("Setup failed.");
    }
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B132B]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Establishing Cloud Link</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B132B] relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-sky-600/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4 border border-blue-400/30">
            {loginMode === 'admin' ? <ShieldCheck size={32} className="text-white" /> : <UserCheck size={32} className="text-white" />}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Attendify</h1>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.3em] mt-2">Cloud Secure Node</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => { setLoginMode('staff'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Staff Login
            </button>
            <button 
              onClick={() => { setLoginMode('admin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Admin Access
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {isSetupMode ? 'System Setup' : loginMode === 'admin' ? 'Master Authorization' : 'Member Login'}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              {isSetupMode ? 'Create initial database account.' : 'Enter your credentials to continue.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-xs font-bold text-rose-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <UserIcon size={18} />
                </div>
                <input 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
                  placeholder={loginMode === 'admin' ? "admin.id" : "staff.id"} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 mt-4 ${loginMode === 'admin' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
            >
              {loginMode === 'admin' ? <ShieldCheck size={18} /> : <LogIn size={18} />}
              {isSetupMode ? 'Complete Setup' : loginMode === 'admin' ? 'Elevate Access' : 'Authorize Session'}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center gap-2 opacity-30">
            <Database size={10} className="text-slate-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              {users.length} Database nodes detected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;