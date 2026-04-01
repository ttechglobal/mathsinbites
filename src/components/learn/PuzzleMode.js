'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

const POINTS_PER_CELL = 3
const HINT_LIMIT      = 2

// ─── Daily puzzle seed ────────────────────────────────────────────────────────
// Different puzzle layout each calendar day — same for all users on same day
function getDailySeed() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function seededRandom(seed) {
  var x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

// ─── Latin square generator (seeded) ─────────────────────────────────────────
function generateLatinSquare(seed) {
  var base = [[1,2,3,4],[2,3,4,1],[3,4,1,2],[4,1,2,3]]
  var s = seed
  var rowOrder = [0,1,2,3]
  var colOrder = [0,1,2,3]
  // Fisher-Yates with seeded random
  for (var i = 3; i > 0; i--) {
    s++
    var j = Math.floor(seededRandom(s) * (i + 1))
    var tmp = rowOrder[i]; rowOrder[i] = rowOrder[j]; rowOrder[j] = tmp
  }
  for (var i = 3; i > 0; i--) {
    s++
    var j = Math.floor(seededRandom(s) * (i + 1))
    var tmp = colOrder[i]; colOrder[i] = colOrder[j]; colOrder[j] = tmp
  }
  return rowOrder.map(function(r) { return colOrder.map(function(c) { return base[r][c] }) })
}

// ─── Topic-aware question bank ────────────────────────────────────────────────
// Questions are strictly matched to the topic keyword so puzzle reinforces learning.
function makeQuestion(answer, topicHint, seed) {
  var topic = (topicHint || '').toLowerCase()

  // ── Base 2 / Binary ───────────────────────────────────────────────────────
  var binary = {
    1: ['In base 2: 1 + 0 = ?', 'Binary 01 in decimal = ?', '1 base 10 in base 2 = 0_ (last digit)?'],
    2: ['In base 2: 1 + 1 = 1_ (what is the carry digit in the next column)?', 'Binary 10 in decimal = ?', '2 in base 2 = 1_ (how many zeros)?'],
    3: ['Binary 11 in decimal = ?', '1 + 1 + 1 in base 2: the decimal result = ?', 'In base 2, 11 = _ in base 10'],
    4: ['Binary 100 in decimal = ?', '2 squared in base 10 = ?', '4 in base 2 = 1__ (how many zeros follow the 1)?'],
  }

  // ── Algebra / Equations ───────────────────────────────────────────────────
  var algebra = {
    1: ['x + 3 = 4, find x', '2x - 1 = 1, find x', 'x times 5 = 5, find x'],
    2: ['x + 1 = 3, find x', '3x = 6, find x', 'x squared - 2 = 2, find x'],
    3: ['x - 1 = 2, find x', '2x + 1 = 7, find x', '9 / 3 = ?'],
    4: ['x / 2 = 2, find x', '5x - 16 = 4, find x', '2 squared = ?'],
  }

  // ── Percentages ───────────────────────────────────────────────────────────
  var percent = {
    1: ['1% of 100 = ?', '10% of 10 = ?', '25% of 4 = ?'],
    2: ['20% of 10 = ?', '50% of 4 = ?', 'Half of 4 = ?'],
    3: ['30% of 10 = ?', '75% of 4 = ?', '60% of 5 = ?'],
    4: ['40% of 10 = ?', '80% of 5 = ?', '100% of 4 = ?'],
  }

  // ── Ratio and Proportion ──────────────────────────────────────────────────
  var ratio = {
    1: ['Share 4 in ratio 1:3. Smaller share = ?', 'Ratio 1:3 — the smaller part if total is 4'],
    2: ['Share 4 equally. Each part = ?', '4 in ratio 2:2. Each share = ?'],
    3: ['Share 12 in ratio 1:3. Larger share = ?', 'In a 1:3 ratio with total 16, the larger share = ?'],
    4: ['Share 20 in ratio 1:4. Larger share = ?', 'Direct proportion: if 1 costs 2, then 2 costs ?'],
  }

  // ── Fractions ─────────────────────────────────────────────────────────────
  var fractions = {
    1: ['1/4 of 4 = ?', 'One whole divided into 4 equal parts = 1 per part, so 1/4 x 4 = ?', '1 over 2, multiplied by 2 = ?'],
    2: ['2/4 simplified = 1/?', '1/2 of 4 = ?', '2/3 of 3 = ?'],
    3: ['3/4 of 4 = ?', '3/12 simplified denominator when numerator = 1?', '3/1 = ?'],
    4: ['4/2 = ?', '4/1 = ?', '8/2 = ?'],
  }

  // ── Number Systems ────────────────────────────────────────────────────────
  var numberSys = {
    1: ['What is 1 in any number base?', 'Smallest positive integer = ?', 'Roman numeral I = ?'],
    2: ['10 in binary = ? in decimal', 'Even number less than 3 = ?', 'II in Roman numerals = ?'],
    3: ['11 in binary = ? in decimal', 'Odd number between 2 and 4 = ?', 'III in Roman numerals = ?'],
    4: ['100 in binary = ? in decimal', '2 squared = ?', 'IV in Roman numerals = ?'],
  }

  // ── Statistics / Data ─────────────────────────────────────────────────────
  var stats = {
    1: ['Mean of 1, 1, 1 = ?', 'Minimum of {4, 3, 2, 1} = ?', 'Mode of {1, 1, 2, 3} = ?'],
    2: ['Mean of 1, 2, 3 = ?', 'Median of {1, 2, 3} = ?', 'Mean of 2, 2 = ?'],
    3: ['Mean of 2, 4 = ?', 'Median of {1, 3, 5} = ?', 'Mode of {3, 3, 4, 5} = ?'],
    4: ['Mean of 2, 6 = ?', 'Maximum of {1, 2, 3, 4} = ?', 'Mean of 4, 4 = ?'],
  }

  // ── Geometry ──────────────────────────────────────────────────────────────
  var geometry = {
    1: ['A point has dimension _ (zero, written as a number)', 'How many right angles does a right angle triangle have?', 'Smallest interior angle count for a polygon?'],
    2: ['A line has _ dimensions', 'Angles in a straight line sum to 180. Half of that in right angles = ?', 'Number of sides on a parallelogram / 2 = ?'],
    3: ['Triangle has _ sides', 'Angles of equilateral triangle: each = 60. Total sides of a triangle = ?', '3-sided polygon side count'],
    4: ['Square has _ sides', 'Rectangle side count', '4-sided shape side count'],
  }

  // ── Probability ───────────────────────────────────────────────────────────
  var prob = {
    1: ['P(head) numerator when flipping a fair coin (P = 1/2) = ?', 'Probability scale starts at ?', 'Certain event has probability = 1 or 0? (answer: 1)'],
    2: ['P(head) denominator when flipping a fair coin (P = 1/2) = ?', 'Equally likely outcomes for a fair coin = ?', 'P(even on a 1-4 spinner) numerator = ? (out of 4)'],
    3: ['P(odd number) on spinner 1-4: how many odd numbers? = ?', 'Favourable outcomes when rolling a 1-4 die for number > 1 = ?', '3 red balls out of 4 total: P(red) numerator = ?'],
    4: ['P(any number) on a 1-4 spinner denominator = ?', '4 equally likely outcomes on a fair 4-sided die = ?', 'Total outcomes when rolling a 4-sided die = ?'],
  }

  // ── Indices / Powers ──────────────────────────────────────────────────────
  var indices = {
    1: ['Any number to the power 0 = ?', 'x^0 = ?', '5^0 = ?'],
    2: ['Square root of 4 = ?', '2^1 = ?', '4^0.5 = ?'],
    3: ['3^1 = ?', 'Cube root of 27 = ?', '9^0.5 = ?'],
    4: ['2^2 = ?', '4^1 = ?', 'Square root of 16 = ?'],
  }

  // ── Default: general maths ────────────────────────────────────────────────
  var general = {
    1: ['x + 3 = 4, find x', '10 - 9 = ?', '1 x 7 = ?'],
    2: ['x + 1 = 3, find x', '10 / 5 = ?', '4 / 2 = ?'],
    3: ['x - 1 = 2, find x', '9 / 3 = ?', '6 / 2 = ?'],
    4: ['x / 2 = 2, find x', '2 x 2 = ?', '8 / 2 = ?'],
  }

  var pool = general[answer] || ['Find the number that belongs here.']

  if (topic.includes('base 2') || topic.includes('binary'))       pool = binary[answer]    || pool
  else if (topic.includes('algebra') || topic.includes('equation')) pool = algebra[answer]  || pool
  else if (topic.includes('percent'))                              pool = percent[answer]   || pool
  else if (topic.includes('ratio') || topic.includes('proportion'))pool = ratio[answer]    || pool
  else if (topic.includes('fraction'))                             pool = fractions[answer] || pool
  else if (topic.includes('number system') || topic.includes('numeral')) pool = numberSys[answer] || pool
  else if (topic.includes('statistic') || topic.includes('data') || topic.includes('mean') || topic.includes('median')) pool = stats[answer] || pool
  else if (topic.includes('geometry') || topic.includes('angle') || topic.includes('shape') || topic.includes('triangle') || topic.includes('circle')) pool = geometry[answer] || pool
  else if (topic.includes('probab'))                               pool = prob[answer]      || pool
  else if (topic.includes('inde') || topic.includes('power') || topic.includes('exponent')) pool = indices[answer] || pool

  var idx = Math.floor(seededRandom(seed + answer) * pool.length)
  return pool[idx]
}

// ─── Hint generator ───────────────────────────────────────────────────────────
function getHint(answer, step) {
  var hints = {
    1: ['Think: what positive whole number is less than 2?', 'The answer is 1. It is the first counting number.'],
    2: ['It is an even number smaller than 3.', 'Think: 1 + 1 = ?'],
    3: ['It is the odd number between 2 and 4.', 'Think: 1 + 2 = ?'],
    4: ['It is even and bigger than 3.', 'Think: 2 x 2 = ?'],
  }
  var arr = hints[answer] || ['Think carefully.', 'You can do this!']
  return arr[Math.min(step, arr.length - 1)]
}

// ─── Day label ────────────────────────────────────────────────────────────────
function getDayLabel() {
  var d = new Date()
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()]
}

// ─── Row/col guide ────────────────────────────────────────────────────────────
function RowColGuide({ cells, activeCell, accent, bodyColor }) {
  if (!cells || !activeCell) return null
  var used = new Set()
  for (var cc = 0; cc < 4; cc++) {
    var cell = cells[activeCell.row][cc]
    if (cell.revealed && cc !== activeCell.col) used.add(cell.answer)
  }
  for (var rr = 0; rr < 4; rr++) {
    var cell = cells[rr][activeCell.col]
    if (cell.revealed && rr !== activeCell.row) used.add(cell.answer)
  }
  return (
    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 12 }}>
      <div style={{ fontSize: 10, color: bodyColor, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Nunito, sans-serif' }}>
        Already placed in this row and column
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1,2,3,4].map(function(n) {
          return (
            <div key={n} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, background: used.has(n) ? 'rgba(239,68,68,0.1)' : accent + '10', color: used.has(n) ? '#EF4444' : accent, border: '1.5px solid ' + (used.has(n) ? '#EF444430' : accent + '25'), textDecoration: used.has(n) ? 'line-through' : 'none', fontFamily: 'Nunito, sans-serif' }}>
              {n}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PuzzleMode({ questions, topicTitle, student, onComplete }) {
  var topic = topicTitle || 'Maths'
  var { M, mode } = useMode()
  var accent    = M.accentColor
  var isBlaze   = mode === 'blaze'
  var isNova    = mode === 'nova'
  var bodyColor = isNova ? 'rgba(255,255,255,0.55)' : M.textSecondary

  var [cells,        setCells]        = useState(null)
  var [activeCell,   setActiveCell]   = useState(null)  // { row, col }
  var [phase,        setPhase]        = useState('playing')
  var [totalPoints,  setTotalPoints]  = useState(0)
  var [wrongShake,   setWrongShake]   = useState(false)
  var [hintStep,     setHintStep]     = useState(0)
  var [showHint,     setShowHint]     = useState(false)
  var [hintText,     setHintText]     = useState('')
  var [showReveal,   setShowReveal]   = useState(false)
  var [selectedNum,  setSelectedNum]  = useState(null)

  var seed   = getDailySeed()
  var saveKey = 'mib_puzzle_v2_' + (student ? student.id : 'guest') + '_' + seed

  // ── Build cells from latin square ─────────────────────────────────────────
  function buildCells(grid) {
    var s = seed
    return grid.map(function(row, r) {
      return row.map(function(answer, c) {
        s++
        var isQ = seededRandom(s) > 0.38
        var qText = null
        if (isQ) {
          if (questions && questions.length > 0) {
            var q = questions[(r * 4 + c) % questions.length]
            qText = (q && (q.question_text || q.title)) || makeQuestion(answer, topic, s)
          } else {
            qText = makeQuestion(answer, topic, s)
          }
        }
        return { row: r, col: c, answer: answer, isQuestion: isQ, questionText: qText, userInput: '', correct: !isQ, revealed: !isQ, hintStep: 0, earned: isQ ? null : 0 }
      })
    })
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(function() {
    try {
      var saved = typeof window !== 'undefined' && localStorage.getItem(saveKey)
      if (saved) {
        var p = JSON.parse(saved)
        if (p.cells && p.phase !== 'complete') {
          setCells(p.cells)
          setTotalPoints(p.totalPoints || 0)
          setPhase(p.phase || 'playing')
          return
        }
      }
    } catch(e) {}
    var grid = generateLatinSquare(seed)
    setCells(buildCells(grid))
  }, []) // eslint-disable-line

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(function() {
    if (!cells) return
    try { localStorage.setItem(saveKey, JSON.stringify({ cells: cells, totalPoints: totalPoints, phase: phase })) } catch(e) {}
  }, [cells, totalPoints, phase]) // eslint-disable-line

  // ── When a cell is tapped ─────────────────────────────────────────────────
  function openCell(r, c) {
    var cell = cells[r][c]
    if (cell.correct) return
    setActiveCell({ row: r, col: c })
    setSelectedNum(cell.userInput ? parseInt(cell.userInput, 10) : null)
    setHintStep(cell.hintStep || 0)
    setShowHint(false)
    setWrongShake(false)
  }

  function closeModal() {
    setActiveCell(null)
    setSelectedNum(null)
    setShowHint(false)
    setShowReveal(false)
  }

  var activeData = activeCell ? cells[activeCell.row][activeCell.col] : null

  // ── Conflict detection ────────────────────────────────────────────────────
  function hasConflict(r, c, val) {
    if (!cells) return false
    var n = parseInt(val, 10)
    if (!n) return false
    for (var cc = 0; cc < 4; cc++) {
      if (cc !== c && cells[r][cc].revealed && parseInt(cells[r][cc].answer, 10) === n) return true
    }
    for (var rr = 0; rr < 4; rr++) {
      if (rr !== r && cells[rr][c].revealed && parseInt(cells[rr][c].answer, 10) === n) return true
    }
    return false
  }

  // ── Check complete ────────────────────────────────────────────────────────
  function checkComplete() {
    setTimeout(function() {
      setCells(function(prev) {
        if (!prev) return prev
        var done = prev.every(function(row) { return row.every(function(c) { return !c.isQuestion || c.correct }) })
        if (done) setPhase('complete')
        return prev
      })
    }, 200)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function submitAnswer() {
    if (!activeCell || !activeData || !selectedNum) return
    var row = activeCell.row
    var col = activeCell.col
    var hs  = hintStep
    if (selectedNum !== activeData.answer) {
      setWrongShake(true)
      setTimeout(function() { setWrongShake(false) }, 500)
      return
    }
    var earnedPts = hs > 0 ? Math.max(1, POINTS_PER_CELL - hs) : POINTS_PER_CELL
    setCells(function(prev) {
      var next = prev.map(function(r) { return r.slice() })
      next[row][col] = Object.assign({}, next[row][col], { correct: true, revealed: true, earned: earnedPts, hintStep: hs, userInput: String(selectedNum) })
      return next
    })
    setTotalPoints(function(p) { return p + earnedPts })
    closeModal()
    checkComplete()
  }

  // ── Hint ──────────────────────────────────────────────────────────────────
  function doHint() {
    if (hintStep >= HINT_LIMIT || !activeData) return
    var next = hintStep + 1
    setHintStep(next)
    setHintText(getHint(activeData.answer, next - 1))
    setShowHint(true)
    // Persist hint step to cell
    var row = activeCell.row; var col = activeCell.col
    setCells(function(prev) {
      var n = prev.map(function(r) { return r.slice() })
      n[row][col] = Object.assign({}, n[row][col], { hintStep: next })
      return n
    })
  }

  // ── Reveal ────────────────────────────────────────────────────────────────
  function doReveal() {
    if (!activeCell || !activeData) return
    var row = activeCell.row; var col = activeCell.col
    setCells(function(prev) {
      var n = prev.map(function(r) { return r.slice() })
      n[row][col] = Object.assign({}, n[row][col], { correct: true, revealed: true, earned: 0, userInput: String(activeData.answer) })
      return n
    })
    closeModal()
    checkComplete()
  }

  // ── Restart ───────────────────────────────────────────────────────────────
  function restart() {
    try { localStorage.removeItem(saveKey) } catch(e) {}
    var grid = generateLatinSquare(seed)
    setCells(buildCells(grid))
    setTotalPoints(0)
    setPhase('playing')
    closeModal()
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  var totalQ    = cells ? cells.flat().filter(function(c) { return c.isQuestion }).length : 0
  var answeredQ = cells ? cells.flat().filter(function(c) { return c.isQuestion && c.correct }).length : 0
  var maxPts    = totalQ * POINTS_PER_CELL
  var pct       = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0
  var circ      = 100.53
  var dash      = ((pct / 100) * circ).toFixed(1)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!cells) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 14, background: M.lessonBg }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3.5px solid ' + accent + '25', borderTop: '3.5px solid ' + accent, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: 14, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Generating today's puzzle...</div>
      </div>
    )
  }

  // ── Complete screen ───────────────────────────────────────────────────────
  if (phase === 'complete') {
    var qCells = cells.flat().filter(function(c) { return c.isQuestion })
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 48px', height: '100%', background: M.lessonBg, textAlign: 'center', overflowY: 'auto', gap: 20 }}>
        <style>{`@keyframes floatBig{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes popIn{0%{transform:scale(0.5);opacity:0}80%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ animation: 'floatBig 2.5s ease-in-out infinite' }}><BicPencil pose="celebrate" size={110} /></div>
        <div>
          <div style={{ fontFamily: M.headingFont, fontSize: 28, fontWeight: 900, color: M.textPrimary, lineHeight: 1.1, marginBottom: 6 }}>Puzzle Complete!</div>
          <div style={{ fontSize: 14, color: bodyColor, fontFamily: 'Nunito, sans-serif', lineHeight: 1.65 }}>Great mathematical thinking, {student ? student.display_name : 'Maths Star'}!</div>
        </div>
        <div style={{ background: isBlaze ? '#FFD700' : accent + '12', border: isBlaze ? '2px solid #0d0d0d' : '1.5px solid ' + accent + '30', borderRadius: 24, padding: '24px 56px', animation: 'popIn 0.4s 0.15s ease both' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: isBlaze ? '#0d0d0d' : bodyColor, textTransform: 'uppercase', letterSpacing: 1.4, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>Points Earned</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: M.headingFont, lineHeight: 1 }}>{totalPoints}</div>
          <div style={{ fontSize: 12, color: isBlaze ? 'rgba(0,0,0,0.45)' : bodyColor, fontFamily: 'Nunito, sans-serif', marginTop: 6 }}>out of {maxPts} possible</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
          {qCells.map(function(c, i) {
            var e = c.earned != null ? c.earned : 0
            return (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: e > 0 ? accent + '15' : 'rgba(239,68,68,0.1)', border: '1.5px solid ' + (e > 0 ? accent : '#EF4444') + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: e > 0 ? accent : '#EF4444' }}>
                {e}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button onClick={function() { if (onComplete) onComplete(totalPoints) }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,' + accent + ',' + accent + 'CC)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: '0 5px 20px ' + accent + '40' }}>
            Back to Home
          </button>
          <button onClick={restart} style={{ padding: '14px', borderRadius: 16, border: '1.5px solid ' + accent + '30', background: 'transparent', color: accent, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            Play Again
          </button>
        </div>
      </div>
    )
  }

  // ── Main puzzle view ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @keyframes cellSolve{0%{transform:scale(0.85);opacity:0.4}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        @keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes fadePop{0%{opacity:0;transform:scale(0.92)}100%{opacity:1;transform:scale(1)}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1.5px solid ' + M.progressTrack }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>Daily Puzzle</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: M.textPrimary, lineHeight: 1.15 }}>{topic}</div>
          <div style={{ fontSize: 10, color: bodyColor, fontWeight: 600, marginTop: 1 }}>{getDayLabel()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Points */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1 }}>{totalPoints}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.6 }}>pts</div>
          </div>
          {/* Progress ring */}
          <div style={{ width: 44, height: 44, position: 'relative' }}>
            <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke={accent + '20'} strokeWidth="3.5" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={accent} strokeWidth="3.5" strokeDasharray={dash + ' ' + circ} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: accent }}>{pct}%</div>
          </div>
        </div>
      </div>

      {/* ── Rules ── */}
      <div style={{ padding: '8px 20px 6px', flexShrink: 0, borderBottom: '1px solid ' + M.progressTrack }}>
        <div style={{ fontSize: 11, color: bodyColor, fontWeight: 600, lineHeight: 1.5 }}>
          Fill each row and column with 1, 2, 3 and 4 — each used once. Tap a cell to solve it. Earn <span style={{ fontWeight: 900, color: accent }}>3 pts</span> per cell!
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          {/* Column labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(4, 1fr)', gap: 6, marginBottom: 4 }}>
            <div />
            {[1,2,3,4].map(function(n) {
              return <div key={n} style={{ textAlign: 'center', fontSize: 10, fontWeight: 900, color: accent + '60', fontFamily: 'Nunito, sans-serif' }}>C{n}</div>
            })}
          </div>

          {/* Grid rows with row labels */}
          {cells.map(function(row, r) {
            return (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: '32px repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
                {/* Row label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: accent + '60', fontFamily: 'Nunito, sans-serif' }}>R{r + 1}</div>
                {row.map(function(cell, c) {
                  var isActive   = activeCell && activeCell.row === r && activeCell.col === c
                  var displayVal = cell.correct ? String(cell.answer) : (cell.userInput || '')
                  var isGiven    = !cell.isQuestion

                  var bg = isNova ? 'rgba(255,255,255,0.05)' : '#fff'
                  if (isGiven)       bg = isNova ? 'rgba(255,255,255,0.12)' : accent + '10'
                  if (cell.correct && cell.isQuestion) bg = isNova ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.1)'
                  if (isActive)      bg = isNova ? 'rgba(255,255,255,0.18)' : accent + '18'

                  var borderColor = isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                  if (isGiven)                        borderColor = accent + '35'
                  if (cell.correct && cell.isQuestion) borderColor = '#22c55e'
                  if (isActive)                       borderColor = accent

                  var textColor = bodyColor
                  if (isGiven)                        textColor = accent + 'BB'
                  if (cell.correct && cell.isQuestion) textColor = '#22c55e'
                  if (isActive)                       textColor = accent
                  if (displayVal && !cell.correct)    textColor = M.textPrimary

                  return (
                    <button
                      key={c}
                      onClick={function() { openCell(r, c) }}
                      disabled={isGiven || cell.correct}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 14,
                        border: '2px solid ' + borderColor,
                        background: bg,
                        cursor: (isGiven || cell.correct) ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                        boxShadow: isActive ? '0 0 0 4px ' + accent + '25' : cell.correct && cell.isQuestion ? '0 3px 12px rgba(34,197,94,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                        animation: cell.correct && cell.isQuestion ? 'cellSolve 0.4s ease both' : 'none',
                        transform: isActive ? 'scale(1.06)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: isGiven ? 20 : cell.correct ? 22 : 15, fontWeight: 900, color: textColor, fontFamily: 'Nunito, sans-serif', transition: 'all 0.2s' }}>
                        {cell.correct || displayVal ? (cell.correct ? displayVal : displayVal) : '?'}
                      </span>
                      {/* Points earned badge */}
                      {cell.correct && cell.isQuestion && cell.earned !== null && (
                        <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: cell.earned > 0 ? '#22c55e' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                          {cell.earned}
                        </div>
                      )}
                      {/* Hint indicator */}
                      {!cell.correct && cell.hintStep > 0 && (
                        <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 7, color: '#F59E0B', fontWeight: 900, letterSpacing: -1 }}>
                          {'!'.repeat(cell.hintStep)}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
            {[
              { label: 'Given', color: accent + '60', bg: accent + '10' },
              { label: 'Unsolved', color: bodyColor, bg: 'rgba(0,0,0,0.04)' },
              { label: 'Solved', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            ].map(function(item) {
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: item.bg, border: '1.5px solid ' + item.color }} />
                  <span style={{ fontSize: 9, color: bodyColor, fontWeight: 700, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Cell modal (bottom sheet) ── */}
      {activeCell && activeData && !activeData.correct && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={function(e) { e.stopPropagation() }}
            style={{ background: M.lessonBg, borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 60px rgba(0,0,0,0.35)', animation: 'sheetUp 0.3s cubic-bezier(0.32,0.72,0,1) both' }}
          >
            {/* Handle */}
            <div style={{ padding: '16px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 44, height: 5, borderRadius: 99, background: M.progressTrack }} />
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', padding: '8px 24px 0' }}>

              {/* Cell label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif' }}>
                  Row {activeCell.row + 1}, Column {activeCell.col + 1}
                </div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: bodyColor, lineHeight: 1, padding: '0 2px' }}>x</button>
              </div>

              {/* Question */}
              <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : accent + '08', border: '1.5px solid ' + accent + '22', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>
                  Solve this to place a number in this cell
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: M.textPrimary, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>
                  {activeData.questionText || 'Find the number that belongs in this cell.'}
                </div>
              </div>

              {/* Hint display */}
              {showHint && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, animation: 'fadePop 0.25s ease both' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#D97706', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>
                    Hint {hintStep} of {HINT_LIMIT}
                  </div>
                  <div style={{ fontSize: 14, color: M.textPrimary, fontWeight: 700, lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>{hintText}</div>
                </div>
              )}

              {/* Number picker */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: 'Nunito, sans-serif' }}>Select your answer</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, animation: wrongShake ? 'shakeX 0.4s ease both' : 'none' }}>
                  {[1,2,3,4].map(function(n) {
                    var conflict = hasConflict(activeCell.row, activeCell.col, n)
                    var selected = selectedNum === n
                    return (
                      <button
                        key={n}
                        onClick={function() { setSelectedNum(n) }}
                        style={{
                          height: 72,
                          borderRadius: 16,
                          border: '2.5px solid ' + (selected ? accent : conflict ? '#EF444428' : isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                          background: selected ? accent + '18' : conflict ? 'rgba(239,68,68,0.04)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: 28, fontWeight: 900,
                          color: selected ? accent : conflict ? '#EF444450' : M.textPrimary,
                          transition: 'all 0.18s',
                          textDecoration: conflict ? 'line-through' : 'none',
                          boxShadow: selected ? '0 4px 16px ' + accent + '30' : 'none',
                          fontFamily: 'Nunito, sans-serif',
                          transform: selected ? 'scale(1.05)' : 'scale(1)',
                          position: 'relative',
                        }}
                      >
                        {n}
                        {conflict && !selected && (
                          <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 8, color: '#EF4444', fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}>taken</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row/col guide */}
              <RowColGuide cells={cells} activeCell={activeCell} accent={accent} bodyColor={bodyColor} />

            </div>

            {/* Action bar */}
            <div style={{ padding: '16px 24px 32px', flexShrink: 0, borderTop: '1px solid ' + M.progressTrack, marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {/* Hint */}
                <button
                  onClick={doHint}
                  disabled={hintStep >= HINT_LIMIT}
                  style={{ flex: 1, padding: '13px 8px', borderRadius: 14, border: '1.5px solid rgba(245,158,11,' + (hintStep >= HINT_LIMIT ? '0.2' : '0.5') + ')', background: 'transparent', cursor: hintStep >= HINT_LIMIT ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, color: hintStep >= HINT_LIMIT ? bodyColor : '#D97706', fontFamily: 'Nunito, sans-serif', opacity: hintStep >= HINT_LIMIT ? 0.5 : 1 }}
                >
                  Hint ({HINT_LIMIT - hintStep} left)
                </button>
                {/* Reveal */}
                <button
                  onClick={function() { setShowReveal(true) }}
                  style={{ flex: '0 0 80px', padding: '13px 0', borderRadius: 14, border: '1.5px solid rgba(239,68,68,0.25)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#EF4444AA', fontFamily: 'Nunito, sans-serif' }}
                >
                  Reveal
                </button>
              </div>
              {/* Confirm */}
              <button
                onClick={submitAnswer}
                disabled={!selectedNum}
                style={{ width: '100%', padding: '17px', borderRadius: 16, border: 'none', background: selectedNum ? 'linear-gradient(135deg,' + accent + ',' + accent + 'CC)' : accent + '30', color: selectedNum ? '#fff' : accent + '70', fontSize: 17, fontWeight: 900, cursor: selectedNum ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', boxShadow: selectedNum ? '0 6px 24px ' + accent + '45' : 'none', transition: 'all 0.2s' }}
              >
                Confirm Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reveal confirm sheet ── */}
      {showReveal && (
        <div
          onClick={function() { setShowReveal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={function(e) { e.stopPropagation() }}
            style={{ background: M.lessonBg, borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'fadePop 0.25s ease both' }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary, marginBottom: 10, fontFamily: 'Nunito, sans-serif' }}>Reveal this cell?</div>
            <div style={{ fontSize: 14, color: bodyColor, marginBottom: 24, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
              You will see the answer but earn 0 points for this cell. Using hints keeps your points intact — try one first!
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={function() { setShowReveal(false) }} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid ' + M.progressTrack, background: 'transparent', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: M.textSecondary }}>
                Cancel
              </button>
              <button onClick={doReveal} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: '#EF4444' }}>
                Reveal (0 pts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}