'use client'

export default function KolaNova({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (130 / 110)
  return (
    <svg viewBox="0 0 130 130" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 3s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="nvG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#2D1B69"/>
        </radialGradient>
        <radialGradient id="nvGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(124,58,237,0.35)"/>
          <stop offset="100%" stopColor="rgba(124,58,237,0)"/>
        </radialGradient>
      </defs>
      <circle cx="65" cy="65" r="56" fill="url(#nvGlow)"/>
      <rect x="48" y="30" width="34" height="70" rx="6" fill="url(#nvG)"/>
      <polygon points="48,95 82,95 65,115" fill="#FCD34D"/>
      <polygon points="55,95 75,95 65,108" fill="#F59E0B"/>
      <rect x="48" y="26" width="34" height="10" rx="4" fill="#A3E635"/>
      <rect x="48" y="30" width="34" height="6" fill="rgba(255,255,255,0.12)"/>
      {celebrating ? (
        <>
          <path d="M52 58 Q57 53 62 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M68 58 Q73 53 78 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="26" y="46" fontSize="14" fill="#FCD34D">⭐</text>
          <text x="86" y="42" fontSize="12" fill="#A3E635">✨</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="60" r="7" fill="white"/>
          <circle cx="73" cy="60" r="7" fill="white"/>
          <circle cx="59" cy="60" r="4" fill="#1a0a3d"/>
          <circle cx="75" cy="60" r="4" fill="#1a0a3d"/>
          <circle cx="60" cy="58" r="1.5" fill="white"/>
          <circle cx="76" cy="58" r="1.5" fill="white"/>
        </>
      )}
      {pose === 'wrong'
        ? <path d="M57 76 Q65 70 73 76" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        : <path d="M57 72 Q65 78 73 72" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      }
      <text x="26" y="46" fontSize="14" fill="#FCD34D" opacity=".9">★</text>
      <text x="92" y="50" fontSize="10" fill="#A3E635" opacity=".85">✦</text>
      <text x="86" y="38" fontFamily="Courier New,monospace" fontSize="13" fill="#A5B4FC" opacity=".8">π</text>
    </svg>
  )
}