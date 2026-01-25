
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  LogIn, 
  User as UserIcon, 
  Lock, 
  ShieldCheck,
  Key,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  usersKey: string;
}

// THE SECRET MASTER KEY FOR INITIALIZATION
const MASTER_KEY = "7860"; 

const AuthView: React.FC<Props> = ({ onLogin, usersKey }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdminInit, setShowAdminInit] = useState(false);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    if (users.length === 0) {
      setShowAdminInit(true);
    }
  }, [usersKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const users: User[] = JSON.parse(localStorage.getItem(usersKey) || '[]');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Incorrect username or password. Please try again.");
    }
  };

  const createInitialAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activationKey !== MASTER_KEY) {
      setError("Invalid Master Activation Key. You are not authorized to setup this system.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
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
    
    const newUsers = [admin];
    localStorage.setItem(usersKey, JSON.stringify(newUsers));
    onLogin(admin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-sky-500/30 mx-auto mb-6 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black font-heading mb-2 tracking-tight">Attendify</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">Secure Workforce Management</p>
        </div>

        <form onSubmit={showAdminInit ? createInitialAdmin : handleLogin} className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
              {showAdminInit ? <ShieldAlert className="text-amber-400" /> : <LogIn className="text-sky-400" />}
              {showAdminInit ? 'System Setup' : 'Staff Login'}
            </h2>
            <p className="text-slate-500 text-xs">
              {showAdminInit ? 'First-time initialization required.' : 'Enter your credentials to access the portal.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-xs font-bold text-rose-400">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {showAdminInit && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-amber-500 uppercase ml-1">Master Activation Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="password"
                    required
                    value={activationKey}
                    onChange={e => setActivationKey(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/20 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-700"
                    placeholder="Enter Secret Master Key"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="Username"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${showAdminInit ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'}`}>
            {showAdminInit ? 'Initialize Admin Account' : 'Secure Login'}
          </button>

          {!showAdminInit && (
            <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest px-4">
              Authorized Personnel Only. All access is strictly monitored.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthView;
