import React, { useState, useEffect, useMemo } from 'react';
import { UserSettings, Holiday, AppTheme, User, Feedback } from '../types.ts';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Briefcase,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Hash,
  MessageSquare,
  Send,
  CheckCircle,
  MessageCircle,
  Camera,
  Lightbulb,
  Check,
  Inbox,
  AlertCircle,
  Cake,
  Edit3,
  XCircle
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 rounded-2xl text-sky-400">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-widest text-sm">Personal Profile</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Your cloud account identity</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase text-sky-400 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              >
                <XCircle size={14} /> Cancel
              </button>
            )}
            <button 
              onClick={onUpdateAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Camera size={14} /> Photo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 opacity-60">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Full Name</label>
            <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-400 text-sm font-bold">{currentUser.fullName}</div>
          </div>
          <div className="space-y-1.5 opacity-60">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Username</label>
            <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-400 text-sm font-bold">@{currentUser.username}</div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1"><Cake size={10} className="text-pink-400" /> Date of Birth</label>
            {isEditingProfile ? (
              <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm outline-none transition-all shadow-inner" />
            ) : (
              <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-300 text-sm font-bold">{profileData.dob || 'Not Set'}</div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1"><Hash size={10} className="text-amber-400" /> Age</label>
            <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-slate-300 text-sm font-bold flex items-center justify-between">
              <span>{currentCalculatedAge > 0 ? `${currentCalculatedAge} Years Old` : 'N/A'}</span>
              <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-slate-500 font-black uppercase tracking-widest">Auto</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1"><Mail size={10} className="text-sky-400" /> Email</label>
            {isEditingProfile ? (
              <input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm outline-none transition-all shadow-inner" placeholder="Your email" />
            ) : (
              <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-300 text-sm font-bold truncate">{profileData.email || 'Not Set'}</div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1"><Phone size={10} className="text-emerald-400" /> Phone</label>
            {isEditingProfile ? (
              <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm outline-none transition-all shadow-inner" placeholder="+91" />
            ) : (
              <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-300 text-sm font-bold">{profileData.phone || 'Not Set'}</div>
            )}
          </div>
        </div>

        {isEditingProfile && (
          <button onClick={handleUpdateProfile} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 animate-in slide-in-from-bottom-2">
            Save Profile Updates
          </button>
        )}
      </div>

      {isAdmin ? (
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-400">
                <Inbox size={20} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">Staff Feedback Dashboard</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Messages from the team</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
              {(['All', 'Help', 'Suggestion'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {filteredFeedback.map(f => (
              <div key={f.id} className={`p-5 rounded-[2rem] border transition-all ${f.status === 'Resolved' ? 'bg-white/5 border-white/5 opacity-40 shadow-none' : 'bg-slate-900/50 border-white/10 shadow-lg'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${f.type === 'Help' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{f.type}</span>
                    <div>
                      <h5 className="text-xs font-black text-white">{f.userName}</h5>
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{new Date(f.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {f.status === 'Open' && (
                      <button onClick={() => resolveFeedback(f.id)} className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Check size={16} /></button>
                    )}
                    <button onClick={() => deleteFeedback(f.id)} className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-xs text-slate-300 italic leading-relaxed">"{f.message}"</div>
              </div>
            ))}
            {filteredFeedback.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <MessageSquare className="text-slate-800" size={40} />
                <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">Your inbox is empty</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-widest text-sm">Help & Suggestions</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Communicate with Admin</p>
            </div>
          </div>
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setFeedbackType('Help')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedbackType === 'Help' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>Get Help</button>
            <button onClick={() => setFeedbackType('Suggestion')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedbackType === 'Suggestion' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>Suggestion</button>
          </div>
          <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-sky-500 text-sm h-32 resize-none outline-none shadow-inner" placeholder={feedbackType === 'Help' ? "Describe the issue you are facing..." : "How can we make your experience better?"} />
          <button disabled={sendingFeedback} onClick={handleSendFeedback} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest text-[10px] shadow-xl shadow-sky-500/20">
            {sendingFeedback ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
            Submit Message
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2.5 bg-sky-500/20 rounded-2xl text-sky-400"><CalendarIcon size={20} /></div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">Holiday Master</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Global team off days</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs flex-1 text-white outline-none" />
              <input type="text" placeholder="Name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs flex-1 text-white outline-none" />
              <button onClick={addHoliday} className="bg-sky-500 px-4 rounded-xl text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all"><Plus size={20} /></button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
              {localSettings.holidays.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                  <div className="text-xs font-bold"><p className="text-white">{h.name}</p><p className="text-slate-500">{h.date}</p></div>
                  <button onClick={() => setLocalSettings({...localSettings, holidays: localSettings.holidays.filter((_, idx) => idx !== i)})} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2.5 bg-purple-500/20 rounded-2xl text-purple-400"><Briefcase size={20} /></div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">System Defaults</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Global attendance parameters</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Paid (PL)</label><input type="number" value={quotaInputs.PL} onChange={e => setQuotaInputs({...quotaInputs, PL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs shadow-inner" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sick (SL)</label><input type="number" value={quotaInputs.SL} onChange={e => setQuotaInputs({...quotaInputs, SL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs shadow-inner" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Casual (CL)</label><input type="number" value={quotaInputs.CL} onChange={e => setQuotaInputs({...quotaInputs, CL: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs shadow-inner" /></div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Working Cycle (Days)</label>
              <select value={localSettings.workingDaysPerMonth} onChange={e => setLocalSettings({...localSettings, workingDaysPerMonth: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white text-sm font-bold appearance-none outline-none shadow-inner">
                {[26, 27, 28, 29, 30, 31].map(d => <option key={d} value={d}>{d} Days Cycle</option>)}
              </select>
            </div>
            <button onClick={handleSaveGlobal} className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-purple-600/20 active:scale-95 transition-all">Update Cloud Parameters</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;