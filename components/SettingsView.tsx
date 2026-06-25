import React, { useState, useEffect } from 'react';
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
  Minus,
  Edit3,
  X,
  Smartphone,
  Info,
  Building2,
  Cake,
  Clock,
  Send,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sliders,
  AlertCircle,
  HelpCircle,
  Lock,
  CalendarDays,
  Menu,
  Palette,
  LogOut
} from 'lucide-react';
import { db } from '../firebase.ts';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { formatDate } from '../utils.ts';
import { motion, AnimatePresence } from 'motion/react';

import { AppTheme } from '../types.ts';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  currentUser: User;
  onUpdateUser: (u: User) => void;
  onUpdateAvatar: () => void;
  isUploading?: boolean;
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  onLogout?: () => void;
}

type SettingTab = 'profile' | 'system' | 'holidays' | 'feedback';

const SettingsView: React.FC<Props> = ({ 
  settings, 
  onSave, 
  currentUser, 
  onUpdateUser, 
  onUpdateAvatar, 
  isUploading,
  currentTheme,
  onThemeChange,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  const [activeOverlayTab, setActiveOverlayTab] = useState<SettingTab | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: currentUser.fullName || '',
    dob: currentUser.dob || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    companyName: currentUser.companyName || '',
    companyJoinedDate: currentUser.companyJoinedDate || ''
  });

  // Sync profile data when currentUser changes
  useEffect(() => {
    setProfileData({
      fullName: currentUser.fullName || '',
      dob: currentUser.dob || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      companyName: currentUser.companyName || '',
      companyJoinedDate: currentUser.companyJoinedDate || ''
    });
  }, [currentUser]);

  // Verification Modal State
  const [verificationModal, setVerificationModal] = useState<{ type: 'email' | 'phone'; target: string } | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSimulatedBanner, setShowSimulatedBanner] = useState(false);

  // Admin Controls
  const [quotaInputs, setQuotaInputs] = useState({
    PL: settings.quotas.PL,
    SL: settings.quotas.SL,
    CL: settings.quotas.CL
  });

  // Feedback State
  const [feedbackType, setFeedbackType] = useState<'Help' | 'Suggestion'>('Help');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  // Load Feedback with real-time listener (all for Admin, user-specific for Staff)
  useEffect(() => {
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const allFeedbacks = snap.docs.map(d => ({ ...d.data(), id: d.id } as Feedback));
      if (isAdmin) {
        setFeedbackList(allFeedbacks);
      } else {
        setFeedbackList(allFeedbacks.filter(f => f.userId === currentUser.id));
      }
    });
    return () => unsub();
  }, [isAdmin, currentUser.id]);

  // Sync localSettings from props settings
  useEffect(() => {
    setLocalSettings(settings);
    setQuotaInputs({
      PL: settings.quotas.PL,
      SL: settings.quotas.SL,
      CL: settings.quotas.CL
    });
  }, [settings]);

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
  };

  const handleUpdateProfile = async () => {
    const updatedUser: User = {
      ...currentUser,
      fullName: profileData.fullName,
      dob: profileData.dob,
      email: profileData.email,
      phone: profileData.phone,
      companyName: profileData.companyName,
      emailVerified: profileData.email === currentUser.email ? (currentUser.emailVerified || false) : false,
      phoneVerified: profileData.phone === currentUser.phone ? (currentUser.phoneVerified || false) : false
    };
    await onUpdateUser(updatedUser);
    setIsEditingProfile(false);
  };

  const startVerification = (type: 'email' | 'phone') => {
    const target = type === 'email' ? profileData.email : profileData.phone;
    if (!target) return;
    
    // Generate code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setVerificationModal({ type, target });
    setOtpValue('');
    setShowSimulatedBanner(false);
    
    // Trigger simulated top notification slide-in
    setTimeout(() => {
      setShowSimulatedBanner(true);
    }, 1000);
  };

  const handleVerify = async () => {
    if (otpValue !== generatedOtp) {
      alert("Invalid code. Please try again or tap resend.");
      return;
    }
    
    setIsVerifying(true);
    const updated = { ...currentUser };
    if (verificationModal?.type === 'email') {
      updated.emailVerified = true;
    } else {
      updated.phoneVerified = true;
    }
    
    try {
      await onUpdateUser(updated);
      setVerificationModal(null);
      setOtpValue('');
    } catch (err) {
      alert("Sync failed. Please check connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleFeedbackStatus = async (item: Feedback) => {
    try {
      const nextStatus = item.status === 'Resolved' ? 'Open' : 'Resolved';
      await updateDoc(doc(db, "feedbacks", item.id), { status: nextStatus });
    } catch (error) {
      console.error("Failed to update status", error instanceof Error ? error.message : String(error));
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      await deleteDoc(doc(db, "feedbacks", id));
    } catch (error) {
      console.error("Failed to delete", error instanceof Error ? error.message : String(error));
    }
  };

  const adjustQuota = (type: 'PL' | 'SL' | 'CL', amount: number) => {
    setQuotaInputs(prev => {
      const val = prev[type] + amount;
      return {
        ...prev,
        [type]: val < 0 ? 0 : val
      };
    });
  };

  const handleAddHoliday = () => {
    if (newHoliday.date && newHoliday.name.trim()) {
      const updatedHolidays = [...localSettings.holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
      const finalSettings = {
        ...localSettings,
        holidays: updatedHolidays
      };
      setLocalSettings(finalSettings);
      onSave(finalSettings);
      setNewHoliday({ date: '', name: '' });
    }
  };

  const handleRemoveHoliday = (idx: number) => {
    const updatedHolidays = localSettings.holidays.filter((_, i) => i !== idx);
    const finalSettings = {
      ...localSettings,
      holidays: updatedHolidays
    };
    setLocalSettings(finalSettings);
    onSave(finalSettings);
  };

  const menuOptions = [
    {
      id: 'profile' as SettingTab,
      title: 'My Profile',
      desc: 'View and update your personal details, corporate base office, contact info and verify accounts.',
      icon: UserIcon,
      color: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20 shadow-sky-500/5'
    },
    ...(isAdmin ? [
      {
        id: 'system' as SettingTab,
        title: 'Rules & Quotas',
        desc: 'Configure default monthly allowances for Sick (SL), Privilege (PL), and Casual (CL) leaves.',
        icon: Sliders,
        color: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 shadow-amber-500/5'
      },
      {
        id: 'holidays' as SettingTab,
        title: 'Holiday Desk',
        desc: 'Schedule and manage official corporate calendar holidays. Marked auto-approved with active wages.',
        icon: Calendar,
        color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5'
      }
    ] : []),
    {
      id: 'feedback' as SettingTab,
      title: isAdmin ? 'Staff Maildesk' : 'Support Tickets',
      desc: isAdmin ? 'View and resolve staff queries, feedback, and support tickets.' : 'Submit a support packet or suggestion directly to human resources.',
      icon: MessageSquare,
      color: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20 shadow-purple-500/5',
      count: feedbackList.filter(f => f.status === 'Open').length
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-1 sm:px-0 relative">
      
      {/* Settings Header bar with Title & Hamburger Menu */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative">
        <div className="text-left space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Settings</h2>
          <p className="text-xs text-slate-500 font-black uppercase tracking-widest">
            {isAdmin ? "Admin Control Panel & User Configurations" : "Manage your user profile and contact support"}
          </p>
        </div>

        {/* 3-lines hamburger menu trigger */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-lg"
          >
            <Menu size={20} />
          </button>

          {/* Floating Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                {/* Click outside backdrop to close */}
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 glass border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-4"
                >
                  {/* Settings Sections List */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Settings Panels</p>
                    
                    <button
                      onClick={() => {
                        setActiveOverlayTab(null);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left ${
                        activeOverlayTab === null 
                          ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                          : 'bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <UserIcon size={14} />
                      <span>My Profile</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setActiveOverlayTab('system');
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left ${
                            activeOverlayTab === 'system' 
                              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                              : 'bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Sliders size={14} />
                          <span>Rules & Quotas</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveOverlayTab('holidays');
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left ${
                            activeOverlayTab === 'holidays' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Calendar size={14} />
                          <span>Holiday Desk</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setActiveOverlayTab('feedback');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left relative ${
                        activeOverlayTab === 'feedback' 
                          ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                          : 'bg-transparent border border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span className="flex-1 truncate">{isAdmin ? 'Staff Maildesk' : 'Support Tickets'}</span>
                      {feedbackList.filter(f => f.status === 'Open').length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/20 text-rose-400 font-mono ml-auto">
                          {feedbackList.filter(f => f.status === 'Open').length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Theme & Session Section */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Palette size={12} className="text-sky-400" /> Theme & Session
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'midnight', label: 'Blue', color: 'bg-blue-600' },
                        { id: 'obsidian', label: 'Dark', color: 'bg-neutral-800' },
                        { id: 'nordic', label: 'Icy', color: 'bg-cyan-900' }
                      ].map(th => {
                        const isSelected = (currentTheme || 'midnight') === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => {
                              if (onThemeChange) {
                                onThemeChange(th.id as any);
                              } else {
                                document.body.setAttribute('data-theme', th.id);
                                localStorage.setItem('attendify_theme_v11', th.id);
                              }
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                              isSelected 
                                ? 'bg-sky-500/15 border-sky-400 text-sky-400 font-bold' 
                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full mb-1 ${th.color} border border-white/10`} />
                            {th.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Logout Button */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <LogOut size={14} />
                        <span>Sign Out / Log Out</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <main className="flex-1 min-w-0 pb-12">
        <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 relative z-10">
                  <div className="relative cursor-pointer group" onClick={onUpdateAvatar} title="Change Profile Picture">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-sky-400/20 overflow-hidden bg-slate-950 flex items-center justify-center relative shadow-lg">
                      {isUploading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px]">
                          <Loader2 size={20} className="text-sky-400 animate-spin" />
                        </div>
                      )}
                      {currentUser.photoURL ? (
                        <img referrerPolicy="no-referrer" src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={28} className="text-slate-600" />
                      )}
                      
                      {/* Hover / Active Tap Indicator */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center">
                        <Edit3 size={12} className="text-white mb-0.5" />
                        <span className="text-[6px] text-white font-black uppercase tracking-wider">Change</span>
                      </div>
                    </div>
                    
                    <div className="absolute -bottom-0.5 -right-0.5 bg-sky-400 p-1 rounded-full shadow-md text-slate-950">
                      <Edit3 size={9} />
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-sky-500/20 inline-flex items-center gap-1">
                        <Sparkles size={8} /> Active Employee Profile
                      </span>
                      {currentUser.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                          System Admin
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                      {profileData.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                      <Building2 size={12} className="text-slate-500" /> {profileData.companyName || 'Not configured'}
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    <button 
                      onClick={() => {
                        if (isEditingProfile) {
                          // Discard logic
                          setProfileData({
                            fullName: currentUser.fullName || '',
                            dob: currentUser.dob || '',
                            email: currentUser.email || '',
                            phone: currentUser.phone || '',
                            companyName: currentUser.companyName || '',
                            companyJoinedDate: currentUser.companyJoinedDate || ''
                          });
                        }
                        setIsEditingProfile(!isEditingProfile);
                      }} 
                      className={`w-full px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        isEditingProfile 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {isEditingProfile ? 'Discard Changes' : 'Edit Profile'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informational Alerts */}
              {!currentUser.emailVerified && !currentUser.phoneVerified && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Unverified Credentials</h5>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed uppercase">Verify your email and telephone address to enable automated salary report locks and OTP features.</p>
                  </div>
                </div>
              )}

              {/* Profile Details List */}
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Identity Specifications</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* Full Name Field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                      <UserIcon size={11} className="text-slate-400" /> Full Name
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileData.fullName} 
                        onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-sky-500 transition-all font-semibold"
                        placeholder="Employee Full Name"
                      />
                    ) : (
                      <div className="w-full bg-white/5 border border-transparent rounded-xl px-3.5 py-2 text-xs font-black text-white/90 truncate">
                        {profileData.fullName || <span className="text-slate-700 italic font-medium">NOT SET</span>}
                      </div>
                    )}
                  </div>

                  {/* Date of Birth Field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                      <Cake size={11} className="text-slate-400" /> Date of Birth
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="date" 
                        value={profileData.dob} 
                        onChange={e => setProfileData({ ...profileData, dob: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-sky-500 transition-all font-semibold"
                      />
                    ) : (
                      <div className="w-full bg-white/5 border border-transparent rounded-xl px-3.5 py-2 text-xs font-black text-white/90 truncate">
                        {profileData.dob ? formatDate(profileData.dob) : <span className="text-slate-700 italic font-medium">NOT SET</span>}
                      </div>
                    )}
                  </div>

                  {/* Email Field with Verification Trigger */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-0.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Mail size={11} className="text-slate-400" /> Email Address
                      </label>
                      {currentUser.emailVerified ? (
                        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check size={9} /> Verified
                        </span>
                    ) : (
                        profileData.email && !isEditingProfile && (
                          <button 
                            onClick={() => startVerification('email')} 
                            className="text-[8px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full hover:bg-sky-500 hover:text-slate-950 transition-all uppercase tracking-wider"
                          >
                            Verify Address
                          </button>
                        )
                      )}
                    </div>
                    {isEditingProfile ? (
                      <input 
                        type="email" 
                        value={profileData.email} 
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-sky-500 transition-all font-semibold"
                        placeholder="email@company.com"
                      />
                    ) : (
                      <div className="w-full bg-white/5 border border-transparent rounded-xl px-3.5 py-2 text-xs font-black text-white/90 truncate flex justify-between items-center">
                        <span className="truncate">{profileData.email || 'Not configured'}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone Field with Verification Trigger */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-0.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone size={11} className="text-slate-400" /> Phone Number
                      </label>
                      {currentUser.phoneVerified ? (
                        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check size={9} /> Verified
                        </span>
                      ) : (
                        profileData.phone && !isEditingProfile && (
                          <button 
                            onClick={() => startVerification('phone')} 
                            className="text-[8px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full hover:bg-sky-500 hover:text-slate-950 transition-all uppercase tracking-wider"
                          >
                            Verify Contact
                          </button>
                        )
                      )}
                    </div>
                    {isEditingProfile ? (
                      <input 
                        type="tel" 
                        value={profileData.phone} 
                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-sky-500 transition-all font-semibold"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    ) : (
                      <div className="w-full bg-white/5 border border-transparent rounded-xl px-3.5 py-2 text-xs font-black text-white/90 truncate">
                        {profileData.phone || <span className="text-slate-700 italic font-medium">NOT SET</span>}
                      </div>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                      <Building2 size={11} className="text-slate-400" /> Corporate Base Office
                    </label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileData.companyName} 
                        onChange={e => setProfileData({ ...profileData, companyName: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-sky-500 transition-all font-semibold"
                        placeholder="Corporate Name"
                      />
                    ) : (
                      <div className="w-full bg-white/5 border border-transparent rounded-xl px-3.5 py-2 text-xs font-black text-white/90 truncate">
                        {profileData.companyName || <span className="text-slate-700 italic font-medium">NOT SET</span>}
                      </div>
                    )}
                  </div>

                  {/* System UID (Always Read Only) */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                      <Lock size={11} className="text-slate-400" /> Cloud Identifier (UID)
                    </label>
                    <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-500 select-all truncate font-mono">
                      {currentUser.id}
                    </div>
                  </div>

                </div>

                {isEditingProfile && (
                  <div className="pt-2">
                    <button 
                      onClick={handleUpdateProfile} 
                      className="w-full py-3.5 bg-sky-400 text-slate-950 font-black rounded-xl shadow-lg shadow-sky-500/10 active:scale-95 hover:bg-sky-500 transition-all uppercase tracking-widest text-[10px]"
                    >
                      Sync & Lock Identity Records
                    </button>
                  </div>
                )}
              </div>
        </div>
      </main>

      {/* SUB-SETTINGS OVERLAY MODALS */}
      <AnimatePresence>
        {activeOverlayTab !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex justify-center items-start overflow-y-auto p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-4xl bg-slate-900/40 glass border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto space-y-6 text-left"
            >
              {/* Back / Close button at the top of overlay modal */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <button
                  onClick={() => setActiveOverlayTab(null)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all select-none"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Profile</span>
                </button>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">Settings Option</p>
                  <h2 className="text-base font-black text-white uppercase tracking-tight">
                    {activeOverlayTab === 'system' ? 'Rules & Quotas' : activeOverlayTab === 'holidays' ? 'Holiday Desk' : 'Support Tickets'}
                  </h2>
                </div>
              </div>

              <div>
                <AnimatePresence mode="wait">

                  {/* RULES & CONFIG VIEW (ADMIN ONLY) */}
                  {activeOverlayTab === 'system' && isAdmin && (
            <motion.div
              key="system-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-5">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Staff Leaves Allocation Desk</h3>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Configure default monthly / annual quota allowances that auto-reflect on staff accounts.</p>
                </div>

                {/* Tactile Counter Sliders / Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Sick Leave (SL) Counter */}
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-500/20">
                        Sick Leaves (SL)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10 select-none">
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('SL', -1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Minus size={14} />
                      </motion.button>
                      
                      <span className="text-2xl font-black text-white font-mono">{quotaInputs.SL}</span>
                      
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('SL', 1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center">Configured for health logs</p>
                  </div>

                  {/* Privilege Leave (PL) Counter */}
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-sky-500/20">
                        Privilege Leaves (PL)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10 select-none">
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('PL', -1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Minus size={14} />
                      </motion.button>
                      
                      <span className="text-2xl font-black text-white font-mono">{quotaInputs.PL}</span>
                      
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('PL', 1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center">Configured for paid logs</p>
                  </div>

                  {/* Casual Leave (CL) Counter */}
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Casual Leaves (CL)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10 select-none">
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('CL', -1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Minus size={14} />
                      </motion.button>
                      
                      <span className="text-2xl font-black text-white font-mono">{quotaInputs.CL}</span>
                      
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => adjustQuota('CL', 1)}
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center">Configured for personal logs</p>
                  </div>

                </div>

                <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 flex gap-3">
                  <Info size={16} className="text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-[9px] text-slate-400 font-medium leading-relaxed uppercase">
                    Quota adjustments do not retroactively modify locked monthly sheets, but will apply to the current active cycle. Save system rules to commit modifications.
                  </div>
                </div>

                <button 
                  onClick={() => {
                    handleSaveGlobal();
                    alert("System Quotas Updated Successfully.");
                  }} 
                  className="w-full py-4 bg-sky-400 text-slate-950 font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all shadow-lg shadow-sky-500/10"
                >
                  Apply System Quotas
                </button>
              </div>
            </motion.div>
          )}

          {/* HOLIDAY MANAGEMENT VIEW (ADMIN ONLY) */}
          {activeOverlayTab === 'holidays' && isAdmin && (
            <motion.div
              key="holidays-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Add Holiday Form */}
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Holiday Management</h3>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Include company holiday days. These are marked auto-approved with active wages.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Event Date</label>
                    <input 
                      type="date" 
                      value={newHoliday.date} 
                      onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition-all font-semibold" 
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Holiday Name / Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Independence Day, Diwali" 
                      value={newHoliday.name} 
                      onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition-all font-semibold" 
                    />
                  </div>

                  <div className="sm:self-end">
                    <button 
                      onClick={handleAddHoliday}
                      disabled={!newHoliday.date || !newHoliday.name.trim()}
                      className="w-full sm:w-auto px-5 py-3 bg-sky-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-sky-500 transition-all disabled:opacity-40"
                    >
                      Add Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Holiday List Grid */}
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-3.5">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Configured Company Holidays</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                  {localSettings.holidays.map((h, i) => {
                    const parsedDate = h.date ? new Date(h.date) : null;
                    const monthStr = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString('en-US', { month: 'short' }) : 'HOL';
                    const dayStr = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getDate() : '??';
                    const yearStr = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : '';

                    return (
                      <div 
                        key={i} 
                        className="flex justify-between items-center p-3.5 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Calendar Tear-off Leaf Design */}
                          <div className="w-11 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest leading-none">
                              {monthStr}
                            </span>
                            <span className="text-sm font-black text-white leading-none mt-0.5">
                              {dayStr}
                            </span>
                          </div>

                          <div className="min-w-0 text-left">
                            <h5 className="text-xs font-black text-white truncate">{h.name}</h5>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                              {h.date ? formatDate(h.date) : ''}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveHoliday(i)} 
                          className="p-2 text-rose-500 hover:bg-rose-500/15 rounded-xl transition-all"
                          title="Remove Holiday"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}

                  {localSettings.holidays.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-slate-500 text-xs italic font-medium border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
                      No holidays scheduled yet. Include critical events above.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* FEEDBACK & TICKETS VIEW */}
          {activeOverlayTab === 'feedback' && (
            <motion.div
              key="feedback-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Submission desk for non-admins */}
              {!isAdmin && (
                <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-4">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Submit Assistance Request</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Need help or want to suggest a feature? Submit a packet straight to human resources.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Category Selectors */}
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-0.5">Select Packet Category</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'Help', label: 'Support & Help Desk', desc: 'Queries regarding wages, details' },
                          { id: 'Suggestion', label: 'Feature Suggestion', desc: 'Submit system suggestions' }
                        ].map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setFeedbackType(c.id as any)}
                            className={`p-3 rounded-xl border text-left transition-all relative ${
                              feedbackType === c.id 
                                ? 'bg-sky-500/10 border-sky-400 text-white' 
                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10'
                            }`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-wider">{c.label}</p>
                            <p className="text-[8px] text-slate-500 mt-0.5 font-semibold uppercase">{c.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-0.5">Describe Request Details</label>
                      <textarea 
                        value={feedbackMsg} 
                        onChange={e => setFeedbackMsg(e.target.value)} 
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white h-28 resize-none outline-none focus:border-sky-500 transition-all font-semibold" 
                        placeholder="e.g. Please clarify October overtime calculations..." 
                      />
                    </div>

                    <button 
                      disabled={!feedbackMsg.trim() || sendingFeedback} 
                      onClick={async () => {
                        setSendingFeedback(true);
                        const id = `FB-${Date.now()}`;
                        try {
                          await setDoc(doc(db, "feedbacks", id), { 
                            id, 
                            userId: currentUser.id, 
                            userName: currentUser.fullName, 
                            type: feedbackType, 
                            message: feedbackMsg, 
                            status: 'Open', 
                            createdAt: new Date().toISOString() 
                          });
                          setFeedbackMsg('');
                          alert("Ticket Transmitted Successfully.");
                        } catch (e) {
                          alert("Failed to submit.");
                        } finally {
                          setSendingFeedback(false);
                        }
                      }} 
                      className="w-full py-3.5 bg-sky-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-sky-500 transition-all disabled:opacity-40 shadow-lg shadow-sky-500/10"
                    >
                      {sendingFeedback ? 'Transmitting Ticket...' : 'Send Support Ticket'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tickets Queue / Log */}
              <div className="glass p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-3.5">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {isAdmin ? 'Staff Support Maildesk Queue' : 'My Support Tickets'}
                  </h4>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    Total: {feedbackList.length} logs
                  </span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto no-scrollbar pr-1">
                  {feedbackList.map(f => (
                    <div 
                      key={f.id} 
                      className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-none">
                              {f.userName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                              f.type === 'Help' 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            }`}>
                              {f.type}
                            </span>
                          </div>
                          <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider font-mono mt-0.5">
                            ID: {f.id} • {new Date(f.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle Resolve Status for Admins */}
                          {isAdmin ? (
                            <button
                              onClick={() => toggleFeedbackStatus(f)}
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                f.status === 'Resolved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {f.status === 'Resolved' ? 'Resolved ✓' : 'Pending ⏳'}
                            </button>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              f.status === 'Resolved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {f.status === 'Resolved' ? 'Resolved' : 'Active'}
                            </span>
                          )}

                          {/* Delete ticket */}
                          {isAdmin && (
                            <button 
                              onClick={() => deleteFeedback(f.id)} 
                              className="p-1.5 text-rose-500 hover:bg-rose-500/15 rounded-lg transition-all"
                              title="Delete log"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                        "{f.message}"
                      </div>
                    </div>
                  ))}

                  {feedbackList.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs italic font-medium border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
                      {isAdmin ? 'No feedback tickets found in queue.' : 'No tickets submitted yet. Submit a query above if required.'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERIFICATION HANDSET SMARTPHONE SIMULATOR MODAL */}
      <AnimatePresence>
        {verificationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative glass w-full max-w-sm p-5 sm:p-6 rounded-2xl border border-sky-400/20 text-center space-y-5 shadow-2xl overflow-hidden"
            >
              {/* Simulated Handset Status Notification Banner */}
              <AnimatePresence>
                {showSimulatedBanner && (
                  <motion.div
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    className="absolute top-4 left-4 right-4 bg-slate-950/95 border border-sky-400/30 rounded-2xl p-3 shadow-2xl text-left flex items-start gap-2.5 z-50 select-none cursor-pointer"
                    onClick={() => {
                      // Click to auto-fill
                      setOtpValue(generatedOtp);
                    }}
                    title="Tap to auto-fill"
                  >
                    <div className="w-8 h-8 bg-sky-400/10 rounded-xl flex items-center justify-center text-sky-400 shrink-0">
                      <Smartphone size={16} className="animate-bounce" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Notification Simulator</span>
                        <span className="text-[7px] text-slate-500 font-bold uppercase">Just Now</span>
                      </div>
                      <p className="text-[9px] text-white font-bold leading-tight mt-0.5 truncate">
                        Security verification code for {verificationModal.target}
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono font-black mt-1 bg-white/5 px-2 py-0.5 rounded w-fit">
                        Your OTP is: <span className="text-sky-400 tracking-wider text-xs">{generatedOtp}</span> <span className="text-[7px] text-slate-500 font-bold font-sans uppercase ml-1">(Tap to fill)</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Icon & Status */}
              <div className="space-y-2 pt-6">
                <div className="w-14 h-14 bg-sky-400/10 rounded-2xl flex items-center justify-center mx-auto text-sky-400 border border-sky-400/20">
                  <Smartphone size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Security Check</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5">
                    We sent a simulated code to {verificationModal.target}
                  </p>
                </div>
              </div>
              
              {/* OTP Numeric Pin entry */}
              <div className="space-y-2">
                <input 
                  type="text"
                  maxLength={4} 
                  autoFocus
                  value={otpValue} 
                  onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 text-center text-4xl font-black text-sky-400 outline-none focus:border-sky-400 shadow-inner font-mono tracking-widest" 
                  placeholder="0000" 
                />
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">
                  Enter the 4-digit code displayed in the notification banner above
                </p>
              </div>
              
              {/* Action Sheet buttons */}
              <div className="space-y-3.5 pt-2">
                <button 
                  disabled={isVerifying || otpValue.length < 4} 
                  onClick={handleVerify} 
                  className="w-full py-4 bg-sky-400 text-slate-950 font-black rounded-2xl uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-sky-500/10 disabled:opacity-30 transition-all active:scale-[0.98]"
                >
                  {isVerifying ? "Verifying..." : "Confirm Identity"}
                </button>
                
                <button 
                  onClick={() => startVerification(verificationModal.type)}
                  className="w-full py-1 text-[8px] font-black text-slate-500 hover:text-sky-400 uppercase tracking-widest transition-colors"
                >
                  Resend Security Code
                </button>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setVerificationModal(null)} 
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={18} />
              </button>

              {/* Informational Warning footer */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-2.5 text-left select-none">
                <ShieldAlert size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[7px] text-amber-500/70 font-bold leading-normal uppercase">
                  SIMULATION ACTIVE: Wait for the top SMS smartphone notification banner to slide down carrying the passcode. Tap the banner to auto-fill.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SettingsView;
