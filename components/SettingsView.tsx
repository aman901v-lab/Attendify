import React, { useState, useEffect, useMemo } from 'react';
import { UserSettings, Holiday, User, Feedback } from '../types.ts';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Briefcase,
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  MessageSquare,
  Send,
  Check,
  Inbox,
  Cake,
  Edit3,
  XCircle,
  Settings2,
  Bell,
  Fingerprint,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Save,
  Clock
} from 'lucide-react';
import { db } from '../firebase.ts';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  currentUser: User;
  onUpdateUser: (u: User) => void;
  onUpdateAvatar: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, onSave, currentUser, onUpdateUser, onUpdateAvatar }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [profileData, setProfileData] = useState({
    dob: currentUser.dob || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    companyName: currentUser.companyName || ''
  });

  const [feedbackType, setFeedbackType] = useState<'Help' | 'Suggestion'>('Help');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Help' | 'Suggestion'>('All');

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const currentCalculatedAge = useMemo(() => calculateAge(profileData.dob), [profileData.dob]);
  const isAdmin = currentUser.role === 'admin' || currentUser.username.toLowerCase().trim() === 'aman.verma';

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setFeedbackList(snap.docs.map(d => ({ ...d.data(), id: d.id } as Feedback)));
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const [quotaInputs, setQuotaInputs] = useState({
    PL: settings.quotas.PL.toString(),
    SL: settings.quotas.SL.toString(),
    CL: settings.quotas.CL.toString()
  });

  const handleSaveGlobal = () => {
    const finalSettings = {
      ...localSettings,
      quotas: {
        PL: Number(quotaInputs.PL) || 0,
        SL: Number(quotaInputs.SL) || 0,
        CL: Number(quotaInputs.CL) || 0
      }
    };
    onSave(finalSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUpdateProfile = async () => {
    const updatedUser: User = {
      ...currentUser,
      dob: profileData.dob,
      age: currentCalculatedAge,
      email: profileData.email,
      phone: profileData.phone,
      companyName: profileData.companyName
    };
    onUpdateUser(updatedUser);
    setIsEditingProfile(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    setSendingFeedback(true);
    const feedbackId = `FB-${Date.now()}`;
    const feedback: Feedback = {
      id: feedbackId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      type: feedbackType,
      message: feedbackMsg,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "feedbacks", feedbackId), feedback);
      setFeedbackMsg('');
      alert("Sent! Management will review your message.");
    } catch (e) {
      console.error("Feedback error", e);
      alert("Error sending message. Check connection.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const resolveFeedback = async (id: string) => {
    const f = feedbackList.find(x => x.id === id);
    if (f) {
      try {
        await setDoc(doc(db, "feedbacks", id), { ...f, status: 'Resolved' });
      } catch (e) {
        alert("Failed to resolve. Check permissions.");
      }
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!id) return;
    if(window.confirm("Permanently delete this message? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "feedbacks", id));
      } catch (e) {
        console.error("Delete failed", e);
        alert("Delete failed!");
      }
    }
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setLocalSettings({
      ...localSettings,
      holidays: [...localSettings.holidays, newHoliday]
    });
    setNewHoliday({ date: '', name: '' });
  };

  const filteredFeedback = feedbackList.filter(f => 
    filterType === 'All' || f.type === filterType
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Profile Card */}
      <div className="relative overflow-hidden glass p-8 rounded-[3rem] border border-white/5 shadow-2xl bg-gradient-to-br from-white/10 via-transparent to-sky-500/5">
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none rotate-12">
          <Fingerprint size={240} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group cursor-pointer" onClick={onUpdateAvatar}>
            <div className="w-40 h-40 rounded-[2.5rem] border-4 theme-accent-border p-1.5 overflow-hidden shadow-2xl bg-slate-900 group-hover:scale-105 transition-all duration-700">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <UserIcon size={64} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-sky-500 p-3 rounded-2xl text-white shadow-2xl group-hover:rotate-12 transition-all">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-sm">{currentUser.fullName}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 items-center pt-2">
                 <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-sky-500/20">@{currentUser.username}</span>
                 <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">{currentUser.role}</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold max-w-sm leading-relaxed">Verified node identity linked to Attendify Cloud v11. Managed by {currentUser.linkedEmployeeId ? 'Enterprise' : 'System Root'}.</p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isEditingProfile ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'}`}
            >
              {isEditingProfile ? <XCircle size={18} /> : <Edit3 size={18} />}
              {isEditingProfile ? 'Cancel Edit' : 'Modify Profile'}
            </button>
          </div>
        </div>

        {/* Profile Detail Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-10 border-t border-white/10">
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400"><Cake size={16} /></div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Birth Date</label>
            </div>
            {isEditingProfile ? (
              <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 outline-none transition-all" />
            ) : (
              <p className="text-sm font-bold text-white px-1">{profileData.dob || '—'}</p>
            )}
          </div>
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400"><Hash size={16} /></div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">User Age</label>
            </div>
            <p className="text-sm font-bold text-white px-1">{currentCalculatedAge} <span className="text-[10px] text-slate-600 font-bold ml-1">YRS</span></p>
          </div>
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400"><Mail size={16} /></div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cloud Email</label>
            </div>
            {isEditingProfile ? (
              <input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 outline-none transition-all" placeholder="user@domain.com" />
            ) : (
              <p className="text-sm font-bold text-white truncate px-1">{profileData.email || '—'}</p>
            )}
          </div>
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Phone size={16} /></div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Link</label>
            </div>
            {isEditingProfile ? (
              <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 outline-none transition-all" placeholder="+91" />
            ) : (
              <p className="text-sm font-bold text-white px-1">{profileData.phone || '—'}</p>
            )}
          </div>
        </div>

        {isEditingProfile && (
          <button onClick={handleUpdateProfile} className="mt-8 w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3">
            <Save size={18} /> Sync Cloud Identity
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Management Tools */}
        {isAdmin && (
          <div className="space-y-8">
            {/* System Parameters Bento */}
            <div className="glass p-8 rounded-[3rem] border border-white/5 shadow-xl space-y-8 relative overflow-hidden">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center shadow-inner"><Settings2 size={28} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">System Defaults</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Attendance Logic</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Paid (PL)</label>
                  <input type="number" value={quotaInputs.PL} onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} className="w-full bg-transparent text-white text-2xl font-black outline-none border-b border-transparent focus:border-purple-500/50 transition-all pb-1" />
                </div>
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Sick (SL)</label>
                  <input type="number" value={quotaInputs.SL} onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} className="w-full bg-transparent text-white text-2xl font-black outline-none border-b border-transparent focus:border-purple-500/50 transition-all pb-1" />
                </div>
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Casual (CL)</label>
                  <input type="number" value={quotaInputs.CL} onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} className="w-full bg-transparent text-white text-2xl font-black outline-none border-b border-transparent focus:border-purple-500/50 transition-all pb-1" />
                </div>
              </div>

              <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Working Days Cycle</label>
                <div className="relative">
                   <select value={localSettings.workingDaysPerMonth} onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black appearance-none outline-none focus:border-purple-500/50 cursor-pointer">
                    {[26, 27, 28, 29, 30, 31].map(d => <option key={d} value={d}>{d} Days P/Month</option>)}
                  </select>
                  <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 rotate-90 pointer-events-none" />
                </div>
              </div>

              <button onClick={handleSaveGlobal} className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[2rem] shadow-2xl shadow-purple-600/30 active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3">
                <Check size={18} /> Update Cloud Rules
              </button>
            </div>

            {/* Holiday Master Bento */}
            <div className="glass p-8 rounded-[3rem] border border-white/5 shadow-xl space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-pink-500/10 text-pink-400 rounded-2xl flex items-center justify-center shadow-inner"><CalendarIcon size={28} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Holiday Master</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Team Off Days</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-pink-500/50 transition-all" />
                <div className="flex gap-2">
                   <input type="text" placeholder="Event Name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-pink-500/50 transition-all flex-1" />
                   <button onClick={addHoliday} className="bg-pink-500 px-6 rounded-2xl text-white shadow-xl shadow-pink-500/30 active:scale-95 transition-all"><Plus size={24} /></button>
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                {localSettings.holidays.length > 0 ? localSettings.holidays.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 text-xs font-black">{i+1}</div>
                       <div>
                        <p className="text-sm font-black text-white">{h.name}</p>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{new Date(h.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                       </div>
                    </div>
                    <button onClick={() => setLocalSettings({...localSettings, holidays: localSettings.holidays.filter((_, idx) => idx !== i)})} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><Trash2 size={16}/></button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 opacity-30">
                    <CalendarIcon size={48} className="text-slate-600 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest">No Holidays Logged</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messaging & Interaction */}
        <div className="space-y-8">
          {isAdmin ? (
            /* Admin Staff Feedback Dashboard */
            <div className="glass p-8 rounded-[3rem] border border-white/5 shadow-xl flex flex-col h-full max-h-[880px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center shadow-inner"><Inbox size={28} /></div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Staff Feed</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee Communications</p>
                  </div>
                </div>
                <div className="flex bg-slate-900/60 rounded-2xl p-1.5 border border-white/5">
                  {(['All', 'Help', 'Suggestion'] as const).map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white/10 text-white shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-5">
                {filteredFeedback.map((f, i) => (
                  <div key={f.id} className={`p-6 rounded-[2.5rem] border transition-all animate-in slide-in-from-right duration-500 ${f.status === 'Resolved' ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-slate-900/40 border-white/10 shadow-xl'}`} style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border shadow-inner ${f.type === 'Help' ? 'bg-sky-500/20 text-sky-400 border-sky-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>{f.userName[0]}</div>
                        <div>
                          <h5 className="text-base font-black text-white leading-none">{f.userName}</h5>
                          <div className="flex items-center gap-2 mt-2">
                             <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-widest ${f.type === 'Help' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'}`}>{f.type}</span>
                             <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {new Date(f.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {f.status === 'Open' && (
                          <button onClick={() => resolveFeedback(f.id)} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5" title="Mark as Resolved"><Check size={18} /></button>
                        )}
                        <button onClick={() => deleteFeedback(f.id)} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5" title="Remove Message"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="bg-black/30 p-5 rounded-[1.5rem] text-[13px] text-slate-300 italic border border-white/5 leading-relaxed">"{f.message}"</div>
                  </div>
                ))}
                {filteredFeedback.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-24 opacity-20 grayscale">
                    <MessageSquare size={64} className="text-slate-500" />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em] mt-6">Secure Inbox Empty</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Employee Help & Suggestion Center */
            <div className="glass p-8 rounded-[3rem] border border-white/5 shadow-xl space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner"><Send size={28} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Support & Ideas</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Connect with HQ</p>
                </div>
              </div>

              <div className="flex bg-slate-950 p-2 rounded-3xl border border-white/5">
                <button onClick={() => setFeedbackType('Help')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${feedbackType === 'Help' ? 'bg-sky-500 text-white shadow-2xl shadow-sky-500/30' : 'text-slate-600 hover:text-slate-400'}`}>Request Assistance</button>
                <button onClick={() => setFeedbackType('Suggestion')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${feedbackType === 'Suggestion' ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/30' : 'text-slate-600 hover:text-slate-400'}`}>New Suggestion</button>
              </div>

              <div className="relative group">
                <textarea 
                  value={feedbackMsg} 
                  onChange={e => setFeedbackMsg(e.target.value)} 
                  className="w-full bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 text-white text-sm h-72 resize-none outline-none focus:border-emerald-500/50 shadow-inner transition-all placeholder:text-slate-800" 
                  placeholder={feedbackType === 'Help' ? "Describe the challenge you're facing... Our team will review this shortly." : "We'd love to hear your creative ideas to improve our workspace!"} 
                />
                <div className="absolute top-8 right-8 text-slate-800 pointer-events-none group-focus-within:text-emerald-500/50 transition-colors">
                  <Edit3 size={24} />
                </div>
              </div>

              <button 
                disabled={sendingFeedback || !feedbackMsg.trim()} 
                onClick={handleSendFeedback} 
                className="w-full py-6 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-900 disabled:text-slate-800 disabled:shadow-none text-white font-black rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-sky-500/30 active:scale-95 transition-all uppercase tracking-[0.4em] text-[12px]"
              >
                {sendingFeedback ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                Transmit Message
              </button>
            </div>
          )}

          {/* Infrastructure Health Bento */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass p-7 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-sky-500/10 to-transparent group hover:scale-[1.02] transition-transform">
               <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center mb-5"><Bell size={20} /></div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Node Health</p>
               <p className="text-2xl font-black text-white tracking-tight uppercase">Optimal</p>
            </div>
            <div className="glass p-7 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent group hover:scale-[1.02] transition-transform">
               <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-5"><ShieldCheck size={20} /></div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Protocol</p>
               <p className="text-2xl font-black text-white tracking-tight uppercase">Secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 pt-12 border-t border-white/5 opacity-30 group hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <ShieldAlert size={24} className="text-sky-500" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Attendify Cloud Platform</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">Secure Node Identifier: {currentUser.id}</p>
          </div>
        </div>
        <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
          <button className="hover:text-white transition-colors">Privacy Shield</button>
          <button className="hover:text-white transition-colors">User SLA</button>
          <button className="hover:text-white transition-colors">Logout Hub</button>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;