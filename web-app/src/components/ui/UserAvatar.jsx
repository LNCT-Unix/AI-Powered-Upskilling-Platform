import { useState, useMemo } from 'react';
import { AVATAR_PRESETS, MONOGRAM_COLORS } from '../profile/avatarPresets';

const SIZE_MAP = {
  xs: { box: 'h-6 w-6 text-[10px]', px: 24, rounded: 'rounded-lg' },
  sm: { box: 'h-8 w-8 text-xs', px: 32, rounded: 'rounded-xl' },
  md: { box: 'h-10 w-10 text-sm', px: 40, rounded: 'rounded-2xl' },
  lg: { box: 'h-14 w-14 text-base', px: 56, rounded: 'rounded-2xl' },
  xl: { box: 'h-20 w-20 text-xl', px: 80, rounded: 'rounded-3xl' },
  '2xl': { box: 'h-24 w-24 text-2xl', px: 96, rounded: 'rounded-3xl' },
};

export default function UserAvatar({
  user,
  size = 'md',
  className = '',
  overrideAvatar = null, // Can pass preview avatar string directly
}) {
  const [imgError, setImgError] = useState(false);

  const activeAvatar = overrideAvatar !== null ? overrideAvatar : user?.avatarUrl;
  const fullName = user?.fullName;

  const initials = useMemo(() => {
    if (!fullName?.trim()) return 'SP';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // 1. Check if avatar is a preset
  if (activeAvatar?.startsWith('preset:')) {
    const preset = AVATAR_PRESETS.find((p) => p.id === activeAvatar);
    if (preset) {
      return (
        <span
          className={`relative inline-grid shrink-0 place-items-center select-none overflow-hidden shadow-2xs ${sizeConfig.box} ${sizeConfig.rounded} ${className}`}
          title={preset.name}
        >
          {preset.render(sizeConfig.px)}
        </span>
      );
    }
  }

  // 2. Check if avatar is a custom monogram color
  if (activeAvatar?.startsWith('color:')) {
    const colorHex = activeAvatar.replace('color:', '');
    const presetColor = MONOGRAM_COLORS.find((c) => c.hex.toLowerCase() === colorHex.toLowerCase());
    const textHex = presetColor ? presetColor.textHex : '#FFFFFF';

    return (
      <span
        className={`relative inline-grid shrink-0 place-items-center font-black select-none shadow-2xs ${sizeConfig.box} ${sizeConfig.rounded} ${className}`}
        style={{ backgroundColor: colorHex, color: textHex }}
        title={user?.fullName || 'User'}
      >
        {initials}
      </span>
    );
  }

  // 3. Check if avatar is an image URL / data URI
  if (activeAvatar && !imgError) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden bg-slate-100 shadow-2xs select-none ${sizeConfig.box} ${sizeConfig.rounded} ${className}`}
      >
        <img
          src={activeAvatar}
          alt={user?.fullName || 'User avatar'}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  // 4. Default fallback: Minimalist sketch avatar (Notionists style)
  const defaultSketchUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    fullName || user?.username || user?.email || 'Learner'
  )}&backgroundColor=ffffff`;

  if (!imgError) {
    return (
      <span
        className={`relative inline-grid shrink-0 place-items-center bg-white border border-[#E8E0CC] overflow-hidden shadow-2xs select-none rounded-full ${sizeConfig.box} ${className}`}
        title={user?.fullName || 'User'}
      >
        <img
          src={defaultSketchUrl}
          alt={user?.fullName || 'User avatar'}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover scale-110"
        />
      </span>
    );
  }

  // 5. Hard fallback if Dicebear image fails to load: initials
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center font-black bg-[#EFEAFC] text-[#7C5CFA] border border-[#7C5CFA]/30 shadow-2xs select-none rounded-full ${sizeConfig.box} ${className}`}
      title={user?.fullName || 'User'}
    >
      {initials}
    </span>
  );
}

