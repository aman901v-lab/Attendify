
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  LogIn, 
  User as UserIcon, 
  Lock, 
  ShieldCheck,
  AlertCircle,
  Cloud,
  Rocket,
  ShieldAlert
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  onLogin: (user: User) => void;
  users: User[];
  isSyncing?: boolean;
}

const AuthView: React.FC<Props> = ({ onLogin, users, isSyncing }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // AUTOMATIC MODE ONLY: If users exist, setup mode is PERMANENTLY LOCKED
  useEffect(() => {
    if (!isSyncing) {
      setIsSetupMode(users.length === 0);
    }
  }, [users.length, isSyncing]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Invalid User ID or Password.");
    }
  };

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.length > 0) return; // Fail-safe

    setError(null);
    if (username.length < 3 || password.length < 4) {
      setError("Username (min 3) & Password (min 4) required.");
      return;
    }

    const admin: User = {
      id: 'admin-' + Date.now(),
      username: username.trim(),
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
      setError("Cloud Sync Failed. Check internet.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B132B] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mx-auto mb-4 scale-110">
            {isSetupMode ? <ShieldAlert size={36} className="text-white" /> : <ShieldCheck size={36} className="text-white" />}
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter text-white">Attendify</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Cloud size={12} className="text-blue-400" />
            <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px]">Secure Cloud Portal</p>
          </div>
        </div>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          {isSyncing && (
            <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold font-heading text-white">
              {isSetupMode ? 'Cloud Initialization' : 'Member Login'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {isSetupMode ? 'Setup the master administrator account' : 'Enter your credentials to continue'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <span className="text-[11px] font-bold text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={isSetupMode ? createInitialAdmin : handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Login ID</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
                    placeholder="Username"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={isSyncing}
              type="submit" 
              className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 ${isSetupMode ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} ${isSyncing ? 'opacity-50' : ''}`}
            >
              {isSetupMode ? <Rocket size={18} /> : <LogIn size={18} />}
              {isSetupMode ? 'Confirm Setup' : 'Login Dashboard'}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-[9px] text-center text-slate-800 font-bold uppercase tracking-[0.5em] px-10 leading-relaxed">
          Proprietary System • Encrypted Node
        </p>
      </div>
    </div>
  );
};

export default AuthView;
