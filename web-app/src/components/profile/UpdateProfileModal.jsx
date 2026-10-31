import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Palette,
  UploadCloud,
  Check,
  AlertCircle,
  User,
  Settings,
  ShieldCheck,
  FileText,
  RotateCcw,
  KeyRound,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import UserAvatar from '../ui/UserAvatar';
import Button from '../ui/Button';
import StudentMentorConnector from '../mentor/StudentMentorConnector';
import { AVATAR_PRESETS, MONOGRAM_COLORS } from './avatarPresets';

const TABS = [
  { id: 'presets', label: 'Mascot & Icons', icon: Sparkles },
  { id: 'monogram', label: 'Color Monogram', icon: Palette },
  { id: 'custom', label: 'Custom Picture', icon: UploadCloud },
];

export default function UpdateProfileModal({ isOpen, onClose, initialSection = 'profile' }) {
  const { user, updateUser } = useAuth();

  const [section, setSection] = useState(initialSection || 'profile');
  const [activeTab, setActiveTab] = useState('presets');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Initialize or reset form state when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setSection(initialSection || 'profile');
    setFullName(user?.fullName || '');
    setAvatarUrl(user?.avatarUrl || '');
    setBio(user?.bio || '');
    setCustomUrlInput(
      user?.avatarUrl && !user.avatarUrl.startsWith('preset:') && !user.avatarUrl.startsWith('color:')
        ? user.avatarUrl
        : ''
    );
    setErrorMsg(null);
    setSuccessMsg(null);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  useEffect(() => {
    if (isOpen) {
      setSection(initialSection || 'profile');
    }
  }, [isOpen, initialSection]);

  // Handle keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 2 MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target?.result;
      if (dataUri) {
        setAvatarUrl(dataUri);
        setCustomUrlInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    setErrorMsg(null);
  };

  const handleResetAvatar = () => {
    setAvatarUrl('');
    setCustomUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || null,
        bio: bio.trim() || null,
      };

      const response = await userService.updateProfile(payload);
      if (response?.data) {
        // Sync global auth state immediately
        updateUser(response.data);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1100);
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  // Preview user object for real-time live avatar preview
  const previewUser = {
    fullName: fullName || user?.fullName || 'Learner',
    avatarUrl,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E0CC] px-6 py-4 bg-[#F7F3E8]/70">
          <div>
            <h2 id="modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              {section === 'account' ? 'Account Settings' : 'Profile Settings'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {section === 'account'
                ? 'Manage your account credentials, security and mentor connections'
                : 'Personalize your identity and avatar icon'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-[#E8E0CC] px-6 bg-[#F7F3E8]/40">
          <button
            type="button"
            onClick={() => setSection('profile')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              section === 'profile'
                ? 'border-[#7C5CFA] text-[#7C5CFA]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={15} />
            <span>Profile Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('account')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              section === 'account'
                ? 'border-[#7C5CFA] text-[#7C5CFA]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={15} />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-semibold animate-in fade-in duration-150">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-semibold animate-in fade-in duration-150">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {section === 'profile' ? (
            <>
              {/* Live Avatar Preview Card */}
              <div className="flex items-center gap-4 rounded-3xl border border-[#E8E0CC] bg-white p-4 shadow-2xs">
                <div className="relative">
                  <UserAvatar user={previewUser} size="xl" className="ring-4 ring-[#7C5CFA]/15" />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleResetAvatar}
                      title="Reset to default initials"
                      className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-slate-100 border border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition shadow-xs cursor-pointer"
                    >
                      <RotateCcw size={11} />
                    </button>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-slate-900 truncate">
                    {fullName || 'Your Name'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user?.email || 'email@example.com'}
                  </p>
                </div>
              </div>

              {/* Avatar Chooser Section */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Choose Profile Icon
                </label>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#F7F3E8] p-1 border border-[#E8E0CC]">
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-[#7C5CFA] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Mascot & Icons Presets */}
                {activeTab === 'presets' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = avatarUrl === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAvatarUrl(preset.id)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#7C5CFA] bg-[#EFEAFC]/70 shadow-2xs ring-2 ring-[#7C5CFA]/20 scale-102'
                                : 'border-[#E8E0CC] bg-white hover:bg-[#F7F3E8] hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={preset.src}
                              alt={preset.name}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-full">
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Monogram Color Palette */}
                {activeTab === 'monogram' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Pick a custom background color for your two-letter monogram initials.
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-1">
                      {MONOGRAM_COLORS.map((item) => {
                        const isSelected = avatarUrl === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAvatarUrl(item.id)}
                            className={`group relative flex flex-col items-center gap-1 p-1.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#7C5CFA] ring-2 ring-[#7C5CFA]/30 scale-105'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <div
                              className="h-9 w-9 rounded-full grid place-items-center text-white text-xs font-black shadow-2xs"
                              style={{ backgroundColor: item.bg }}
                            >
                              {previewUser.fullName?.charAt(0) || 'L'}
                            </div>
                            <span className="text-[9px] font-semibold text-slate-500 truncate">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Custom Upload or URL */}
                {activeTab === 'custom' && (
                  <div className="space-y-3 p-1">
                    <div className="rounded-2xl border-2 border-dashed border-[#E8E0CC] bg-white p-4 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-file-upload"
                      />
                      <label
                        htmlFor="avatar-file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer gap-2"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#EFEAFC] text-[#7C5CFA]">
                          <UploadCloud size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Upload from your device
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            PNG, JPG or WebP (max 2 MB)
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E8E0CC]" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                        <span className="bg-[#FFFDF7] px-2">or paste image link</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="rounded-2xl bg-[#EFEAFC] border border-[#7C5CFA]/30 px-4 py-2 text-xs font-bold text-[#7C5CFA] hover:bg-[#7C5CFA] hover:text-white transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields: Name, Bio */}
              <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="full-name" className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={15} />
                    </span>
                    <input
                      id="full-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/20 transition"
                    />
                  </div>
                </div>

                {/* Bio / Goal */}
                <div className="space-y-1">
                  <label htmlFor="bio-input" className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Headline / Learning Goal <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400">
                      <FileText size={15} />
                    </span>
                    <textarea
                      id="bio-input"
                      rows={2}
                      maxLength={250}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Aspiring Full-Stack Developer | Learning React & Spring Boot"
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm font-normal text-slate-900 outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/20 transition resize-none"
                    />
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* Account Settings View */
            <div className="space-y-5">
              {/* Account Overview Header */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-white border border-[#E8E0CC] p-4">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {user?.fullName || 'Learner'}
                    </h3>
                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-[#EFEAFC] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7C5CFA]">
                      {user?.role || 'Learner'}
                    </span>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Credentials / Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Account Credentials
                </h4>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Registered Email
                  </label>
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <span className="flex-1 truncate font-medium">{user?.email}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Security & Password
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <KeyRound size={16} className="text-[#7C5CFA] shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">Password Authentication</p>
                        <p className="text-[11px] text-slate-500">Secure credentials via Spring Security & JWT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentor / Cohort Connection */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Mentor Cohort Connection
                </h4>
                <p className="text-xs text-slate-500">
                  Connect with a mentor using their unique cohort key to share diagnostic reports.
                </p>
                <div className="pt-1">
                  <StudentMentorConnector variant="compact" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E8E0CC] px-6 py-4 bg-[#F7F3E8]/70">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition cursor-pointer"
          >
            {section === 'account' ? 'Close' : 'Cancel'}
          </button>
          {section === 'profile' && (
            <Button
              type="submit"
              form="profile-form"
              variant="primary"
              loading={saving}
              disabled={saving || !fullName.trim()}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
