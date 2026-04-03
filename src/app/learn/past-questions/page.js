'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

const supabase = createClient()

// ── Math renderer ──────────────────────────────────────────────────────────────
function parseMath(text) {
  const parts = []; let i = 0, buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      if (buf) { parts.push({ t: 'text', v: buf }); buf = '' }
      const type = ch === '^' ? 'sup' : 'sub'; i++
      if (text[i] === '{') {
        const end = text.indexOf('}', i)
        parts.push({ t: type, v: end === -1 ? text.slice(i+1) : text.slice(i+1, end) })
        i = end === -1 ? text.length : end + 1
      } else {
        let val = ''
        while (i < text.length && /[a-zA-Z0-9.]/.test(text[i])) { val += text[i]; i++ }
        if (val) parts.push({ t: type, v: val }); else buf += ch
      }
    } else { buf += ch; i++ }
  }
  if (buf) parts.push({ t: 'text', v: buf })
  return parts
}
function MathText({ text }) {
  if (!text) return null
  return (
    <span>{parseMath(String(text)).map((p, i) =>
      p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0 }}>{p.v}</sup>
      : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub>
      : <span key={i}>{p.v}</span>
    )}</span>
  )
}

// ── Step-by-step solution reveal (reuses LessonPlayer stagger pattern) ─────────
function SolutionReveal({ steps, finalAnswer, accent }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (shown >= steps.length) return
    const t = setTimeout(() => setShown(n => n + 1), 380)
    return () => clearTimeout(t)
  }, [shown, steps.length])

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>
        Solution
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.slice(0, shown).map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'stepIn 0.35s ease both' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, fontFamily: 'Nunito, sans-serif', flexShrink: 0, marginTop: 4 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, background: '#FEFDE8', border: '1px solid #F0EAC0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
              <MathText text={step} />
            </div>
          </div>
        ))}
      </div>
      {shown >= steps.length && finalAnswer && (
        <div style={{ marginTop: 14, padding: '12px 18px', background: `${accent}14`, border: `2px solid ${accent}35`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, animation: 'stepIn 0.4s ease both' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>Answer</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: accent, fontFamily: "'Courier New', monospace" }}>
            <MathText text={finalAnswer} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Diagram ────────────────────────────────────────────────────────────────────
function Diagram({ svg, description }) {
  if (svg) return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(0,0,0,0.1)', marginBottom: 16, background: '#fff' }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  )
  if (description) return (
    <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.06)', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'Nunito, sans-serif' }}>Diagram</div>
      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>{description}</div>
    </div>
  )
  return null
}

export default function PastQuestionsPage() {
  const { M }         = useMode()
  const router        = useRouter()
  const params        = useSearchParams()
  const accent        = M.accentColor

  const [topics, setTopics]           = useState([])
  const [selectedTopic, setTopic]     = useState(params.get('topic') || '')
  const [questions, setQuestions]     = useState([])
  const [qIdx, setQIdx]               = useState(0)
  const [loading, setLoading]         = useState(false)
  const [picked, setPicked]           = useState(null)      // MCQ: selected option text
  const [showSolution, setShowSolution] = useState(false)
  const [score, setScore]             = useState({ correct: 0, total: 0 })

  // Load topics
  useEffect(() => {
    supabase.from('topics').select('id, title, slug').order('title').then(({ data }) => {
      setTopics((data || []).map(t => ({
        ...t,
        slug: t.slug || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })))
    })
  }, [])

  // Load questions when topic changes
  const loadQuestions = useCallback(async (slug) => {
    if (!slug) return
    setLoading(true)
    setQIdx(0); setPicked(null); setShowSolution(false)
    const { data } = await supabase
      .from('past_questions')
      .select('*')
      .eq('topic_slug', slug)
      .order('year').order('question_number')
    // Shuffle
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    setQuestions(shuffled)
    setScore({ correct: 0, total: 0 })
    setLoading(false)
  }, [])

  useEffect(() => { if (selectedTopic) loadQuestions(selectedTopic) }, [selectedTopic, loadQuestions])

  const q = questions[qIdx]
  const steps = q ? (Array.isArray(q.solution_steps) ? q.solution_steps : [q.solution_steps]) : []

  function pickOption(opt) {
    if (picked !== null) return
    setPicked(opt)
    setShowSolution(true)
    setScore(s => ({ correct: s.correct + (opt === q.correct_answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1)
      setPicked(null)
      setShowSolution(false)
    }
  }

  const isCorrect = picked === q?.correct_answer

  return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`
        @keyframes stepIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${M.progressTrack}`, background: M.lessonBg, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: M.textSecondary, padding: 4 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>Past Questions</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topics.find(t => t.slug === selectedTopic)?.title || 'Select a topic'}
          </div>
        </div>
        {questions.length > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary }}>
            {qIdx + 1} / {questions.length}
          </div>
        )}
      </div>

      {/* Topic picker */}
      {!selectedTopic || questions.length === 0 ? (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8 }}>Choose a topic</div>
          <select
            value={selectedTopic}
            onChange={e => setTopic(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', background: M.lessonBg, border: `1.5px solid ${accent}30`, borderRadius: 14, fontSize: 15, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', marginBottom: 16 }}
          >
            <option value="">— Select topic to start —</option>
            {topics.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
          </select>
          {loading && <div style={{ textAlign: 'center', color: M.textSecondary, fontSize: 13 }}>Loading questions…</div>}
          {selectedTopic && !loading && questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: M.textSecondary }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: M.textPrimary, marginBottom: 6 }}>No past questions yet</div>
              <div style={{ fontSize: 13 }}>Past questions for this topic have not been uploaded.</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px max(80px, calc(60px + env(safe-area-inset-bottom)))' }}>

          {/* Topic select row */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={selectedTopic} onChange={e => setTopic(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: M.lessonBg, border: `1px solid ${accent}20`, borderRadius: 12, fontSize: 13, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
              {topics.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
            </select>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: M.progressTrack, borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${((qIdx + 1) / questions.length) * 100}%`, background: accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>

          {/* Score */}
          {score.total > 0 && (
            <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
              <div style={{ padding: '6px 14px', background: '#22c55e14', border: '1.5px solid #22c55e30', borderRadius: 99, fontSize: 11, fontWeight: 900, color: '#22c55e', fontFamily: 'Nunito, sans-serif' }}>
                {score.correct} correct
              </div>
              <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.05)', borderRadius: 99, fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>
                {score.total - score.correct} wrong
              </div>
            </div>
          )}

          {/* Question card */}
          {q && (
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>

              {/* Meta strip */}
              <div style={{ padding: '10px 18px', background: `${accent}09`, display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{q.exam_body} {q.year}</span>
                <span style={{ fontSize: 10, color: '#888' }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>Q{q.question_number}</span>
                <span style={{ fontSize: 10, color: '#888' }}>·</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 900, background: q.question_type === 'mcq' ? `${accent}14` : 'rgba(255,107,107,0.12)', color: q.question_type === 'mcq' ? accent : '#FF6B6B', textTransform: 'uppercase' }}>{q.question_type}</span>
                {q.marks && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#888', fontWeight: 700 }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
              </div>

              <div style={{ padding: '20px 20px 24px' }}>
                {/* Diagram */}
                <Diagram svg={q.diagram_svg} description={q.diagram_description} />

                {/* Question text */}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.7, fontFamily: 'Nunito, sans-serif', marginBottom: 20 }}>
                  <MathText text={q.question_text} />
                </div>

                {/* MCQ options */}
                {q.question_type === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: showSolution ? 20 : 0 }}>
                    {(q.options || []).map((opt, i) => {
                      const isSelected = picked === opt
                      const isRight    = opt === q.correct_answer
                      let bg = 'transparent', border = 'rgba(0,0,0,0.1)', color = '#1a1a1a'
                      if (picked !== null) {
                        if (isRight)             { bg = 'rgba(34,197,94,0.1)';  border = '#22c55e'; color = '#15803d' }
                        else if (isSelected)     { bg = 'rgba(239,68,68,0.08)'; border = '#EF4444'; color = '#dc2626' }
                      } else if (isSelected) { bg = `${accent}12`; border = accent; color = accent }
                      return (
                        <button key={i} onClick={() => pickOption(opt)} disabled={picked !== null}
                          style={{ padding: '13px 16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, cursor: picked !== null ? 'default' : 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 700, color, fontFamily: 'Nunito, sans-serif', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${border}20`, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: border, flexShrink: 0 }}>
                            {picked !== null ? (isRight ? '✓' : isSelected ? '✗' : String.fromCharCode(65+i)) : String.fromCharCode(65+i)}
                          </div>
                          <MathText text={opt} />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Theory: show solution button */}
                {q.question_type === 'theory' && !showSolution && (
                  <button onClick={() => setShowSolution(true)} style={{ padding: '13px 24px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', width: '100%', boxShadow: `0 6px 20px ${accent}40` }}>
                    Show Solution
                  </button>
                )}

                {/* Solution reveal */}
                {showSolution && steps.length > 0 && (
                  <SolutionReveal steps={steps} finalAnswer={q.final_answer} accent={accent} />
                )}
              </div>
            </div>
          )}

          {/* Next button */}
          {showSolution && qIdx < questions.length - 1 && (
            <button onClick={next} style={{ width: '100%', marginTop: 16, padding: '16px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 22px ${accent}45` }}>
              Next Question →
            </button>
          )}

          {/* Finished */}
          {(qIdx === questions.length - 1 && showSolution) && (
            <div style={{ marginTop: 16, padding: '20px', background: '#fff', borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: accent, fontFamily: M.headingFont, marginBottom: 4 }}>
                {score.correct} / {score.total}
              </div>
              <div style={{ fontSize: 13, color: '#888', fontFamily: 'Nunito, sans-serif', marginBottom: 16 }}>
                {Math.round((score.correct / score.total) * 100)}% correct · {topics.find(t => t.slug === selectedTopic)?.title}
              </div>
              <button onClick={() => loadQuestions(selectedTopic)} style={{ padding: '12px 28px', background: `${accent}14`, border: `1.5px solid ${accent}30`, borderRadius: 14, color: accent, fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                Practice Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}