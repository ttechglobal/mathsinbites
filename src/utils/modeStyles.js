export function cardStyle(M) {
  return {
    background: M.cardBg,
    border: M.cardBorder,
    borderRadius: M.cardRadius,
    boxShadow: M.cardShadow,
    padding: '14px 16px',
  }
}

export function formulaBoxStyle(M) {
  return {
    background: M.mathBg,
    borderRadius: 10,
    padding: '10px 14px',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 1.9,
  }
}

export function hintStyle(M) {
  return {
    background: M.hintBg,
    borderRadius: 8,
    padding: '8px 12px',
    borderLeft: `3px solid ${M.accentColor}`,
  }
}

export function progressBarStyle(M, percent) {
  return {
    height: '100%',
    width: `${percent}%`,
    background: M.accentColor,
    borderRadius: 999,
    transition: 'width 0.4s ease',
  }
}

export function badgeStyle(M) {
  return {
    background: M.badgeBg,
    border: `1px solid ${M.badgeBorder}`,
    color: M.badgeText,
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
  }
}