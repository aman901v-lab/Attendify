
import React, { useState } from 'react';
import { User } from '../types';
import { 
  LogIn, 
  User as UserIcon, 
  Lock, 
  ShieldCheck,
  Key,
  AlertCircle,
  ShieldAlert,
  Settings,
  Cloud
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
}

const MASTER_KEY = "7860"; 

const AuthView: React.FC<Props> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      if (users.length === 0) {
        setError("Database is empty. Please contact Admin for cloud initialization.");
      } else {
        setError("Invalid credentials. Please check your username and password.");
      }
    }
  };

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activationKey !== MASTER_KEY) {
      setError("Incorrect Master Activation Key.");
      return;
    }

    const admin: User = {
      id: 'admin-' + Date.now(),
      username: username.trim(),
      password: password,
      fullName: 'Administrator',
      role: 'admin',
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
      provider: 'credentials'
    };
    
    try {
      await setDoc(doc(db, "users", admin.id), admin);
      onLogin(admin);
    } catch (err) {
      setError("Cloud connection error. Check your internet.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-sky-500/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 scale-110">
          <div className="w-16 h-16 bg-sky-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/40 mx-auto mb-4 -rotate-6">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter text-white">Attendify</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Cloud size={10} className="text-sky-400" />
            <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[8px]">Cloud Attendance System</p>
          </div>
        </div>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/5 space-y-8 animate-in fade-in zoom-in duration-700 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-white">
              {isSetupMode ? <ShieldAlert className="text-amber-400" size={24} /> : <LogIn className="text-sky-400" size={24} />}
              {isSetupMode ? 'Cloud Setup' : 'Secure Login'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {isSetupMode ? 'Register root admin on cloud' : 'Access your payroll dashboard'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-[11px] font-bold text-rose-400 leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={isSetupMode ? createInitialAdmin : handleLogin} className="space-y-6">
            <div className="space-y-5">
              {isSetupMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-amber-500 uppercase ml-1 tracking-widest">Master Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input 
                      type="password"
                      required
                      value={activationKey}
                      onChange={e => setActivationKey(e.target.value)}
                      className="w-full bg-slate-900/50 border border-amber-500/20 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-sm font-mono"
                      placeholder="Activation Pin"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-sky-500 transition-all text-sm"
                    placeholder="User ID"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-sky-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className={`w-full py-5 text-white font-black rounded-[1.5rem] shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-[11px] ${isSetupMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}`}>
              {isSetupMode ? 'Initialize Cloud' : 'Secure Login'}
            </button>
          </form>

          <div className="pt-4 flex flex-col items-center">
            <button 
              onClick={() => setIsSetupMode(!isSetupMode)}
              className="text-slate-600 hover:text-sky-400 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Settings size={14} />
              {isSetupMode ? 'Back to Login' : 'Admin: Cloud Init'}
            </button>
          </div>
        </div>
        
        <p className="text-[8px] text-center text-slate-700 font-bold uppercase tracking-[0.3em] mt-8 px-10 leading-relaxed">
          Access is restricted to authorized personnel only. All login attempts are logged on cloud servers.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
