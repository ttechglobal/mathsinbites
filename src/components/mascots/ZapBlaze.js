'use client'

export default function ZapBlaze({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (130 / 110)
  return (
    <svg viewBox="0 0 130 130" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 2.8s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="blG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F5E642"/>
          <stop offset="100%" stopColor="#E8B020"/>
        </radialGradient>
      </defs>
      <circle cx="65" cy="65" r="56" fill="rgba(255,59,48,0.07)" stroke="#FF3B30" strokeWidth="2" strokeDasharray="6 3"/>
      <rect x="48" y="30" width="34" height="70" rx="6" fill="url(#blG)" stroke="#1a1a1a" strokeWidth="2.5"/>
      <polygon points="48,95 82,95 65,115" fill="#FF3B30" stroke="#1a1a1a" strokeWidth="2"/>
      <polygon points="55,95 75,95 65,106" fill="#CC0000"/>
      <rect x="48" y="26" width="34" height="10" rx="4" fill="#FF3B30" stroke="#1a1a1a" strokeWidth="2"/>
      {celebrating ? (
        <>
          <circle cx="57" cy="60" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="73" cy="60" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
          <path d="M52 58 Q57 53 62 58" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M68 58 Q73 53 78 58" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="90" y="30" fontSize="16" fill="#FF3B30">💥</text>
          <text x="21" y="45" fontSize="14" fill="#FF3B30">⭐</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="60" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="73" cy="60" r="8" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="59" cy="60" r="5" fill="#1a1a1a"/>
          <circle cx="75" cy="60" r="5" fill="#1a1a1a"/>
          <circle cx="60.5" cy="58" r="2" fill="white"/>
          <circle cx="76.5" cy="58" r="2" fill="white"/>
        </>
      )}
      {pose === 'wrong'
        ? <path d="M54 74 L57 78 L61 74 L65 78 L69 74 L73 78 L76 74" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M54 72 L57 76 L61 72 L65 76 L69 72 L73 76 L76 72" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      }
      <line x1="30" y1="55" x2="44" y2="60" stroke="#FF3B30" strokeWidth="2" opacity=".7"/>
      <line x1="30" y1="65" x2="44" y2="65" stroke="#FF3B30" strokeWidth="2" opacity=".5"/>
      <line x1="86" y1="55" x2="100" y2="50" stroke="#FF3B30" strokeWidth="2" opacity=".7"/>
      <text x="90" y="30" fontSize="16" fill="#FF3B30">💥</text>
      <text x="21" y="80" fontFamily="Impact,sans-serif" fontSize="11" fill="#FF3B30">ZAP!</text>
    </svg>
  )
}