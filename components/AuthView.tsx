
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
  ShieldAlert,
  ArrowRight
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
  
  // Strict check: Only show setup if we are NOT syncing AND no users exist
  const isSetupNeeded = !isSyncing && users.length === 0;
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Auto-toggle setup mode only if database is truly empty
  useEffect(() => {
    if (isSetupNeeded) {
      setIsSetupMode(true);
    } else {
      setIsSetupMode(false);
    }
  }, [isSetupNeeded]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Incorrect ID or Password. Please try again.");
    }
  };

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSetupNeeded) return; 

    setError(null);
    if (username.length < 3 || password.length < 4) {
      setError("Minimum 3 chars for Username and 4 for Password.");
      return;
    }

    const admin: User = {
      id: 'admin-' + Date.now(),
      username: username.trim(),
      password: password,
      fullName: 'Master Administrator',
      role: 'admin',
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
      provider: 'credentials'
    };
    
    try {
      await setDoc(doc(db, "users", admin.id), admin);
      onLogin(admin);
    } catch (err) {
      setError("Sync Error: Please check your internet connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F1A] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mx-auto mb-4 rotate-3">
            {isSetupMode ? <ShieldAlert size={36} className="text-white" /> : <ShieldCheck size={36} className="text-white" />}
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter text-white">Attendify</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Cloud size={10} className="text-blue-400" />
            <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px]">Secure Cloud</p>
          </div>
        </div>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl relative">
          {isSyncing && (
            <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold font-heading text-white">
              {isSetupMode ? 'Cloud Initialization' : 'Authorize Access'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {isSetupMode ? 'Database empty. Configure master account.' : 'Sign in with your corporate credentials'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <span className="text-[11px] font-bold text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={isSetupMode ? createInitialAdmin : handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">User ID</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                    placeholder="e.g. aman.verma"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={isSyncing}
              type="submit" 
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 ${isSetupMode ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} ${isSyncing ? 'opacity-50' : ''}`}
            >
              {isSetupMode ? <Rocket size={16} /> : <LogIn size={16} />}
              {isSetupMode ? 'Confirm & Setup' : 'Login Dashboard'}
            </button>
          </form>

          {!isSetupNeeded && (
            <div className="pt-2 text-center">
              <button 
                onClick={() => setIsSetupMode(!isSetupMode)}
                className="text-slate-600 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2"
              >
                {isSetupMode ? 'Back to Portal' : 'Administrator Access'} <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-[9px] text-center text-slate-800 font-bold uppercase tracking-[0.4em] px-10 leading-relaxed">
          Authorized Access Only • System ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default AuthView;
