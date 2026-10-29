// Curated presets for OctoByte avatars and monogram color themes

export const AVATAR_PRESETS = [
  {
    id: 'preset:octo-coder',
    name: 'Octo Coder',
    category: 'Mascot',
    bgColor: '#EFEAFC',
    accentColor: '#7C5CFA',
    description: 'Master of algorithms & clean code',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#EFEAFC" />
        <circle cx="20" cy="18" r="9" fill="#7C5CFA" />
        <circle cx="17" cy="17" r="1.5" fill="#FFFFFF" />
        <circle cx="23" cy="17" r="1.5" fill="#FFFFFF" />
        <path d="M18.5 21C19.2 21.8 20.8 21.8 21.5 21" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        {/* Tentacles */}
        <path d="M12 24C12 28 14 29 16 28C18 27 18 30 20 30C22 30 22 27 24 28C26 29 28 28 28 24" stroke="#7C5CFA" strokeWidth="2.5" strokeLinecap="round" />
        {/* Code glyph */}
        <path d="M8 18L5 20L8 22" stroke="#FF9838" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 18L35 20L32 22" stroke="#FF9838" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'preset:octo-astronaut',
    name: 'Octo Cosmo',
    category: 'Mascot',
    bgColor: '#1E1B4B',
    accentColor: '#818CF8',
    description: 'Reaching for the stars & constellations',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#1E1B4B" />
        {/* Helmet ring */}
        <circle cx="20" cy="18" r="11" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="20" cy="18" r="8" fill="#4338CA" />
        {/* Visor reflection */}
        <ellipse cx="20" cy="18" rx="6" ry="5" fill="#06B6D4" fillOpacity="0.8" />
        <circle cx="18" cy="16" r="1.2" fill="#FFFFFF" />
        <circle cx="22" cy="16" r="1.2" fill="#FFFFFF" />
        {/* Stars */}
        <circle cx="9" cy="10" r="1" fill="#FCD34D" />
        <circle cx="31" cy="12" r="1.2" fill="#FCD34D" />
        <circle cx="30" cy="30" r="0.8" fill="#FFFFFF" />
        {/* Little thrusters */}
        <path d="M14 26C14 29 17 29 18 27C19 28 21 28 22 27C23 29 26 29 26 26" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'preset:octo-wizard',
    name: 'Octo Wizard',
    category: 'Mascot',
    bgColor: '#FEF3C7',
    accentColor: '#D97706',
    description: 'Brewing logic spells and neural nets',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#FEF3C7" />
        <circle cx="20" cy="20" r="8.5" fill="#9333EA" />
        <circle cx="17.5" cy="19" r="1.3" fill="#FFFFFF" />
        <circle cx="22.5" cy="19" r="1.3" fill="#FFFFFF" />
        <path d="M19 23C19.7 23.6 20.3 23.6 21 23" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        {/* Wizard hat */}
        <path d="M12 14L20 4L28 14H12Z" fill="#7C3AED" />
        <ellipse cx="20" cy="14" rx="9" ry="2" fill="#F59E0B" />
        <circle cx="20" cy="4" r="1.5" fill="#FDE047" />
        {/* Wand */}
        <path d="M28 22L34 28" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
        <path d="M33 24L35 24M34 23L34 25" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'preset:octo-scholar',
    name: 'Octo Scholar',
    category: 'Mascot',
    bgColor: '#ECFDF5',
    accentColor: '#059669',
    description: 'Eager learner pursuing high mastery',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#ECFDF5" />
        <circle cx="20" cy="21" r="8.5" fill="#0D9488" />
        <circle cx="17" cy="20" r="1.3" fill="#FFFFFF" />
        <circle cx="23" cy="20" r="1.3" fill="#FFFFFF" />
        {/* Glasses */}
        <circle cx="17" cy="20" r="3" stroke="#F59E0B" strokeWidth="1.2" />
        <circle cx="23" cy="20" r="3" stroke="#F59E0B" strokeWidth="1.2" />
        <path d="M20 20H20.5" stroke="#F59E0B" strokeWidth="1.2" />
        {/* Mortarboard */}
        <polygon points="20,7 30,12 20,15 10,12" fill="#1E293B" />
        <path d="M28 14V19" stroke="#E11D48" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="28" cy="19.5" r="1" fill="#E11D48" />
      </svg>
    ),
  },
  {
    id: 'preset:octo-ninja',
    name: 'Octo Ninja',
    category: 'Mascot',
    bgColor: '#FFE4E6',
    accentColor: '#E11D48',
    description: 'Fast, stealthy problem solver',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#FFE4E6" />
        <circle cx="20" cy="19" r="8.5" fill="#334155" />
        {/* Red Headband */}
        <path d="M11.5 15C15 14 25 14 28.5 15L28 17.5C25 16.5 15 16.5 12 17.5L11.5 15Z" fill="#E11D48" />
        {/* Headband knot tail */}
        <path d="M28 16L32 18M28 17L33 21" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" />
        {/* Ninja eyes */}
        <path d="M15 19L18 20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M25 19L22 20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Tentacles */}
        <path d="M14 26C14 29 17 29 18 27C19 28 21 28 22 27C23 29 26 29 26 26" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'preset:octo-cyberpunk',
    name: 'Cyber Octo',
    category: 'Mascot',
    bgColor: '#0F172A',
    accentColor: '#22D3EE',
    description: 'Living in the digital metaverse',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#0F172A" />
        <circle cx="20" cy="18" r="8.5" fill="#6366F1" />
        {/* Cyber Visor */}
        <rect x="13" y="15" width="14" height="5" rx="2.5" fill="#F43F5E" />
        <line x1="14" y1="17.5" x2="26" y2="17.5" stroke="#FDE047" strokeWidth="1.2" strokeDasharray="2 1" />
        {/* Circuit lines */}
        <path d="M6 10H10V14" stroke="#22D3EE" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="6" cy="10" r="1.2" fill="#22D3EE" />
        <path d="M34 30H30V26" stroke="#A855F7" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="34" cy="30" r="1.2" fill="#A855F7" />
        {/* Tentacles */}
        <path d="M13 25C13 29 16 29 18 27C19 28 21 28 22 27C24 29 27 29 27 25" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'preset:tech-terminal',
    name: 'Code Terminal',
    category: 'Tech',
    bgColor: '#18181B',
    accentColor: '#4ADE80',
    description: 'Command line power user',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#18181B" />
        {/* Header dots */}
        <circle cx="10" cy="11" r="1.5" fill="#EF4444" />
        <circle cx="14" cy="11" r="1.5" fill="#F59E0B" />
        <circle cx="18" cy="11" r="1.5" fill="#10B981" />
        {/* Prompt */}
        <path d="M11 20L15 23L11 26" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="26" x2="25" y2="26" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        {/* Code line 2 */}
        <line x1="11" y1="31" x2="20" y2="31" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'preset:tech-brain',
    name: 'AI Neural Core',
    category: 'Tech',
    bgColor: '#FDF2F8',
    accentColor: '#DB2777',
    description: 'Deep learner & synaptic thinker',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#FDF2F8" />
        <circle cx="20" cy="20" r="10" stroke="#DB2777" strokeWidth="1.8" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="5" fill="#F472B6" />
        {/* Nodes */}
        <circle cx="15" cy="14" r="2" fill="#BE185D" />
        <circle cx="25" cy="14" r="2" fill="#BE185D" />
        <circle cx="13" cy="23" r="2" fill="#BE185D" />
        <circle cx="27" cy="23" r="2" fill="#BE185D" />
        {/* Interconnects */}
        <line x1="15" y1="14" x2="20" y2="20" stroke="#DB2777" strokeWidth="1.2" />
        <line x1="25" y1="14" x2="20" y2="20" stroke="#DB2777" strokeWidth="1.2" />
        <line x1="13" y1="23" x2="20" y2="20" stroke="#DB2777" strokeWidth="1.2" />
        <line x1="27" y1="23" x2="20" y2="20" stroke="#DB2777" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'preset:tech-rocket',
    name: 'Apollo Launcher',
    category: 'Tech',
    bgColor: '#EFF6FF',
    accentColor: '#2563EB',
    description: 'Accelerating career trajectory',
    render: (size = 36) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#EFF6FF" />
        {/* Rocket body */}
        <path d="M26 14C26 14 26 8 20 8C14 8 14 14 14 14C14 21 16 25 20 27C24 25 26 21 26 14Z" fill="#2563EB" />
        {/* Porthole */}
        <circle cx="20" cy="15" r="2.5" fill="#93C5FD" stroke="#FFFFFF" strokeWidth="1" />
        {/* Fins */}
        <path d="M14 19L10 24H14V19Z" fill="#1D4ED8" />
        <path d="M26 19L30 24H26V19Z" fill="#1D4ED8" />
        {/* Flame */}
        <path d="M17 27C17 31 20 33 20 33C20 33 23 31 23 27H17Z" fill="#F97316" />
        <path d="M18.5 27C18.5 29.5 20 31 20 31C20 31 21.5 29.5 21.5 27H18.5Z" fill="#FDE047" />
      </svg>
    ),
  },
];

export const MONOGRAM_COLORS = [
  { id: 'color:#7C5CFA', name: 'Octo Violet', hex: '#7C5CFA', textHex: '#FFFFFF' },
  { id: 'color:#FFC93C', name: 'Sunbeam Gold', hex: '#FFC93C', textHex: '#1E1B4B' },
  { id: 'color:#10B981', name: 'Emerald Peak', hex: '#10B981', textHex: '#FFFFFF' },
  { id: 'color:#3B82F6', name: 'Electric Sky', hex: '#3B82F6', textHex: '#FFFFFF' },
  { id: 'color:#F43F5E', name: 'Neon Rose', hex: '#F43F5E', textHex: '#FFFFFF' },
  { id: 'color:#F97316', name: 'Solar Flame', hex: '#F97316', textHex: '#FFFFFF' },
  { id: 'color:#06B6D4', name: 'Cyber Cyan', hex: '#06B6D4', textHex: '#082F49' },
  { id: 'color:#1E293B', name: 'Slate Onyx', hex: '#1E293B', textHex: '#FFFFFF' },
];

