import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Palette,
  UploadCloud,
  Check,
  AlertCircle,
  User,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import UserAvatar from '../ui/UserAvatar';
import Button from '../ui/Button';
import { AVATAR_PRESETS, MONOGRAM_COLORS } from './avatarPresets';

const TABS = [
  { id: 'presets', label: 'Mascot & Icons', icon: Sparkles },
  { id: 'monogram', label: 'Color Monogram', icon: Palette },
  { id: 'custom', label: 'Custom Picture', icon: UploadCloud },
];

export default function UpdateProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();

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
              Update Profile
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Personalize your identity and avatar icon
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
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

          {/* Live Avatar Preview Card */}
          <div className="flex items-center gap-4 rounded-3xl border border-[#E8E0CC] bg-white p-4 shadow-2xs">
            <div className="relative">
              <UserAvatar user={previewUser} size="xl" className="ring-4 ring-[#7C5CFA]/15" />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  title="Reset to default initials"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-slate-100 border border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition shadow-xs"
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
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
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
                        className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all text-center ${
                          isSelected
                            ? 'border-[#7C5CFA] bg-[#EFEAFC]/50 ring-2 ring-[#7C5CFA]/20 shadow-xs'
                            : 'border-[#E8E0CC] bg-white hover:border-[#7C5CFA]/40 hover:bg-[#F7F3E8]/50'
                        }`}
                      >
                        <div className="transition-transform group-hover:scale-105">
                          {preset.render(42)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#7C5CFA] text-white">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Monogram Color Palette */}
            {activeTab === 'monogram' && (
              <div className="rounded-2xl border border-[#E8E0CC] bg-white p-4 space-y-3">
                <p className="text-xs text-slate-600">
                  Select a bold accent color for your monogram badge initials:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {MONOGRAM_COLORS.map((col) => {
                    const isSelected = avatarUrl === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setAvatarUrl(col.id)}
                        title={col.name}
                        className={`group relative grid h-12 w-full place-items-center rounded-2xl font-black text-sm transition-all shadow-xs ${
                          isSelected
                            ? 'ring-3 ring-offset-2 ring-[#7C5CFA] scale-105'
                            : 'hover:scale-102 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex, color: col.textHex }}
                      >
                        {previewUser.fullName.slice(0, 2).toUpperCase()}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-white text-slate-900 shadow-xs">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Custom Upload / Image URL */}
            {activeTab === 'custom' && (
              <div className="rounded-2xl border border-[#E8E0CC] bg-white p-4 space-y-4">
                {/* File Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-file-upload"
                  />
                  <label
                    htmlFor="avatar-file-upload"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#7C5CFA]/30 bg-[#EFEAFC]/30 p-5 text-center cursor-pointer hover:border-[#7C5CFA] hover:bg-[#EFEAFC]/60 transition"
                  >
                    <UploadCloud size={24} className="text-[#7C5CFA]" />
                    <div className="text-xs">
                      <span className="font-bold text-[#7C5CFA]">Click to upload</span> or drag and drop
                      <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WebP (max 2MB)</p>
                    </div>
                  </label>
                </div>

                {/* External URL Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Or paste an image web link (URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/my-avatar.png"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/15"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-900 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields: Name, Email, Bio */}
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

            {/* Email (Read-only) */}
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed select-all"
              />
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
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E8E0CC] px-6 py-4 bg-[#F7F3E8]/70">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="profile-form"
            variant="primary"
            loading={saving}
            disabled={saving || !fullName.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

