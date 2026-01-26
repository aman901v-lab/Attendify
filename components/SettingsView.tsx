
import React, { useState, useEffect, useMemo } from 'react';
import { UserSettings, Holiday, User, Feedback } from '../types.ts';
import { 
  User as UserIcon,
  Mail,
  Phone,
  Settings2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Check,
  Trash2,
  Plus,
  Edit3,
  X,
  Smartphone,
  Info,
  Building2,
  Cake,
  Clock,
  Send,
  Sparkles,
  ChevronRight
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

type SettingTab = 'profile' | 'system' | 'holidays' | 'feedback';

const SettingsView: React.FC<Props> = ({ settings, onSave, currentUser, onUpdateUser, onUpdateAvatar }) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
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

  // Verification
  const [verificationModal, setVerificationModal] = useState<{ type: 'email' | 'phone'; target: string } | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Controls
  const [quotaInputs, setQuotaInputs] = useState({
    PL: settings.quotas.PL.toString(),
    SL: settings.quotas.SL.toString(),
    CL: settings.quotas.CL.toString()
  });

  // Feedback
  const [feedbackType, setFeedbackType] = useState<'Help' | 'Suggestion'>('Help');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setFeedbackList(snap.docs.map(d => ({ ...d.data(), id: d.id } as Feedback)));
      });
      return () => unsub();
    }
  }, [isAdmin]);

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
    alert("System Rules Updated.");
  };

  const handleUpdateProfile = async () => {
    const updatedUser: User = {
      ...currentUser,
      ...profileData,
      emailVerified: profileData.email === currentUser.email ? (currentUser.emailVerified || false) : false,
      phoneVerified: profileData.phone === currentUser.phone ? (currentUser.phoneVerified || false) : false
    };
    await onUpdateUser(updatedUser);
    setIsEditingProfile(false);
  };

  const startVerification = (type: 'email' | 'phone') => {
    const target = type === 'email' ? profileData.email : profileData.phone;
    if (!target) return alert(`Set ${type} first`);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setVerificationModal({ type, target });
    setTimeout(() => alert(`[DEMO] OTP for ${type}: ${otp}`), 500);
  };

  const handleVerify = async () => {
    if (otpValue !== generatedOtp) return alert("Wrong OTP");
    setIsVerifying(true);
    const updated = { ...currentUser };
    if (verificationModal?.type === 'email') updated.emailVerified = true;
    else updated.phoneVerified = true;
    await onUpdateUser(updated);
    setVerificationModal(null);
    setOtpValue('');
    setIsVerifying(false);
    alert("Verified successfully!");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex flex-row md:flex-col gap-2 p-1 glass rounded-2xl border-white/5 h-fit shrink-0 overflow-x-auto md:overflow-visible">
        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === 'profile' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
          <UserIcon size={18} /> My Profile
        </button>
        {isAdmin && (
          <>
            <button onClick={() => setActiveTab('system')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === 'system' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
              <Settings2 size={18} /> System Config
            </button>
            <button onClick={() => setActiveTab('holidays')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === 'holidays' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
              <Calendar size={18} /> Holidays
            </button>
          </>
        )}
        <button onClick={() => setActiveTab('feedback')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === 'feedback' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
          <MessageSquare size={18} /> {isAdmin ? 'Staff Feed' : 'Support'}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 min-h-[500px]">
        {activeTab === 'profile' && (
          <div className="glass p-8 rounded-3xl border-white/5 space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
              <div className="relative group cursor-pointer" onClick={onUpdateAvatar}>
                <div className="w-24 h-24 rounded-2xl border-2 border-sky-500/30 overflow-hidden bg-slate-900 flex items-center justify-center">
                  {currentUser.photoURL ? <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-700" />}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-sky-500 p-1.5 rounded-lg shadow-lg text-white">
                  <Edit3 size={12} />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black text-white">{currentUser.fullName}</h3>
                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">Role: {currentUser.role}</p>
              </div>
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="sm:ml-auto px-6 py-2 bg-white/5 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest">
                {isEditingProfile ? 'Cancel' : 'Modify Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ProfileItem label="Email" icon={Mail} value={profileData.email} isEditing={isEditingProfile} verified={currentUser.emailVerified} onVerify={() => startVerification('email')} onChange={v => setProfileData({...profileData, email: v})} />
              <ProfileItem label="Phone" icon={Phone} value={profileData.phone} isEditing={isEditingProfile} verified={currentUser.phoneVerified} onVerify={() => startVerification('phone')} onChange={v => setProfileData({...profileData, phone: v})} />
              <ProfileItem label="Company" icon={Building2} value={profileData.companyName} isEditing={isEditingProfile} onChange={v => setProfileData({...profileData, companyName: v})} />
              <ProfileItem label="DOB" icon={Cake} value={profileData.dob} isEditing={isEditingProfile} type="date" onChange={v => setProfileData({...profileData, dob: v})} />
            </div>

            {isEditingProfile && (
              <button onClick={handleUpdateProfile} className="w-full py-4 bg-sky-500 text-white font-black rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs">
                Sync Updates to Cloud
              </button>
            )}
          </div>
        )}

        {activeTab === 'system' && isAdmin && (
          <div className="glass p-8 rounded-3xl border-white/5 space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">System Rules</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Core HR Logic Parameters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Sick Leave (SL)</label>
                <input type="number" value={quotaInputs.SL} onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} className="w-full bg-transparent text-xl font-bold text-white outline-none" />
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Paid Leave (PL)</label>
                <input type="number" value={quotaInputs.PL} onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} className="w-full bg-transparent text-xl font-bold text-white outline-none" />
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Casual Leave (CL)</label>
                <input type="number" value={quotaInputs.CL} onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} className="w-full bg-transparent text-xl font-bold text-white outline-none" />
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl border border-white/5">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 block">Monthly Working Days Cycle</label>
              <select value={localSettings.workingDaysPerMonth} onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-sky-500 outline-none">
                {[26, 27, 28, 29, 30, 31].map(d => <option key={d} value={d}>{d} Days per Month</option>)}
              </select>
            </div>

            <button onClick={handleSaveGlobal} className="w-full py-4 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs">
              Commit System Update
            </button>
          </div>
        )}

        {activeTab === 'holidays' && isAdmin && (
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Holiday Master</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none flex-1" />
              <input type="text" placeholder="Description" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none flex-1" />
              <button onClick={() => { if(newHoliday.date && newHoliday.name) { setLocalSettings({...localSettings, holidays: [...localSettings.holidays, newHoliday]}); setNewHoliday({date:'', name:''}); } }} className="bg-sky-500 px-6 rounded-xl text-white font-bold text-xs">Add</button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {localSettings.holidays.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{h.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{h.date}</p>
                  </div>
                  <button onClick={() => setLocalSettings({...localSettings, holidays: localSettings.holidays.filter((_, idx) => idx !== i)})} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{isAdmin ? 'Staff Feedback' : 'Communication Center'}</h3>
            {isAdmin ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {feedbackList.map(f => (
                  <div key={f.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-white">{f.userName}</p>
                        <span className="text-[8px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded font-black uppercase">{f.type}</span>
                      </div>
                      <button onClick={async () => await deleteDoc(doc(db, "feedbacks", f.id))} className="text-rose-500 opacity-50 hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{f.message}"</p>
                  </div>
                ))}
                {feedbackList.length === 0 && <p className="text-center py-10 text-slate-600 text-xs">No pending messages</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl">
                  <button onClick={() => setFeedbackType('Help')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${feedbackType === 'Help' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>Support</button>
                  <button onClick={() => setFeedbackType('Suggestion')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${feedbackType === 'Suggestion' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>Suggestion</button>
                </div>
                <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-sm text-white h-40 resize-none focus:border-sky-500 outline-none" placeholder="Write your message to HR here..." />
                <button disabled={!feedbackMsg.trim() || sendingFeedback} onClick={async () => {
                  setSendingFeedback(true);
                  const id = `FB-${Date.now()}`;
                  await setDoc(doc(db, "feedbacks", id), { id, userId: currentUser.id, userName: currentUser.fullName, type: feedbackType, message: feedbackMsg, status: 'Open', createdAt: new Date().toISOString() });
                  setFeedbackMsg('');
                  setSendingFeedback(false);
                  alert("Sent!");
                }} className="w-full py-4 bg-sky-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest disabled:opacity-50">Transmit Message</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {verificationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="relative glass w-full max-w-sm p-10 rounded-[2.5rem] border border-sky-500/30 text-center space-y-6">
            <Smartphone size={40} className="mx-auto text-sky-400" />
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Identity Check</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Verify {verificationModal.type} Code</p>
            <input maxLength={4} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-900 border-white/10 rounded-2xl py-4 text-center text-3xl font-black text-sky-500 outline-none" placeholder="0000" />
            <button disabled={isVerifying || otpValue.length < 4} onClick={handleVerify} className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl uppercase tracking-widest text-xs">Verify Code</button>
            <button onClick={() => setVerificationModal(null)} className="text-[10px] font-bold text-slate-600 uppercase">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileItem = ({ label, icon: Icon, value, isEditing, verified, type = "text", onVerify, onChange }: any) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center px-1">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Icon size={12}/> {label}</label>
      {verified && <Check size={12} className="text-emerald-500" />}
      {!verified && value && !isEditing && onVerify && (
        <button onClick={onVerify} className="text-[8px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">Verify</button>
      )}
    </div>
    {isEditing ? (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500 outline-none transition-all" />
    ) : (
      <div className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-white truncate group-hover:bg-white/10 transition-all">
        {value || 'Not Set'}
      </div>
    )}
  </div>
);

export default SettingsView;
