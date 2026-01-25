
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  LogIn, 
  User as UserIcon, 
  Lock, 
  ShieldCheck,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdminInit, setShowAdminInit] = useState(false);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('attendify_auth_users') || '[]');
    if (users.length === 0) {
      setShowAdminInit(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password cannot be empty.");
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('attendify_auth_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Access Denied: Invalid credentials. Please contact your administrator.");
    }
  };

  const createInitialAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required to setup the admin account.");
      return;
    }

    const admin: User = {
      id: 'admin-001',
      username: username.trim(),
      password: password,
      fullName: 'System Administrator',
      role: 'admin',
      accessibleTabs: ['dashboard', 'calendar', 'leaves', 'reports', 'staff', 'approvals', 'settings'],
      provider: 'credentials'
    };
    localStorage.setItem('attendify_auth_users', JSON.stringify([admin]));
    onLogin(admin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-sky-500/30 mx-auto mb-6 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black font-heading mb-2 tracking-tight">Attendify</h1>
          <p className="text-slate-500 font-medium">Internal Portal Access</p>
        </div>

        <form onSubmit={showAdminInit ? createInitialAdmin : handleLogin} className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading">{showAdminInit ? 'Setup Admin' : 'Login'}</h2>
            <p className="text-slate-500 text-xs">
              {showAdminInit ? 'Create the first system administrator account' : 'Enter your assigned credentials to continue'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-xs font-bold text-rose-400">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
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
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/30 transition-all active:scale-95">
            {showAdminInit ? 'Initialize System' : 'Sign In'}
          </button>

          {!showAdminInit && (
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <p className="text-[10px] text-amber-500/60 text-center font-bold uppercase tracking-widest leading-relaxed">
                Notice: Accounts must be created by an administrator.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthView;
