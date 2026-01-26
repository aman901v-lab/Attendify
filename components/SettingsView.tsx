import React, { useState, useEffect, useMemo } from 'react';
import { UserSettings, Holiday, User, Feedback } from '../types.ts';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
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
  Sparkles,
  ShieldCheck,
  Save,
  Clock,
  ChevronRight,
  Building2,
  CalendarDays,
  ShieldAlert,
  Smartphone
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
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [profileData, setProfileData] = useState({
    dob: currentUser.dob || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    companyName: currentUser.companyName || '',
    companyJoinedDate: currentUser.companyJoinedDate || ''
  });

  // Verification States
  const [verificationModal, setVerificationModal] = useState<{ type: 'email' | 'phone'; step: 'verify'; target: string } | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
    alert("System Parameters Synchronized Successfully.");
  };

  const handleUpdateProfile = async () => {
    const updatedUser: User = {
      ...currentUser,
      dob: profileData.dob,
      age: currentCalculatedAge,
      email: profileData.email,
      phone: profileData.phone,
      companyName: profileData.companyName,
      companyJoinedDate: profileData.companyJoinedDate,
      emailVerified: profileData.email === currentUser.email ? (currentUser.emailVerified || false) : false,
      phoneVerified: profileData.phone === currentUser.phone ? (currentUser.phoneVerified || false) : false
    };
    onUpdateUser(updatedUser);
    setIsEditingProfile(false);
  };

  const handleRequestVerification = (type: 'email' | 'phone') => {
    const target = type === 'email' ? profileData.email : profileData.phone;
    if (!target) {
      alert(`Please set your ${type} first.`);
      return;
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setVerificationModal({ type, step: 'verify', target });
    setTimeout(() => {
      alert(`[DEMO] OTP for ${type} (${target}): ${otp}`);
    }, 500);
  };

  const handleVerifyOtp = async () => {
    if (otpValue === generatedOtp) {
      setIsVerifying(true);
      const updatedUser = { ...currentUser };
      if (verificationModal?.type === 'email') updatedUser.emailVerified = true;
      if (verificationModal?.type === 'phone') updatedUser.phoneVerified = true;
      
      try {
        await onUpdateUser(updatedUser);
        setVerificationModal(null);
        setOtpValue('');
        alert("Verification Successful.");
      } catch (err) {
        console.error("Verification error:", err);
        alert("Failed to sync verification status.");
      } finally {
        setIsVerifying(false);
      }
    } else {
      alert("Invalid OTP code. Please retry.");
    }
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
      alert("Feedback transmitted.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const resolveFeedback = async (id: string) => {
    const f = feedbackList.find(x => x.id === id);
    if (f) await setDoc(doc(db, "feedbacks", id), { ...f, status: 'Resolved' });
  };

  const deleteFeedback = async (id: string) => {
    if (window.confirm("Archive this communication?")) await deleteDoc(doc(db, "feedbacks", id));
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setLocalSettings({ ...localSettings, holidays: [...localSettings.holidays, newHoliday] });
    setNewHoliday({ date: '', name: '' });
  };

  const filteredFeedback = feedbackList.filter(f => filterType === 'All' || f.type === filterType);

  return (
    <div className="space-y-10 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="relative overflow-hidden glass p-10 md:p-14 rounded-[4rem] border border-white/5 shadow-2xl bg-gradient-to-br from-white/10 via-transparent to-sky-500/10">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Fingerprint size={320} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="relative group cursor-pointer" onClick={onUpdateAvatar}>
            <div className="w-52 h-52 rounded-[3.5rem] border-4 theme-accent-border p-2.5 overflow-hidden shadow-[0_0_50px_rgba(58,134,255,0.2)] bg-slate-900 group-hover:scale-105 transition-all duration-700">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-[2.8rem]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <UserIcon size={100} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-sky-500 p-4 rounded-3xl text-white shadow-2xl group-hover:rotate-12 transition-all">
              <Sparkles size={28} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-5">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none drop-shadow-md">{currentUser.fullName}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <span className="px-5 py-2 bg-sky-500/10 text-sky-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-sky-500/20 shadow-inner">@{currentUser.username}</span>
                 <span className="px-5 py-2 bg-amber-500/10 text-amber-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-inner">{currentUser.role}</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-bold max-w-md leading-relaxed opacity-80">Verified cloud identity. System node management access granted.</p>
          </div>

          <button 
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className={`px-10 py-6 rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${isEditingProfile ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/40' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
          >
            {isEditingProfile ? <XCircle size={22} /> : <Edit3 size={22} />}
            {isEditingProfile ? 'DISCARD' : 'MODIFY ID'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 pt-14 border-t border-white/10">
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Cake size={16} className="text-pink-400" /> Biometric DOB</label>
            {isEditingProfile ? (
              <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-sky-500" />
            ) : (
              <p className="text-xl font-black text-white">{profileData.dob || 'NOT SET'}</p>
            )}
          </div>
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Hash size={16} className="text-amber-400" /> Identity Age</label>
            <p className="text-xl font-black text-white">{currentCalculatedAge} <span className="text-xs font-black text-slate-600 ml-1">CYCLES</span></p>
          </div>
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Building2 size={16} className="text-sky-400" /> Current Company</label>
            {isEditingProfile ? (
              <input value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-sky-500" placeholder="Organization Name" />
            ) : (
              <p className="text-xl font-black text-white truncate">{profileData.companyName || 'NO COMPANY'}</p>
            )}
          </div>
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><CalendarDays size={16} className="text-emerald-400" /> Joined Date</label>
            {isEditingProfile ? (
              <input type="date" value={profileData.companyJoinedDate} onChange={e => setProfileData({...profileData, companyJoinedDate: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-sky-500" />
            ) : (
              <p className="text-xl font-black text-white">{profileData.companyJoinedDate || 'NO DATE'}</p>
            )}
          </div>
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group flex flex-col justify-between">
            <div className="flex justify-between items-start min-h-[32px]">
              <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Mail size={16} className="text-sky-400" /> Cloud Email</label>
              {!isEditingProfile && currentUser.email && (
                currentUser.emailVerified ? (
                  <Check size={14} className="text-emerald-400" title="Verified" />
                ) : (
                  <button onClick={() => handleRequestVerification('email')} className="text-[8px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20 font-black hover:bg-rose-500 hover:text-white transition-all">VERIFY</button>
                )
              )}
            </div>
            {isEditingProfile ? (
              <input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-sky-500" placeholder="user@domain.com" />
            ) : (
              <p className="text-xl font-black text-white truncate">{profileData.email || 'NO LINK'}</p>
            )}
          </div>
          <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group flex flex-col justify-between">
            <div className="flex justify-between items-start min-h-[32px]">
              <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Phone size={16} className="text-emerald-400" /> Mobile Link</label>
              {!isEditingProfile && currentUser.phone && (
                currentUser.phoneVerified ? (
                  <Check size={14} className="text-emerald-400" title="Verified" />
                ) : (
                  <button onClick={() => handleRequestVerification('phone')} className="text-[8px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20 font-black hover:bg-rose-500 hover:text-white transition-all">VERIFY</button>
                )
              )}
            </div>
            {isEditingProfile ? (
              /* Fix: Replaced undefined 'setFormData' with 'setProfileData' */
              <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-sky-500" placeholder="+91" />
            ) : (
              <p className="text-xl font-black text-white">{profileData.phone || 'NO LINK'}</p>
            )}
          </div>
        </div>

        {isEditingProfile && (
          <button onClick={handleUpdateProfile} className="mt-10 w-full py-7 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all uppercase tracking-[0.5em] text-sm flex items-center justify-center gap-4">
            <Save size={28} /> SYNC IDENTITY TO CLOUD
          </button>
        )}
      </div>

      {verificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setVerificationModal(null)} />
          <div className="relative glass w-full max-w-md p-10 rounded-[3.5rem] border border-sky-500/30 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-sky-500/10 text-sky-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {verificationModal.type === 'email' ? <Mail size={40} /> : <Smartphone size={40} />}
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identity Check</h3>
              <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">Code sent to <span className="text-white">{verificationModal.target}</span>.</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={4} 
                value={otpValue} 
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} 
                placeholder="0 0 0 0" 
                className="w-full bg-slate-950 border border-white/10 rounded-3xl py-6 text-center text-4xl font-black tracking-[0.5em] text-sky-500 outline-none focus:border-sky-500"
              />
              <button 
                disabled={isVerifying || otpValue.length < 4} 
                onClick={handleVerifyOtp} 
                className="w-full py-6 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-900 disabled:text-slate-600 text-white font-black rounded-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3"
              >
                {isVerifying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShieldCheck size={20} />}
                CONFIRM IDENTITY
              </button>
              <button onClick={() => setVerificationModal(null)} className="w-full text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {isAdmin && (
          <div className="space-y-10">
            <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center gap-6">
                <div className="p-6 bg-purple-500/10 text-purple-400 rounded-3xl shadow-inner"><Settings2 size={36} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Rules</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Core Logic Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Paid (PL)</label>
                  <input type="number" value={quotaInputs.PL} onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} className="w-full bg-transparent text-white text-3xl font-black outline-none border-b border-transparent focus:border-purple-500 transition-all pb-2" />
                </div>
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Sick (SL)</label>
                  <input type="number" value={quotaInputs.SL} onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} className="w-full bg-transparent text-white text-3xl font-black outline-none border-b border-transparent focus:border-purple-500 transition-all pb-2" />
                </div>
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Casual (CL)</label>
                  <input type="number" value={quotaInputs.CL} onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} className="w-full bg-transparent text-white text-3xl font-black outline-none border-b border-transparent focus:border-purple-500 transition-all pb-2" />
                </div>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 space-y-3">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Working Days Cycle</label>
                <div className="relative">
                   <select value={localSettings.workingDaysPerMonth} onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-6 text-white text-base font-black appearance-none outline-none focus:border-purple-500 cursor-pointer">
                    {[26, 27, 28, 29, 30, 31].map(d => <option key={d} value={d}>{d} DAYS P/MONTH</option>)}
                  </select>
                  <ChevronRight size={28} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-700 rotate-90 pointer-events-none" />
                </div>
              </div>

              <button onClick={handleSaveGlobal} className="w-full py-7 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[2.5rem] shadow-2xl shadow-purple-600/40 active:scale-95 transition-all uppercase tracking-[0.5em] text-xs flex items-center justify-center gap-4">
                <Check size={24} /> COMMIT SYSTEM UPDATE
              </button>
            </div>

            <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10 bg-gradient-to-br from-pink-500/5 to-transparent">
              <div className="flex items-center gap-6">
                <div className="p-6 bg-pink-500/10 text-pink-400 rounded-3xl shadow-inner"><CalendarIcon size={36} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Holiday Master</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Global Team Schedule</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white outline-none flex-1 focus:border-pink-500" />
                <div className="flex gap-2 flex-1">
                  <input type="text" placeholder="Event Description" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white outline-none flex-1 focus:border-pink-500" />
                  <button onClick={addHoliday} className="bg-pink-500 px-10 rounded-2xl text-white shadow-xl shadow-pink-500/30 transition-all active:scale-90"><Plus size={28} /></button>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {localSettings.holidays.length > 0 ? localSettings.holidays.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-7 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:bg-white/10 transition-all" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center font-black text-sm">{i+1}</div>
                       <div>
                        <p className="text-base font-black text-white leading-tight">{h.name}</p>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mt-2">{new Date(h.date).toDateString()}</p>
                       </div>
                    </div>
                    <button onClick={() => setLocalSettings({...localSettings, holidays: localSettings.holidays.filter((_, idx) => idx !== i)})} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><Trash2 size={22}/></button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20">
                    <CalendarIcon size={64} className="text-slate-600" />
                    <p className="text-[12px] font-black uppercase tracking-widest mt-4">NO HOLIDAYS LOGGED</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {isAdmin ? (
            <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col h-full max-h-[1150px] bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-14">
                <div className="flex items-center gap-6">
                  <div className="p-6 bg-amber-500/10 text-amber-400 rounded-3xl shadow-inner"><Inbox size={36} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Staff Feed</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Communications Control</p>
                  </div>
                </div>
                <div className="flex bg-slate-950 p-2.5 rounded-2xl border border-white/5">
                  {(['All', 'Help', 'Suggestion'] as const).map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white/10 text-white shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
                {filteredFeedback.map((f, i) => (
                  <div key={f.id} className={`p-8 rounded-[3.5rem] border transition-all animate-in slide-in-from-right duration-700 ${f.status === 'Resolved' ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-slate-900/60 border-white/10 shadow-2xl hover:scale-[1.01]'}`} style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center font-black text-xl border shadow-inner ${f.type === 'Help' ? 'bg-sky-500/20 text-sky-400 border-sky-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>{f.userName[0]}</div>
                        <div>
                          <h5 className="text-xl font-black text-white leading-none">{f.userName}</h5>
                          <div className="flex items-center gap-3 mt-3">
                             <span className={`text-[9px] px-3 py-1 rounded-lg uppercase font-black tracking-widest ${f.type === 'Help' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'}`}>{f.type}</span>
                             <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> {new Date(f.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {f.status === 'Open' && <button onClick={() => resolveFeedback(f.id)} className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/5"><Check size={24} /></button>}
                        <button onClick={() => deleteFeedback(f.id)} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/5"><Trash2 size={24} /></button>
                      </div>
                    </div>
                    <div className="bg-black/30 p-8 rounded-[2.5rem] text-base text-slate-300 italic border border-white/5 leading-relaxed">"{f.message}"</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass p-10 rounded-[4rem] border border-white/5 shadow-2xl space-y-12 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex items-center gap-6">
                <div className="p-6 bg-emerald-500/10 text-emerald-400 rounded-3xl shadow-inner"><Send size={36} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Communication</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Connect with HQ</p>
                </div>
              </div>

              <div className="flex bg-slate-950 p-2.5 rounded-[2.5rem] border border-white/5 shadow-inner">
                <button onClick={() => setFeedbackType('Help')} className={`flex-1 py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all ${feedbackType === 'Help' ? 'bg-sky-500 text-white shadow-2xl shadow-sky-500/30 scale-105' : 'text-slate-600 hover:text-slate-400'}`}>SUPPORT REQUEST</button>
                <button onClick={() => setFeedbackType('Suggestion')} className={`flex-1 py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all ${feedbackType === 'Suggestion' ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/30 scale-105' : 'text-slate-600 hover:text-slate-400'}`}>IDEA TRANSMISSION</button>
              </div>

              <div className="relative group">
                <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-[3rem] p-12 text-lg text-white h-[450px] resize-none outline-none focus:border-emerald-500 shadow-2xl transition-all placeholder:text-slate-800" placeholder={feedbackType === 'Help' ? "Specify challenge..." : "Share vision..."} />
              </div>

              <button disabled={sendingFeedback || !feedbackMsg.trim()} onClick={handleSendFeedback} className="w-full py-7 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-5 shadow-2xl active:scale-95 transition-all uppercase tracking-[0.6em] text-sm">
                {sendingFeedback ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={28} />}
                SEND PACKET
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            <div className="glass p-10 rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-sky-500/10 to-transparent group hover:scale-[1.02] transition-all shadow-xl">
               <Bell size={28} className="text-sky-400 mb-8" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Cloud Status</p>
               <p className="text-3xl font-black text-white tracking-tighter uppercase">Optimal</p>
            </div>
            <div className="glass p-10 rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent group hover:scale-[1.02] transition-all shadow-xl">
               <ShieldCheck size={28} className="text-emerald-400 mb-8" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Protocol</p>
               <p className="text-3xl font-black text-white tracking-tighter uppercase">Secured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;