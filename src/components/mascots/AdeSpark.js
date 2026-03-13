'use client'

export default function AdeSpark({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (130 / 110)
  return (
    <svg viewBox="0 0 130 130" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 3.2s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="spG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FF8C42"/>
          <stop offset="100%" stopColor="#E85D04"/>
        </radialGradient>
      </defs>
      <circle cx="65" cy="65" r="54" fill="rgba(255,140,66,0.1)"/>
      <rect x="48" y="30" width="34" height="70" rx="6" fill="url(#spG)"/>
      <polygon points="48,95 82,95 65,115" fill="#FCD34D"/>
      <polygon points="56,95 74,95 65,107" fill="#F59E0B"/>
      <rect x="48" y="26" width="34" height="10" rx="4" fill="#FCD34D"/>
      <rect x="48" y="30" width="34" height="6" fill="rgba(255,255,255,0.18)"/>
      {celebrating ? (
        <>
          <path d="M52 58 Q57 53 62 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M68 58 Q73 53 78 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="22" y="48" fontSize="16" fill="#FCD34D">⭐</text>
          <text x="88" y="42" fontSize="12" fill="#FF8C42">✨</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="60" r="7" fill="white"/>
          <circle cx="73" cy="60" r="7" fill="white"/>
          <circle cx="59" cy="60" r="4" fill="#5C2E00"/>
          <circle cx="75" cy="60" r="4" fill="#5C2E00"/>
          <circle cx="60" cy="58" r="1.5" fill="white"/>
          <circle cx="76" cy="58" r="1.5" fill="white"/>
        </>
      )}
      {pose === 'wrong'
        ? <path d="M55 74 Q65 68 75 74" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        : <path d="M55 70 Q65 80 75 70" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      }
      <circle cx="50" cy="67" r="5" fill="rgba(255,180,120,0.35)"/>
      <circle cx="80" cy="67" r="5" fill="rgba(255,180,120,0.35)"/>
      <text x="24" y="48" fontSize="16" fill="#FCD34D">✨</text>
      <text x="88" y="42" fontSize="12" fill="#FF8C42">✨</text>
      <text x="30" y="90" fontSize="10" fill="#FCD34D">⭐</text>
    </svg>
  )
}