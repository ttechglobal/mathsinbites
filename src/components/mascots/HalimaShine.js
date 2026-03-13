'use client'

export default function HalimaShine({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  const h = size * (138 / 110)
  return (
    <svg viewBox="0 0 130 138" width={size} height={h}
      style={{ animation: pose === 'idle' ? 'float 3.4s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      <defs>
        <radialGradient id="hlG" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#C46428"/>
          <stop offset="100%" stopColor="#7A3510"/>
        </radialGradient>
        <linearGradient id="hlCap" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E4FA3"/>
          <stop offset="100%" stopColor="#0E2D6B"/>
        </linearGradient>
        <linearGradient id="hlTip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD84D"/>
          <stop offset="100%" stopColor="#C49A00"/>
        </linearGradient>
        <radialGradient id="hlGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(196,100,40,0.22)"/>
          <stop offset="100%" stopColor="rgba(196,100,40,0)"/>
        </radialGradient>
      </defs>

      <circle cx="65" cy="68" r="56" fill="url(#hlGlow)"/>

      {/* Pencil body */}
      <rect x="48" y="32" width="34" height="68" rx="6" fill="url(#hlG)"/>

      {/* Tip */}
      <polygon points="48,96 82,96 65,116" fill="url(#hlTip)"/>
      <polygon points="54,96 76,96 65,109" fill="#A07A00"/>

      {/* Eraser cap — navy */}
      <rect x="48" y="24" width="34" height="12" rx="5" fill="url(#hlCap)"/>
      <rect x="48" y="24" width="34" height="5" fill="rgba(255,255,255,0.12)" rx="5"/>

      {/* Mortarboard */}
      <rect x="38" y="19" width="54" height="7" rx="3" fill="#0E2D6B"/>
      <rect x="54" y="10" width="22" height="10" rx="3" fill="#1E4FA3"/>
      <line x1="76" y1="14" x2="84" y2="22" stroke="#FFD84D" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="84" cy="23" r="2.5" fill="#FFD84D"/>

      {/* Eyes */}
      {celebrating ? (
        <>
          <path d="M50 60 Q57 54 64 60" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M66 60 Q73 54 80 60" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x="20" y="52" fontSize="11" fill="#FFD84D" opacity=".85">★</text>
          <text x="93" y="50" fontSize="14" fill="#FFD84D" opacity=".85">⭐</text>
        </>
      ) : (
        <>
          <circle cx="57" cy="62" r="7.5" fill="white"/>
          <circle cx="73" cy="62" r="7.5" fill="white"/>
          <circle cx="59" cy="62" r="4.5" fill="#1C0800"/>
          <circle cx="75" cy="62" r="4.5" fill="#1C0800"/>
          <circle cx="60" cy="60" r="1.8" fill="white"/>
          <circle cx="76" cy="60" r="1.8" fill="white"/>
        </>
      )}

      {/* Mouth */}
      {pose === 'wrong'
        ? <path d="M54 77 Q65 72 76 77" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
        : <path d="M54 75 Q65 86 76 75" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      }

      {/* Cheeks */}
      <circle cx="48" cy="68" r="5.5" fill="rgba(255,160,100,0.3)"/>
      <circle cx="82" cy="68" r="5.5" fill="rgba(255,160,100,0.3)"/>

      {/* Decorative */}
      <g transform="translate(20,74)" opacity=".7">
        <rect x="0" y="0" width="10" height="12" rx="1" fill="#FFD84D"/>
        <rect x="5" y="0" width="10" height="12" rx="1" fill="#FFC000"/>
        <line x1="5" y1="0" x2="5" y2="12" stroke="#7A3510" strokeWidth="1"/>
      </g>
      <text x="93" y="50" fontSize="14" fill="#FFD84D" opacity=".85">★</text>
      <text x="20" y="52" fontFamily="Courier New,monospace" fontSize="11" fill="#FFD84D" opacity=".65">∑</text>
      <text x="97" y="78" fontFamily="Courier New,monospace" fontSize="12" fill="rgba(200,241,53,0.55)">x²</text>
    </svg>
  )
}