
import React, { useState } from 'react';
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
}

const AuthView: React.FC<Props> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Only allow setup if NO users exist in the entire database
  const isSetupNeeded = users.length === 0;
  const [isSetupMode, setIsSetupMode] = useState(isSetupNeeded);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Login Failed: Username or Password incorrect.");
    }
  };

  const createInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSetupNeeded) return; // Guard against late syncs

    setError(null);
    if (username.length < 3 || password.length < 4) {
      setError("Required: Username (min 3) & Password (min 4).");
      return;
    }

    const admin: User = {
      id: 'admin-' + Date.now(),
      username: username.trim(),
      password: password,
      fullName: 'System Admin',
      role: 'admin',
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
      provider: 'credentials'
    };
    
    try {
      await setDoc(doc(db, "users", admin.id), admin);
      onLogin(admin);
    } catch (err) {
      setError("Network Error: Could not reach cloud.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F1A] relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 mx-auto mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
            {isSetupMode ? <ShieldAlert size={40} className="text-white" /> : <ShieldCheck size={40} className="text-white" />}
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tighter text-white">Attendify</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Cloud size={10} className="text-blue-400" />
            <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px]">Enterprise Cloud</p>
          </div>
        </div>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold font-heading text-white">
              {isSetupMode ? 'Initializing System' : 'Member Portal'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {isSetupMode ? 'Database is empty. Create first admin.' : 'Sign in to access your dashboard'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-bounce-short">
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
                    placeholder="Enter ID"
                    autoFocus
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
                    className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 ${isSetupMode ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
            >
              {isSetupMode ? <Rocket size={16} /> : <LogIn size={16} />}
              {isSetupMode ? 'Initialize System' : 'Authorize Access'}
            </button>
          </form>

          {!isSetupNeeded && isSetupMode && (
            <button 
              onClick={() => setIsSetupMode(false)}
              className="w-full text-slate-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Back to Login
            </button>
          )}
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="h-[1px] w-20 bg-white/5" />
          <p className="text-[9px] text-center text-slate-700 font-bold uppercase tracking-[0.4em] px-10 leading-relaxed">
            256-BIT ENCRYPTION ACTIVE • SECURE CLOUD SYNC
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
