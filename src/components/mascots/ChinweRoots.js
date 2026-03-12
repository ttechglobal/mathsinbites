'use client'

export default function ChinweRoots({ size = 80, pose = 'idle' }) {
  return (
    <svg viewBox="0 0 80 100" width={size} height={size * 1.25}
      style={{ animation: 'float 3.5s ease-in-out infinite' }}>
      <ellipse cx="40" cy="97" rx="15" ry="4" fill="rgba(0,0,0,0.12)" />
      <ellipse cx="40" cy="72" rx="22" ry="20" fill="#C0392B" />
      {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={24 + i * 8} cy={70} r="2.5" fill="none" stroke="#E6B800" strokeWidth="1.5" opacity="0.8" />)}
      {[0, 1, 2, 3].map(i => <circle key={i} cx={28 + i * 8} cy={80} r="2" fill="#E6B800" opacity="0.4" />)}
      <ellipse cx="18" cy="63" rx="7" ry="12" fill="#C0392B" transform="rotate(-8 18 63)" />
      <ellipse cx="62" cy="63" rx="7" ry="12" fill="#C0392B" transform="rotate(8 62 63)" />
      <circle cx="11" cy="73" r="5" fill="#C68642" />
      <circle cx="69" cy="73" r="5" fill="#C68642" />
      <rect x="29" y="85" width="9" height="14" rx="4" fill="#8B4513" />
      <rect x="42" y="85" width="9" height="14" rx="4" fill="#8B4513" />
      <rect x="34" y="46" width="12" height="10" rx="5" fill="#C68642" />
      <ellipse cx="40" cy="35" rx="22" ry="20" fill="#C68642" />
      <ellipse cx="18" cy="34" rx="5" ry="7" fill="#C68642" /><ellipse cx="18" cy="34" rx="2.5" ry="4" fill="#B5763A" />
      <ellipse cx="62" cy="34" rx="5" ry="7" fill="#C68642" /><ellipse cx="62" cy="34" rx="2.5" ry="4" fill="#B5763A" />
      <ellipse cx="40" cy="18" rx="21" ry="11" fill="#111" />
      <path d="M19 19 L19 9 L25 15 L31 7 L37 13 L40 5 L43 13 L49 7 L55 15 L61 9 L61 19 Z" fill="#E6B800" />
      <circle cx="40" cy="5" r="3" fill="#FFD700" />
      <circle cx="31" cy="7" r="2" fill="#FFD700" />
      <circle cx="49" cy="7" r="2" fill="#FFD700" />
      {pose === 'correct' ? <>
        <path d="M30 33 Q34 28 38 33" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M42 33 Q46 28 50 33" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M31 43 Q40 50 49 43" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </> : <>
        <circle cx="33" cy="33" r="5.5" fill="white" /><circle cx="34.5" cy="33" r="3.5" fill="#111" />
        <circle cx="47" cy="33" r="5.5" fill="white" /><circle cx="48.5" cy="33" r="3.5" fill="#111" />
        <circle cx="35.5" cy="31.5" r="1.3" fill="white" /><circle cx="49.5" cy="31.5" r="1.3" fill="white" />
        <path d={pose === 'wrong' ? 'M33 43 Q40 38 47 43' : 'M33 43 Q40 49 47 43'} stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>}
      <ellipse cx="23" cy="39" rx="5" ry="3" fill="#C0392B" opacity="0.35" />
      <ellipse cx="57" cy="39" rx="5" ry="3" fill="#C0392B" opacity="0.35" />
      <rect x="54" y="53" width="12" height="16" rx="3" fill="#1A1F6B" />
      <text x="60" y="64" fontSize="6" fill="#E6B800" textAnchor="middle" fontFamily="serif" fontWeight="900">∑π</text>
    </svg>
  )
}