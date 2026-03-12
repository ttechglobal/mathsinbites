'use client'

export default function AdeSpark({ size = 80, pose = 'idle' }) {
  return (
    <svg viewBox="0 0 80 90" width={size} height={size * 1.125}
      style={{ animation: 'dotBounce 2.5s ease-in-out infinite' }}>
      <ellipse cx="40" cy="87" rx="14" ry="4" fill="rgba(0,0,0,0.1)" />
      <rect x="22" y="56" width="36" height="24" rx="10" fill="#FF8C42" />
      <rect x="22" y="56" width="36" height="6" rx="6" fill="#FFB347" />
      <rect x="8" y="58" width="16" height="20" rx="8" fill="#FF8C42" />
      <rect x="56" y="58" width="16" height="20" rx="8" fill="#FF8C42" />
      <circle cx="8" cy="78" r="6" fill="#FFDEAD" />
      <circle cx="72" cy="78" r="6" fill="#FFDEAD" />
      <rect x="27" y="76" width="10" height="14" rx="5" fill="#CC6600" />
      <rect x="43" y="76" width="10" height="14" rx="5" fill="#CC6600" />
      <circle cx="40" cy="33" r="26" fill="#FFD93D" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <line key={i}
          x1={40 + 27 * Math.cos(deg * Math.PI / 180)}
          y1={33 + 27 * Math.sin(deg * Math.PI / 180)}
          x2={40 + 34 * Math.cos(deg * Math.PI / 180)}
          y2={33 + 34 * Math.sin(deg * Math.PI / 180)}
          stroke="#FF8C42" strokeWidth={i % 2 === 0 ? 2.5 : 1.5} strokeLinecap="round" />
      ))}
      {pose === 'correct' ? <>
        <path d="M29 29 Q33 24 37 29" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M43 29 Q47 24 51 29" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M30 42 Q40 50 50 42" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </> : pose === 'wrong' ? <>
        <circle cx="31" cy="30" r="5" fill="white" /><circle cx="32" cy="30" r="3" fill="#333" />
        <circle cx="49" cy="30" r="5" fill="white" /><circle cx="50" cy="30" r="3" fill="#333" />
        <path d="M32 42 Q40 38 48 42" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
      </> : <>
        <circle cx="31" cy="30" r="5.5" fill="white" /><circle cx="32" cy="30" r="3.5" fill="#333" />
        <circle cx="49" cy="30" r="5.5" fill="white" /><circle cx="50" cy="30" r="3.5" fill="#333" />
        <circle cx="33" cy="28.5" r="1.3" fill="white" /><circle cx="51" cy="28.5" r="1.3" fill="white" />
        <path d="M31 41 Q40 49 49 41" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>}
      <ellipse cx="21" cy="37" rx="5" ry="3.5" fill="#FF8C42" opacity="0.5" />
      <ellipse cx="59" cy="37" rx="5" ry="3.5" fill="#FF8C42" opacity="0.5" />
      <rect x="52" y="44" width="12" height="14" rx="3" fill="#4ECDC4" />
      <text x="58" y="53" fontSize="5.5" fill="white" textAnchor="middle" fontFamily="Nunito" fontWeight="900">abc</text>
    </svg>
  )
}