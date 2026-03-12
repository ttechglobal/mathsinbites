export default function KolaNova({ size = 80, pose = 'idle' }) {
  const celebrating = pose === 'correct' || pose === 'celebrate'
  return (
    <svg viewBox="0 0 80 96" width={size} height={size * 1.2}
      style={{ animation: pose === 'idle' ? 'float 3s ease-in-out infinite' : pose === 'correct' ? 'pop 0.4s ease' : 'none' }}>
      {/* Shadow */}
      <ellipse cx="40" cy="93" rx="16" ry="4" fill="rgba(0,0,0,0.25)" />
      {/* Shoes */}
      <ellipse cx="28" cy="88" rx="10" ry="5" fill="#0F0C29" />
      <ellipse cx="52" cy="88" rx="10" ry="5" fill="#0F0C29" />
      <ellipse cx="29" cy="87" rx="7" ry="3" fill="#A3E635" />
      <ellipse cx="53" cy="87" rx="7" ry="3" fill="#A3E635" />
      {/* Legs */}
      <rect x="25" y="68" width="11" height="22" rx="5.5" fill="#4C1D95" />
      <rect x="44" y="68" width="11" height="22" rx="5.5" fill="#4C1D95" />
      {/* Body */}
      <ellipse cx="40" cy="62" rx="21" ry="17" fill="#5B21B6" />
      {/* Badge on chest */}
      <rect x="33" y="65" width="14" height="10" rx="5" fill="#4C1D95" />
      <text x="40" y="73" fontSize="7" fill="#FCD34D" fontFamily="serif" fontWeight="900" textAnchor="middle">∑</text>
      {/* Arms */}
      <ellipse cx="19" cy="59" rx="6" ry="11" fill="#5B21B6" transform="rotate(-12 19 59)" />
      <ellipse cx="61" cy="59" rx="6" ry="11" fill="#5B21B6" transform="rotate(12 61 59)" />
      {/* Hands */}
      <circle cx="13" cy="68" r="5.5" fill="#C68642" />
      <circle cx="67" cy="68" r="5.5" fill="#C68642" />
      {/* Neck */}
      <rect x="34" y="42" width="12" height="10" rx="5" fill="#C68642" />
      {/* Head */}
      <ellipse cx="40" cy="33" rx="22" ry="20" fill="#C68642" />
      {/* Ears */}
      <ellipse cx="18" cy="32" rx="5" ry="7" fill="#C68642" />
      <ellipse cx="18" cy="32" rx="2.5" ry="4.5" fill="#B5763A" />
      <ellipse cx="62" cy="32" rx="5" ry="7" fill="#C68642" />
      <ellipse cx="62" cy="32" rx="2.5" ry="4.5" fill="#B5763A" />
      {/* Hair */}
      <ellipse cx="40" cy="16" rx="20" ry="10" fill="#0F0C29" />
      <circle cx="24" cy="15" r="6.5" fill="#0F0C29" />
      <circle cx="34" cy="10" r="8" fill="#0F0C29" />
      <circle cx="44" cy="10" r="8" fill="#0F0C29" />
      <circle cx="55" cy="14" r="7" fill="#0F0C29" />
      {/* Eyes */}
      {celebrating ? (
        <>
          <path d="M30 31 Q34 27 38 31" stroke="#0F0C29" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M42 31 Q46 27 50 31" stroke="#0F0C29" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="5.5" fill="white" />
          <circle cx="33" cy="32" r="3.5" fill="#0F0C29" />
          <circle cx="48" cy="32" r="5.5" fill="white" />
          <circle cx="49" cy="32" r="3.5" fill="#0F0C29" />
          <circle cx="34" cy="31" r="1.2" fill="white" />
          <circle cx="50" cy="31" r="1.2" fill="white" />
        </>
      )}
      {/* Mouth */}
      {pose === 'wrong'
        ? <path d="M34 43 Q40 38 46 43" stroke="#0F0C29" strokeWidth="2" fill="none" strokeLinecap="round" />
        : <path d="M34 42 Q40 48 46 42" stroke="#0F0C29" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      }
      {/* Celebrate stars */}
      {celebrating && (
        <>
          <text x="6" y="22" fontSize="12">⭐</text>
          <text x="62" y="18" fontSize="10">✨</text>
        </>
      )}
      {/* Notebook */}
      <rect x="54" y="50" width="12" height="16" rx="4" fill="#5B21B6" />
      <text x="60" y="57" fontSize="4.5" fill="#FCD34D" textAnchor="middle" fontFamily="serif">π x²</text>
    </svg>
  )
}