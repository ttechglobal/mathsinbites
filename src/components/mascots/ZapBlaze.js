'use client'

export default function ZapBlaze({ size = 80, pose = 'idle' }) {
  return (
    <svg viewBox="0 0 80 100" width={size} height={size * 1.25}
      style={{
        animation: pose === 'idle' ? 'floatSlow 3s ease-in-out infinite'
          : pose === 'correct' ? 'comicPop 0.4s ease'
          : 'shake 0.4s ease'
      }}>
      <ellipse cx="40" cy="97" rx="16" ry="4" fill="rgba(0,0,0,0.2)" />
      <path d="M18 48 L8 85 L28 72 L40 84 L52 72 L72 85 L62 48 Z" fill="#E63946" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="20" y="46" width="40" height="34" rx="8" fill="#1D3557" stroke="#0d0d0d" strokeWidth="2.2" />
      <polygon points="40,50 35,60 39,60 36,70 45,57 41,57" fill="#FFD700" stroke="#0d0d0d" strokeWidth="1.2" />
      <rect x="22" y="77" width="13" height="16" rx="6" fill="#1D3557" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="45" y="77" width="13" height="16" rx="6" fill="#1D3557" stroke="#0d0d0d" strokeWidth="2" />
      <ellipse cx="28" cy="93" rx="9" ry="4.5" fill="#E63946" stroke="#0d0d0d" strokeWidth="1.8" />
      <ellipse cx="52" cy="93" rx="9" ry="4.5" fill="#E63946" stroke="#0d0d0d" strokeWidth="1.8" />
      <rect x="6" y="48" width="14" height="26" rx="7" fill="#1D3557" stroke="#0d0d0d" strokeWidth="2" transform="rotate(-15 6 48)" />
      <rect x="60" y="48" width="14" height="26" rx="7" fill="#1D3557" stroke="#0d0d0d" strokeWidth="2" transform="rotate(15 60 48)" />
      <circle cx="6" cy="72" r="7.5" fill="#C68642" stroke="#0d0d0d" strokeWidth="2" />
      <circle cx="74" cy="72" r="7.5" fill="#C68642" stroke="#0d0d0d" strokeWidth="2" />
      <rect x="34" y="38" width="12" height="10" rx="5" fill="#C68642" stroke="#0d0d0d" strokeWidth="1.8" />
      <ellipse cx="40" cy="25" rx="24" ry="22" fill="#C68642" stroke="#0d0d0d" strokeWidth="2.5" />
      <path d="M16 22 Q22 12 34 17 L34 25 Q22 20 16 30 Z" fill="#E63946" stroke="#0d0d0d" strokeWidth="1.5" />
      <path d="M64 22 Q58 12 46 17 L46 25 Q58 20 64 30 Z" fill="#E63946" stroke="#0d0d0d" strokeWidth="1.5" />
      <path d="M16 26 Q15 8 25 5 Q32 2 40 3 Q48 2 55 5 Q65 8 64 26" fill="#0d0d0d" stroke="#0d0d0d" strokeWidth="2" />
      {pose === 'correct' ? <>
        <path d="M28 24 Q32 19 36 24" stroke="#0d0d0d" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M44 24 Q48 19 52 24" stroke="#0d0d0d" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 35 Q40 43 52 35" stroke="#0d0d0d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </> : <>
        <ellipse cx="30" cy="25" rx="6.5" ry="5.5" fill="white" stroke="#0d0d0d" strokeWidth="1.2" />
        <ellipse cx="50" cy="25" rx="6.5" ry="5.5" fill="white" stroke="#0d0d0d" strokeWidth="1.2" />
        <circle cx="31" cy="25" r="3.5" fill="#0d0d0d" />
        <circle cx="51" cy="25" r="3.5" fill="#0d0d0d" />
        <circle cx="32.5" cy="23.5" r="1.3" fill="white" />
        <circle cx="52.5" cy="23.5" r="1.3" fill="white" />
        <path d={pose === 'wrong' ? 'M32 36 Q40 31 48 36' : 'M31 36 Q40 42 49 36'} stroke="#0d0d0d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>}
      {pose === 'correct' && <text x="62" y="16" fontSize="12" fontFamily="Bangers" fill="#FFD700" stroke="#0d0d0d" strokeWidth="0.8" paintOrder="stroke" transform="rotate(12 62 16)">POW!</text>}
    </svg>
  )
}