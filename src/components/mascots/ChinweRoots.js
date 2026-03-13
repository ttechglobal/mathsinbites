'use client'

export default function ChinweRoots({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (130 / 110)
  return (
    <svg viewBox="0 0 130 130" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 3.6s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="rtG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#C0392B"/>
          <stop offset="100%" stopColor="#7B1F1F"/>
        </radialGradient>
      </defs>
      <circle cx="65" cy="65" r="54" fill="rgba(212,160,23,0.09)"/>
      <rect x="48" y="30" width="34" height="70" rx="6" fill="url(#rtG)"/>
      <polygon points="65,36 72,44 65,52 58,44" fill="rgba(255,200,50,0.32)"/>
      <polygon points="57,54 62,60 57,66 52,60" fill="rgba(255,200,50,0.22)"/>
      <polygon points="73,54 78,60 73,66 68,60" fill="rgba(255,200,50,0.22)"/>
      <polygon points="48,95 82,95 65,115" fill="#F5C518"/>
      <polygon points="56,95 74,95 65,107" fill="#D4A017"/>
      <rect x="48" y="26" width="34" height="10" rx="4" fill="#D4A017"/>
      <rect x="48" y="30" width="34" height="6" fill="rgba(255,255,255,0.12)"/>
      {celebrating ? (
        <>
          <path d="M52 61 Q57 56 62 61" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M68 61 Q73 56 78 61" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="27" y="50" fontSize="14">🇳🇬</text>
          <text x="86" y="58" fontFamily="Courier New,monospace" fontSize="13" fill="#D4A017" opacity=".85">★</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="63" r="7" fill="white"/>
          <circle cx="73" cy="63" r="7" fill="white"/>
          <circle cx="59" cy="63" r="4" fill="#1a0a00"/>
          <circle cx="75" cy="63" r="4" fill="#1a0a00"/>
          <circle cx="60" cy="61" r="1.5" fill="white"/>
          <circle cx="76" cy="61" r="1.5" fill="white"/>
        </>
      )}
      {pose === 'wrong'
        ? <path d="M57 76 Q65 70 73 76" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        : <path d="M57 74 Q65 80 73 74" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      }
      <ellipse cx="65" cy="32" rx="18" ry="7" fill="#D4A017" opacity=".5"/>
      <text x="27" y="50" fontSize="14">🇳🇬</text>
      <text x="86" y="58" fontFamily="Courier New,monospace" fontSize="13" fill="#D4A017" opacity=".85">Σ</text>
    </svg>
  )
}