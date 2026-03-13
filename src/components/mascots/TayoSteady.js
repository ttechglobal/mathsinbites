'use client'

export default function TayoSteady({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (130 / 110)
  return (
    <svg viewBox="0 0 130 130" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 3.4s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="nmG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0d9488"/>
          <stop offset="100%" stopColor="#065f56"/>
        </radialGradient>
      </defs>
      <circle cx="65" cy="65" r="54" fill="rgba(13,148,136,0.08)"/>
      <rect x="48" y="30" width="34" height="70" rx="6" fill="url(#nmG)"/>
      <polygon points="48,95 82,95 65,115" fill="#F97316"/>
      <polygon points="56,95 74,95 65,107" fill="#EA580C"/>
      <rect x="48" y="26" width="34" height="10" rx="4" fill="#A3E635"/>
      <rect x="48" y="30" width="34" height="6" fill="rgba(255,255,255,0.13)"/>
      {celebrating ? (
        <>
          <path d="M52 58 Q57 53 62 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M68 58 Q73 53 78 58" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="88" y="52" fontFamily="Courier New,monospace" fontSize="13" fill="#A3E635" opacity=".9">★</text>
          <text x="25" y="60" fontFamily="Courier New,monospace" fontSize="14" fill="#0d9488" opacity=".9">✓</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="60" r="7" fill="white"/>
          <circle cx="73" cy="60" r="7" fill="white"/>
          <circle cx="59" cy="60" r="4" fill="#1a2e1a"/>
          <circle cx="75" cy="60" r="4" fill="#1a2e1a"/>
          <circle cx="60" cy="58" r="1.5" fill="white"/>
          <circle cx="76" cy="58" r="1.5" fill="white"/>
        </>
      )}
      {pose === 'wrong'
        ? <path d="M57 76 Q65 70 73 76" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        : <path d="M57 72 Q65 78 73 72" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      }
      <path d="M50 57 Q57 53 64 57" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
      <path d="M66 57 Q73 53 80 57" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
      <text x="88" y="52" fontFamily="Courier New,monospace" fontSize="13" fill="#A3E635" opacity=".9">√</text>
      <text x="25" y="60" fontFamily="Courier New,monospace" fontSize="14" fill="#0d9488" opacity=".7">x²</text>
    </svg>
  )
}