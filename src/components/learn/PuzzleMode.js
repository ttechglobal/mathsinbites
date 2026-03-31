'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

const POINTS_PER_CELL = 3
const HINT_LIMIT      = 2

// ─── Latin square generator ───────────────────────────────────────────────────
function generateLatinSquare() {
  const base = [[1,2,3,4],[2,3,4,1],[3,4,1,2],[4,1,2,3]]
  const rowOrder = [0,1,2,3].sort(() => Math.random() - 0.5)
  const colOrder = [0,1,2,3].sort(() => Math.random() - 0.5)
  return rowOrder.map(r => colOrder.map(c => base[r][c]))
}

// ─── Procedural question templates ───────────────────────────────────────────
function makeQuestion(answer, topicHint) {
  const topic = (topicHint || '').toLowerCase()
  const algebra = {
    1: ['x + 3 = 4, find x', '2x - 1 = 1, find x', 'x squared = 1, find x (positive)'],
    2: ['x + 1 = 3, find x', '3x - 4 = 2, find x', 'Square root of 4 = ?'],
    3: ['x - 1 = 2, find x', '2x + 1 = 7, find x', '9 divided by 3 = ?'],
    4: ['x divided by 2 = 2, find x', '5x - 16 = 4, find x', '2 squared = ?'],
  }
  const percent = {
    1: ['1% of 100 = ?', '10% of 10 = ?'],
    2: ['20% of 10 = ?', 'One half of 4 = ?'],
    3: ['30% of 10 = ?', 'Three quarters of 4 = ?'],
    4: ['40% of 10 = ?', 'Two fifths of 10 = ?'],
  }
  const ratio = {
    1: ['Share 4 in ratio 1:3. Smaller share = ?', 'Ratio 1:3, total 4. Smaller part = ?'],
    2: ['Share 4 in ratio 1:1. Each part = ?', '2 out of 4 simplified = 1 out of ?'],
    3: ['Share 12 in ratio 1:3. Larger share = ?', 'Three quarters of 4 = ?'],
    4: ['Share 20 in ratio 1:4. Larger share = ?', '4 times 1 = ?'],
  }
  let pool = algebra[answer] || ['Answer = ' + answer]
  if (topic.includes('percent') || topic.includes('%')) pool = percent[answer] || pool
  if (topic.includes('ratio') || topic.includes('proportion')) pool = ratio[answer] || pool
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Hint generator ───────────────────────────────────────────────────────────
function getHint(answer, step) {
  const hints = {
    1: ['The answer is less than 2. It is the smallest positive whole number.', 'Think: 3 + ? = 4'],
    2: ['The answer is even and less than 3.', 'Think: 1 + 1 = ?'],
    3: ['The answer is odd and sits between 2 and 4.', 'Think: 1 + 2 = ?'],
    4: ['The answer is even and greater than 3.', 'Think: 2 times 2 = ?'],
  }
  return (hints[answer] || [])[step] || 'Think carefully — you can do this!'
}

// ─── Row/column guide ─────────────────────────────────────────────────────────
function RowColGuide({ cells, activeCell, accent, bodyColor, isNova }) {
  if (!cells || !activeCell) return null
  const used = new Set()
  for (let cc = 0; cc < 4; cc++) {
    const cell = cells[activeCell.row][cc]
    if (cell.revealed && cc !== activeCell.col) used.add(cell.answer)
  }
  for (let rr = 0; rr < 4; rr++) {
    const cell = cells[rr][activeCell.col]
    if (cell.revealed && rr !== activeCell.row) used.add(cell.answer)
  }
  return (
    <div style={{ marginTop: 10, padding: '8px 12px', background: isNova ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: bodyColor, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Already placed in this row and column
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            style={{
              width: 28, height: 28, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900,
              background: used.has(n) ? 'rgba(239,68,68,0.12)' : accent + '12',
              color: used.has(n) ? '#EF4444' : accent,
              textDecoration: used.has(n) ? 'line-through' : 'none',
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Points chip (complete screen) ───────────────────────────────────────────
function CellChip({ cell, accent }) {
  const earned = cell.earned != null ? cell.earned : 0
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: earned > 0 ? accent + '18' : 'rgba(239,68,68,0.1)',
        border: '1.5px solid ' + (earned > 0 ? accent : '#EF4444') + '33',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900,
        color: earned > 0 ? accent : '#EF4444',
      }}
    >
      {earned}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PuzzleMode({ questions = [], topicTitle = 'Maths', student, onComplete }) {
  const { M, mode } = useMode()
  const accent    = M.accentColor
  const isBlaze   = mode === 'blaze'
  const isNova    = mode === 'nova'
  const bodyColor = isNova ? 'rgba(255,255,255,0.55)' : M.textSecondary

  const [cells,             setCells]             = useState(null)
  const [grid,              setGrid]              = useState(null)
  const [activeCell,        setActiveCell]        = useState(null)
  const [phase,             setPhase]             = useState('playing')
  const [totalPoints,       setTotalPoints]       = useState(0)
  const [showHint,          setShowHint]          = useState(false)
  const [hintText,          setHintText]          = useState('')
  const [showRevealConfirm, setShowRevealConfirm] = useState(false)
  const [wrongShake,        setWrongShake]        = useState(false)

  const saveKey = 'mib_puzzle_' + (student ? student.id : 'guest') + '_' + topicTitle.replace(/\s+/g, '_').slice(0, 20)

  // ── Build cell grid from a latin square ──────────────────────────────────
  function buildCells(newGrid) {
    let dbIdx = 0
    return newGrid.map((row, r) =>
      row.map((answer, c) => {
        const isQ = Math.random() > 0.38
        let questionText = null
        if (isQ) {
          if (questions.length > 0) {
            const q = questions[dbIdx % questions.length]
            dbIdx++
            questionText = (q.question_text || q.title) || makeQuestion(answer, topicTitle)
          } else {
            questionText = makeQuestion(answer, topicTitle)
          }
        }
        return {
          row: r, col: c, answer: answer, isQuestion: isQ,
          questionText: questionText,
          userInput: '',
          correct: !isQ,
          revealed: !isQ,
          hintStep: 0,
          earned: isQ ? null : 0,
        }
      })
    )
  }

  // ── Generate or restore puzzle ────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem(saveKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.cells && parsed.grid && parsed.phase !== 'complete') {
          setCells(parsed.cells)
          setGrid(parsed.grid)
          setTotalPoints(parsed.totalPoints || 0)
          setPhase(parsed.phase || 'playing')
          return
        }
      }
    } catch(e) {}
    const newGrid = generateLatinSquare()
    setCells(buildCells(newGrid))
    setGrid(newGrid)
    setTotalPoints(0)
  }, []) // eslint-disable-line

  // ── Persist state ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cells) return
    try { localStorage.setItem(saveKey, JSON.stringify({ cells, grid, totalPoints, phase })) }
    catch(e) {}
  }, [cells, totalPoints, phase]) // eslint-disable-line

  const getCell = useCallback((r, c) => cells && cells[r] ? cells[r][c] : null, [cells])
  const active  = activeCell ? getCell(activeCell.row, activeCell.col) : null

  // ── Conflict detection ────────────────────────────────────────────────────
  function hasConflict(r, c, val) {
    if (!cells) return false
    const n = parseInt(val, 10)
    if (!n) return false
    for (let cc = 0; cc < 4; cc++) {
      if (cc !== c && cells[r][cc].revealed) {
        if (parseInt(cells[r][cc].userInput || cells[r][cc].answer, 10) === n) return true
      }
    }
    for (let rr = 0; rr < 4; rr++) {
      if (rr !== r && cells[rr][c].revealed) {
        if (parseInt(cells[rr][c].userInput || cells[rr][c].answer, 10) === n) return true
      }
    }
    return false
  }

  // ── Check completion ──────────────────────────────────────────────────────
  function checkComplete() {
    setTimeout(() => {
      setCells(prev => {
        if (!prev) return prev
        const allDone = prev.every(row =>
          row.every(cell => !cell.isQuestion || cell.correct)
        )
        if (allDone) setPhase('complete')
        return prev
      })
    }, 120)
  }

  // ── Submit answer ─────────────────────────────────────────────────────────
  function submitAnswer() {
    if (!activeCell || !active) return
    const row = activeCell.row
    const col = activeCell.col
    const val = parseInt(active.userInput, 10)
    if (val !== active.answer) {
      setWrongShake(true)
      setTimeout(() => setWrongShake(false), 500)
      return
    }
    const earnedPts = active.hintStep > 0 ? Math.max(1, POINTS_PER_CELL - active.hintStep) : POINTS_PER_CELL
    setCells(prev => {
      const next = prev.map(r => r.slice())
      next[row][col] = { ...next[row][col], correct: true, revealed: true, earned: earnedPts }
      return next
    })
    setTotalPoints(p => p + earnedPts)
    setActiveCell(null)
    checkComplete()
  }

  // ── Use hint ──────────────────────────────────────────────────────────────
  function doUseHint() {
    if (!activeCell || !active || active.hintStep >= HINT_LIMIT) return
    const nextStep = active.hintStep + 1
    const currentActive = active
    setCells(prev => {
      const next = prev.map(r => r.slice())
      next[activeCell.row][activeCell.col] = { ...currentActive, hintStep: nextStep }
      return next
    })
    setHintText(getHint(active.answer, nextStep - 1))
    setShowHint(true)
  }

  // ── Reveal cell ───────────────────────────────────────────────────────────
  function revealCell() {
    if (!activeCell || !active) return
    const currentActive = active
    setCells(prev => {
      const next = prev.map(r => r.slice())
      next[activeCell.row][activeCell.col] = {
        ...currentActive,
        correct: true, revealed: true, earned: 0,
        userInput: String(currentActive.answer),
      }
      return next
    })
    setShowRevealConfirm(false)
    setActiveCell(null)
    checkComplete()
  }

  // ── Restart ───────────────────────────────────────────────────────────────
  function restartPuzzle() {
    try { localStorage.removeItem(saveKey) } catch(e) {}
    const newGrid = generateLatinSquare()
    setCells(buildCells(newGrid))
    setGrid(newGrid)
    setTotalPoints(0)
    setPhase('playing')
    setActiveCell(null)
    setShowHint(false)
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  const totalQ    = cells ? cells.flat().filter(c => c.isQuestion).length : 0
  const answeredQ = cells ? cells.flat().filter(c => c.isQuestion && c.correct).length : 0
  const maxPoints = totalQ * POINTS_PER_CELL
  const pct       = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0
  const circ      = 100.53
  const dash      = ((pct / 100) * circ).toFixed(1)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!cells) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid ' + accent + '30', borderTop: '3px solid ' + accent, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif' }}>Building your puzzle...</div>
      </div>
    )
  }

  // ── Complete screen ───────────────────────────────────────────────────────
  if (phase === 'complete') {
    const questionCells = cells.flat().filter(c => c.isQuestion)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', height: '100%', gap: 16, background: M.lessonBg, textAlign: 'center', overflowY: 'auto' }}>
        <style>{`
          @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes pop { 0%{transform:scale(0.6);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        `}</style>
        <div style={{ animation: 'floatUp 2.5s ease-in-out infinite' }}>
          <BicPencil pose="celebrate" size={100} />
        </div>
        <div style={{ fontFamily: M.headingFont, fontSize: 26, fontWeight: 900, color: M.textPrimary, lineHeight: 1.1 }}>
          Puzzle Complete!
        </div>
        <div style={{ fontSize: 14, color: bodyColor, fontFamily: 'Nunito, sans-serif', maxWidth: 260, lineHeight: 1.65 }}>
          You filled every cell. Great mathematical thinking!
        </div>
        <div style={{
          background: isBlaze ? '#FFD700' : accent + '12',
          border: isBlaze ? '2px solid #0d0d0d' : '1.5px solid ' + accent + '30',
          borderRadius: isBlaze ? 12 : 20,
          padding: '20px 48px',
          animation: 'pop 0.4s 0.2s ease both',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: isBlaze ? '#0d0d0d' : bodyColor, textTransform: 'uppercase', letterSpacing: 1.4, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>
            Points Earned
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: M.headingFont, lineHeight: 1 }}>
            {totalPoints}
          </div>
          <div style={{ fontSize: 11, color: isBlaze ? 'rgba(0,0,0,0.45)' : bodyColor, fontFamily: 'Nunito, sans-serif', marginTop: 4 }}>
            out of {maxPoints} possible
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
          {questionCells.map((cell, i) => (
            <CellChip key={i} cell={cell} accent={accent} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          <button
            onClick={restartPuzzle}
            style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, ' + accent + ', ' + accent + 'CC)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            New Puzzle
          </button>
          <button
            onClick={() => {
              try { localStorage.removeItem(saveKey) } catch(e) {}
              if (onComplete) onComplete(totalPoints)
            }}
            style={{ padding: '13px', borderRadius: 14, border: '1.5px solid ' + accent + '30', background: 'transparent', color: accent, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // ── Main puzzle view ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes cellPop { 0%{transform:scale(0.85);opacity:0.5} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes revealUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid ' + M.progressTrack }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Maths Puzzle
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2 }}>
            {topicTitle}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>{totalPoints}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>pts</div>
          </div>
          <div style={{ width: 40, height: 40, position: 'relative' }}>
            <svg viewBox="0 0 40 40" style={{ width: 40, height: 40, transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke={accent + '25'} strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={accent} strokeWidth="3" strokeDasharray={dash + ' ' + circ} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: accent }}>
              {pct}%
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div style={{ padding: '8px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: bodyColor, fontWeight: 600, lineHeight: 1.5 }}>
          Fill each row and column with 1, 2, 3, 4 — each number used once. Solve the question in each cell to place the number. Earn 3 pts per correct cell.
        </div>
      </div>

      {/* Grid + active panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Grid */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 18px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, width: '100%', maxWidth: 340 }}>
            {cells.map((row, r) =>
              row.map((cell, c) => {
                const isActive   = activeCell && activeCell.row === r && activeCell.col === c
                const inConflict = !cell.correct && cell.userInput ? hasConflict(r, c, cell.userInput) : false
                const displayVal = cell.correct ? String(cell.answer) : (cell.userInput || '')

                let bg = isNova ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                if (cell.correct && !cell.isQuestion) bg = isNova ? 'rgba(255,255,255,0.1)' : accent + '14'
                else if (cell.correct) bg = isNova ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)'
                else if (isActive) bg = isNova ? 'rgba(255,255,255,0.12)' : accent + '15'
                else if (inConflict) bg = 'rgba(239,68,68,0.08)'

                let borderColor = isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
                if (cell.correct && !cell.isQuestion) borderColor = accent + '40'
                else if (cell.correct) borderColor = '#22c55e'
                else if (isActive) borderColor = accent
                else if (inConflict) borderColor = '#EF4444'

                let textColor = bodyColor
                if (cell.correct && !cell.isQuestion) textColor = accent + '99'
                else if (cell.correct) textColor = '#22c55e'
                else if (inConflict) textColor = '#EF4444'
                else if (displayVal) textColor = M.textPrimary

                return (
                  <button
                    key={r + '-' + c}
                    onClick={() => {
                      if (cell.correct) return
                      setActiveCell(isActive ? null : { row: r, col: c })
                      setShowHint(false)
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: isBlaze ? 6 : 12,
                      border: '2px solid ' + borderColor,
                      background: bg,
                      cursor: cell.correct ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.18s',
                      boxShadow: isActive ? '0 0 0 3px ' + accent + '30' : 'none',
                      animation: cell.correct && cell.isQuestion ? 'cellPop 0.35s ease both' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: cell.correct ? 22 : displayVal ? 20 : 13,
                      fontWeight: 900,
                      color: textColor,
                      fontFamily: cell.correct ? M.headingFont : 'Nunito, sans-serif',
                      transition: 'all 0.2s',
                    }}>
                      {cell.correct ? displayVal : (displayVal || '?')}
                    </span>
                    {cell.correct && cell.isQuestion && cell.earned !== null && (
                      <div style={{ position: 'absolute', top: 2, right: 3, fontSize: 8, fontWeight: 900, color: cell.earned > 0 ? '#22c55e' : '#EF444488' }}>
                        +{cell.earned}
                      </div>
                    )}
                    {!cell.correct && cell.hintStep > 0 && (
                      <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 7, color: '#FFC107', letterSpacing: 1 }}>
                        {'H'.repeat(cell.hintStep)}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Active cell panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 80px' }}>
          {active && !active.correct ? (
            <div style={{ animation: 'revealUp 0.25s ease both', maxWidth: 340, margin: '0 auto' }}>

              {/* Question */}
              <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : accent + '08', border: '1.5px solid ' + accent + '22', borderRadius: isBlaze ? 8 : 14, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
                  Row {activeCell.row + 1}, Column {activeCell.col + 1}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: M.textPrimary, lineHeight: 1.6 }}>
                  {active.questionText || ('Find the number for row ' + (activeCell.row + 1) + ', column ' + (activeCell.col + 1))}
                </div>
              </div>

              {/* Hint display */}
              {showHint && (
                <div style={{ background: 'rgba(255,193,7,0.08)', border: '1.5px solid rgba(255,193,7,0.25)', borderRadius: 10, padding: '10px 13px', marginBottom: 10, animation: 'revealUp 0.25s ease both' }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: '#CC8800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    Hint {active.hintStep} of {HINT_LIMIT}
                  </div>
                  <div style={{ fontSize: 13, color: M.textPrimary, fontWeight: 600, lineHeight: 1.6 }}>
                    {hintText}
                  </div>
                </div>
              )}

              {/* Number picker */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10, animation: wrongShake ? 'shake 0.4s ease both' : 'none' }}>
                {[1, 2, 3, 4].map(n => {
                  const inConflict = hasConflict(activeCell.row, activeCell.col, n)
                  const selected   = active.userInput === String(n)
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        const row = activeCell.row
                        const col = activeCell.col
                        const snap = { ...active, userInput: String(n) }
                        setCells(prev => {
                          const next = prev.map(r => r.slice())
                          next[row][col] = snap
                          return next
                        })
                      }}
                      style={{
                        padding: '14px 0',
                        borderRadius: isBlaze ? 6 : 12,
                        border: '2px solid ' + (selected ? accent : inConflict ? '#EF444440' : isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                        background: selected ? accent + '18' : inConflict ? 'rgba(239,68,68,0.04)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 22, fontWeight: 900,
                        color: selected ? accent : inConflict ? '#EF444466' : M.textPrimary,
                        transition: 'all 0.15s',
                        textDecoration: inConflict ? 'line-through' : 'none',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={doUseHint}
                  disabled={active.hintStep >= HINT_LIMIT}
                  style={{
                    flex: 1, padding: '12px 8px',
                    borderRadius: isBlaze ? 6 : 12,
                    border: '1.5px solid rgba(255,193,7,' + (active.hintStep >= HINT_LIMIT ? '0.15' : '0.4') + ')',
                    background: 'transparent',
                    cursor: active.hintStep >= HINT_LIMIT ? 'not-allowed' : 'pointer',
                    fontSize: 12, fontWeight: 800,
                    color: active.hintStep >= HINT_LIMIT ? '#CCC' : '#CC8800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    opacity: active.hintStep >= HINT_LIMIT ? 0.5 : 1,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Hint ({HINT_LIMIT - active.hintStep} left)
                </button>
                <button
                  onClick={() => setShowRevealConfirm(true)}
                  style={{
                    flex: '0 0 52px', padding: '12px 0',
                    borderRadius: isBlaze ? 6 : 12,
                    border: '1.5px solid rgba(239,68,68,0.2)',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 11, fontWeight: 800, color: '#EF444477',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Reveal
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!active.userInput}
                  style={{
                    flex: 2, padding: '12px',
                    borderRadius: isBlaze ? 6 : 12,
                    border: 'none',
                    background: active.userInput ? 'linear-gradient(135deg, ' + accent + ', ' + accent + 'CC)' : accent + '30',
                    color: active.userInput ? '#fff' : accent + '80',
                    fontSize: 14, fontWeight: 900,
                    cursor: active.userInput ? 'pointer' : 'not-allowed',
                    fontFamily: 'Nunito, sans-serif',
                    transition: 'all 0.18s',
                  }}
                >
                  Confirm
                </button>
              </div>

              <RowColGuide cells={cells} activeCell={activeCell} accent={accent} bodyColor={bodyColor} isNova={isNova} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: bodyColor, fontSize: 13, fontFamily: 'Nunito, sans-serif' }}>
              {answeredQ === totalQ ? 'All cells solved!' : 'Tap a question cell to solve it'}
            </div>
          )}
        </div>
      </div>

      {/* Reveal confirm sheet */}
      {showRevealConfirm && (
        <div
          onClick={() => setShowRevealConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: M.lessonBg, borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 480 }}
          >
            <div style={{ width: 36, height: 4, background: M.progressTrack, borderRadius: 2, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 900, color: M.textPrimary, marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>
              Reveal this cell?
            </div>
            <div style={{ fontSize: 13, color: bodyColor, marginBottom: 20, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>
              You will see the answer but earn 0 points for this cell. Try using a hint first to keep your points.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowRevealConfirm(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid ' + M.progressTrack, background: 'transparent', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: M.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={revealCell}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: '#EF4444' }}
              >
                Reveal (0 pts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}