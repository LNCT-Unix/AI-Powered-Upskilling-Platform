import { memo } from 'react';

/**
 * OctoMascot - The official Octobyte octopus mascot.
 * Fully scalable, animated SVG mascot that can be rendered anywhere (Auth, Navbar, Transition).
 */
const OctoMascot = memo(function OctoMascot({
  size = 320,
  className = '',
  idPrefix = 'octo',
  animated = true,
  withBook = true,
  style = {},
  ariaLabel = 'Octobyte octopus mascot',
}) {
  const bodyGradId = `${idPrefix}-bodyGrad`;
  const tentGradId = `${idPrefix}-tentGrad`;

  return (
    <svg
      className={`octo-mascot-svg ${className}`}
      viewBox="0 0 320 320"
      width={size}
      height={size}
      aria-label={ariaLabel}
      style={{
        display: 'block',
        overflow: 'visible',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        ...style,
      }}
    >
      <defs>
        <linearGradient id={bodyGradId} x1="90" y1="48" x2="232" y2="192" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C7B6FF" />
          <stop offset="1" stopColor="#8F74F2" />
        </linearGradient>
        <linearGradient id={tentGradId} x1="0" y1="160" x2="0" y2="292" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9F85FF" />
          <stop offset="1" stopColor="#6A4DF0" />
        </linearGradient>
      </defs>

      <g className={animated ? 'octo-float' : ''}>
        {/* Tentacles */}
        <g className={animated ? 'tent' : ''} style={{ '--amp': 5, '--d': '0s', transformOrigin: '98px 168px' }}>
          <path d="M98 162 C 70 200, 108 224, 84 262" stroke={`url(#${tentGradId})`} strokeWidth="18" fill="none" strokeLinecap="round" />
        </g>
        <g className={animated ? 'tent' : ''} style={{ '--amp': 7, '--d': '-1.2s', transformOrigin: '128px 178px' }}>
          <path d="M128 172 C 122 214, 92 228, 110 272" stroke={`url(#${tentGradId})`} strokeWidth="20" fill="none" strokeLinecap="round" />
        </g>
        <g className={animated ? 'tent' : ''} style={{ '--amp': 6, '--d': '-2s', transformOrigin: '152px 184px' }}>
          <path d="M152 178 C 158 220, 130 238, 148 282" stroke={`url(#${tentGradId})`} strokeWidth="22" fill="none" strokeLinecap="round" />
        </g>
        <g className={animated ? 'tent' : ''} style={{ '--amp': 6, '--d': '-.7s', transformOrigin: '178px 184px' }}>
          <path d="M178 178 C 172 220, 202 236, 184 278" stroke={`url(#${tentGradId})`} strokeWidth="22" fill="none" strokeLinecap="round" />
        </g>
        <g className={animated ? 'tent' : ''} style={{ '--amp': 7, '--d': '-1.7s', transformOrigin: '204px 178px' }}>
          <path d="M204 172 C 212 214, 242 226, 222 266" stroke={`url(#${tentGradId})`} strokeWidth="20" fill="none" strokeLinecap="round" />
        </g>
        <g className={animated ? 'tent' : ''} style={{ '--amp': 5, '--d': '-2.5s', transformOrigin: '230px 166px' }}>
          <path d="M230 160 C 260 198, 222 224, 248 258" stroke={`url(#${tentGradId})`} strokeWidth="18" fill="none" strokeLinecap="round" />
        </g>

        {/* Head */}
        <ellipse cx="160" cy="118" rx="76" ry="68" fill={`url(#${bodyGradId})`} />
        <ellipse cx="128" cy="80" rx="27" ry="15" fill="#fff" opacity="0.22" transform="rotate(-18 128 80)" />

        {/* Face */}
        <g className={animated ? 'eyes' : ''}>
          <circle cx="134" cy="116" r="11" fill="#2F2A3E" />
          <circle cx="186" cy="116" r="11" fill="#2F2A3E" />
          <circle cx="138" cy="112" r="3.6" fill="#fff" />
          <circle cx="190" cy="112" r="3.6" fill="#fff" />
        </g>
        <circle cx="112" cy="138" r="8" fill="#FFB27A" opacity="0.5" />
        <circle cx="208" cy="138" r="8" fill="#FFB27A" opacity="0.5" />
        <path d="M146 140 Q160 152 174 140" stroke="#2F2A3E" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Open Book */}
        {withBook && (
          <g className={animated ? 'book' : ''}>
            <path d="M160 214 C 138 200, 112 202, 96 210 L96 240 C 114 232, 140 232, 160 244 Z" fill="#FFC93C" />
            <path d="M160 214 C 182 200, 208 202, 224 210 L224 240 C 206 232, 180 232, 160 244 Z" fill="#FFD966" />
            <path d="M160 214 L160 244" stroke="#E8A821" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M108 216 C 122 211, 140 212, 150 218 M108 226 C 122 221, 140 222, 150 228"
              stroke="#E8A821"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M212 216 C 198 211, 180 212, 170 218 M212 226 C 198 221, 180 222, 170 228"
              stroke="#E8A821"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>

      {/* Sparkles */}
      {animated && (
        <>
          <path className="spark" style={{ '--sd': '0s' }} d="M52 62 l3.4 8.6 8.6 3.4 -8.6 3.4 -3.4 8.6 -3.4 -8.6 -8.6 -3.4 8.6 -3.4 Z" fill="#FFC93C" />
          <path className="spark" style={{ '--sd': '1.6s' }} d="M270 88 l2.7 6.8 6.8 2.7 -6.8 2.7 -2.7 6.8 -2.7 -6.8 -6.8 -2.7 6.8 -2.7 Z" fill="#fff" opacity="0.85" />
          <path className="spark" style={{ '--sd': '2.8s' }} d="M282 196 l2.2 5.6 5.6 2.2 -5.6 2.2 -2.2 5.6 -2.2 -5.6 -5.6 -2.2 5.6 -2.2 Z" fill="#FF9838" />
        </>
      )}
    </svg>
  );
});

export default OctoMascot;

