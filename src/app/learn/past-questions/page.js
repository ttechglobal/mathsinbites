'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

const supabase = createClient()

// ── Math renderer ─────────────────────────────────────────────────────────────
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
function MathText({ text, size = 17 }) {
  if (!text) return null
  return (
    <span style={{ fontSize: size }}>
      {parseMath(String(text)).map((p, i) =>
        p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0, fontWeight: 800 }}>{p.v}</sup>
        : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub>
        : <span key={i}>{p.v}</span>
      )}
    </span>
  )
}

// ── Step-by-step solution (Lesson Player style) ───────────────────────────────
function SolutionReveal({ steps, finalAnswer, accent }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= steps.length) return
    const t = setTimeout(() => setShown(n => n + 1), 360)
    return () => clearTimeout(t)
  }, [shown, steps.length])

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.4, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>Solution</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.slice(0, shown).map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'stepIn 0.3s ease both' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, fontFamily: 'Nunito, sans-serif', flexShrink: 0, marginTop: 4 }}>{i + 1}</div>
            <div style={{ flex: 1, background: '#FEFDE8', border: '1px solid #F0EAC0', borderRadius: 12, padding: '11px 15px', lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#2D2D2D' }}>
              <MathText text={step} size={15} />
            </div>
          </div>
        ))}
      </div>
      {shown >= steps.length && finalAnswer && (
        <div style={{ marginTop: 14, padding: '13px 18px', background: `${accent}12`, border: `2px solid ${accent}35`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, animation: 'stepIn 0.4s ease both' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>Answer</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: accent, fontFamily: "'Courier New', monospace" }}>
            <MathText text={finalAnswer} size={20} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Diagram ───────────────────────────────────────────────────────────────────
function Diagram({ svg, description, accent }) {
  if (svg) return <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(0,0,0,0.08)', marginBottom: 16, background: '#fff' }} dangerouslySetInnerHTML={{ __html: svg }} />
  if (description) return (
    <div style={{ padding: '12px 16px', background: `rgba(124,58,237,0.06)`, border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>Diagram</div>
      <div style={{ fontSize: 14, color: '#333', lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>{description}</div>
    </div>
  )
  return null
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function PastQuestionsPage() {
  const { M, mode } = useMode()
  const router      = useRouter()
  const params      = useSearchParams()
  const accent      = M.accentColor
  const isNova      = mode === 'nova'
  const isBlaze     = mode === 'blaze'
  const bodyColor   = isNova ? 'rgba(165,180,252,0.7)' : M.textSecondary

  // phases: 'pick' → 'quiz' → 'result' → 'review'
  const [phase,         setPhase]         = useState('pick')
  const [topics,        setTopics]        = useState([])
  const [selectedTopic, setSelectedTopic] = useState(params.get('topic') || '')
  const [questions,     setQuestions]     = useState([])
  const [qIdx,          setQIdx]          = useState(0)
  const [answers,       setAnswers]       = useState({})   // { [qId]: picked }
  const [loading,       setLoading]       = useState(true)

  // ── Load topics ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: pqs } = await supabase.from('past_questions').select('topic_slug').limit(2000)
      const slugs = [...new Set((pqs || []).map(q => q.topic_slug).filter(Boolean))].sort()
      // Convert slugs to display titles
      const titleMap = {}
      slugs.forEach(slug => {
        titleMap[slug] = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      })
      // Try to match against topics table for better titles
      const { data: topicRows } = await supabase.from('topics').select('title, slug').order('title')
      for (const slug of slugs) {
        const match = (topicRows || []).find(t =>
          t.slug === slug || t.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
        )
        if (match) titleMap[slug] = match.title
      }
      const list = slugs.map(slug => ({ slug, title: titleMap[slug] }))
      setTopics(list)
      setLoading(false)
      // If came with ?topic= go straight to quiz
      const p = params.get('topic')
      if (p) { setSelectedTopic(p); setPhase('quiz') }
    }
    load()
  }, [])

  // ── Load questions for selected topic ──────────────────────────────────────
  const loadQuestions = useCallback(async (slug) => {
    if (!slug) return
    setLoading(true)
    const { data } = await supabase.from('past_questions').select('*')
      .eq('topic_slug', slug).order('year').order('question_number')
    setQuestions((data || []).sort(() => Math.random() - 0.5))
    setAnswers({})
    setQIdx(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (phase === 'quiz' && selectedTopic) loadQuestions(selectedTopic)
  }, [selectedTopic, phase, loadQuestions])

  function startTopic(slug) {
    setSelectedTopic(slug)
    setPhase('quiz')
  }

  function pickAnswer(qId, opt) {
    setAnswers(prev => ({ ...prev, [qId]: opt }))
  }

  function submitQuiz() {
    setPhase('result')
    setQIdx(0)
    // Save progress to DB
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      let correct = 0
      for (const q of questions) {
        if (answers[q.id] === q.correct_answer) correct++
      }
      supabase.from('practice_results').insert({
        user_id: user.id,
        topic_slug: selectedTopic,
        correct, total: questions.length,
        percentage: questions.length > 0 ? Math.round(correct / questions.length * 100) : 0,
      }).catch(() => {}) // table may not exist yet — silent fail
    })
  }

  const q = questions[qIdx]
  const steps = q ? (Array.isArray(q.solution_steps) ? q.solution_steps : (q.solution_steps ? [q.solution_steps] : [])) : []

  // ── Scoring ────────────────────────────────────────────────────────────────
  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length
  const totalCount   = questions.length
  const pct          = totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0

  // ── HEADER ─────────────────────────────────────────────────────────────────
  const Header = ({ title, subtitle, showBack = true, onBack }) => (
    <div style={{ flexShrink: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, background: M.hudBg || M.lessonBg, position: 'sticky', top: 0, zIndex: 20 }}>
      {showBack && (
        <button onClick={onBack || (() => router.back())} style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: M.lessonCard, border: '1.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: M.textSecondary, flexShrink: 0 }}>←</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>{title}</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: M.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
      </div>
      {phase === 'quiz' && questions.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 700, color: bodyColor, flexShrink: 0 }}>{qIdx + 1} / {questions.length}</div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: PICK TOPIC
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'pick') return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <Header title="Practice by Topic" subtitle="Choose a topic to practise" onBack={() => router.back()} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 28 }}>📋</div>
            <div style={{ fontSize: 13, color: bodyColor }}>Loading topics…</div>
          </div>
        ) : topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fadeUp 0.3s ease both' }}>
            <BicPencil pose="think" size={80} style={{ display: 'inline-block', marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary, marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>No past questions yet</div>
            <div style={{ fontSize: 13, color: bodyColor }}>Ask your admin to upload past questions first.</div>
          </div>
        ) : (
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px max(80px,calc(60px + env(safe-area-inset-bottom)))', animation: 'fadeUp 0.25s ease both' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>
              {topics.length} topic{topics.length !== 1 ? 's' : ''} available
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {topics.map((t, i) => (
                <button key={t.slug} onClick={() => startTopic(t.slug)}
                  style={{ padding: '16px 18px', background: M.lessonCard || '#fff', border: M.lessonBorder || '1.5px solid rgba(0,0,0,0.07)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Nunito, sans-serif', boxShadow: M.cardShadow || '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, animation: `fadeUp 0.2s ${Math.min(i * 0.025, 0.3)}s ease both` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}12`, border: `1.5px solid ${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>✏️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: M.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: bodyColor, fontWeight: 600, marginTop: 2 }}>Practice questions</div>
                  </div>
                  <div style={{ fontSize: 16, color: accent, fontWeight: 900 }}>→</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: QUIZ
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'quiz') return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <Header
        title={topics.find(t => t.slug === selectedTopic)?.title || selectedTopic}
        subtitle={loading ? 'Loading…' : `${questions.length} questions`}
        onBack={() => setPhase('pick')}
      />

      {/* Progress bar */}
      {questions.length > 0 && (
        <div style={{ height: 4, background: M.progressTrack || 'rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${((qIdx + 1) / questions.length) * 100}%`, background: accent, transition: 'width 0.4s ease' }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 28 }}>⏳</div>
            <div style={{ fontSize: 13, color: bodyColor }}>Loading questions…</div>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <BicPencil pose="think" size={80} style={{ display: 'inline-block', marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 900, color: M.textPrimary, marginBottom: 8 }}>No questions for this topic yet</div>
            <button onClick={() => setPhase('pick')} style={{ padding: '12px 24px', background: `${accent}14`, border: `1.5px solid ${accent}30`, borderRadius: 12, color: accent, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>← Back to Topics</button>
          </div>
        ) : q ? (
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px max(120px,calc(100px + env(safe-area-inset-bottom)))', animation: 'fadeUp 0.2s ease both' }}>

            {/* Question card */}
            <div style={{ background: M.lessonCard || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: M.cardShadow || '0 4px 24px rgba(0,0,0,0.08)', border: M.lessonBorder || '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>

              {/* Meta strip */}
              <div style={{ padding: '10px 16px', background: `${accent}09`, borderBottom: `1px solid ${accent}12`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{q.exam_body} {q.year}</span>
                <span style={{ fontSize: 10, color: bodyColor }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: bodyColor, textTransform: 'uppercase' }}>Q{q.question_number}</span>
                <span style={{ fontSize: 10, color: bodyColor }}>·</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 900, background: q.question_type === 'mcq' ? `${accent}14` : 'rgba(239,68,68,0.1)', color: q.question_type === 'mcq' ? accent : '#EF4444', textTransform: 'uppercase' }}>{q.question_type}</span>
                {q.marks && <span style={{ marginLeft: 'auto', fontSize: 10, color: bodyColor, fontWeight: 700 }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
              </div>

              <div style={{ padding: '20px 20px 24px' }}>
                <Diagram svg={q.diagram_svg} description={q.diagram_description} accent={accent} />

                <div style={{ fontSize: 17, fontWeight: 700, color: M.textPrimary, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Nunito, sans-serif' }}>
                  <MathText text={q.question_text} size={17} />
                </div>

                {/* MCQ options */}
                {q.question_type === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(q.options || []).map((opt, i) => {
                      const picked = answers[q.id]
                      const isSelected = picked === opt
                      let bg = 'transparent', border = isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', color = M.textPrimary
                      if (isSelected) { bg = `${accent}12`; border = accent; color = accent }
                      return (
                        <button key={i} onClick={() => pickAnswer(q.id, opt)}
                          style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, cursor: 'pointer', textAlign: 'left', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${border}18`, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: border, flexShrink: 0 }}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <MathText text={opt} size={15} />
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'theory' && (
                  <div style={{ padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 14, color: '#888', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Nunito, sans-serif' }}>
                    Theory question — write your working on paper, then move on.
                  </div>
                )}
              </div>
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {qIdx > 0 && (
                <button onClick={() => setQIdx(i => i - 1)} style={{ flex: '0 0 52px', padding: '15px', background: 'transparent', border: `1.5px solid ${M.progressTrack || 'rgba(0,0,0,0.1)'}`, borderRadius: 14, cursor: 'pointer', fontSize: 18, color: M.textSecondary }}>←</button>
              )}
              {qIdx < questions.length - 1 ? (
                <button onClick={() => setQIdx(i => i + 1)} style={{ flex: 1, padding: '15px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
                  Next →
                </button>
              ) : (
                <button onClick={submitQuiz} style={{ flex: 1, padding: '15px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
                  Submit & See Results
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Score hero */}
      <div style={{ background: `linear-gradient(160deg,${accent},${accent}CC)`, padding: '40px 24px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <BicPencil pose={pct >= 70 ? 'celebrate' : 'thumbs'} size={72} style={{ display: 'inline-block', marginBottom: 14 }} />
        <div style={{ fontSize: 54, fontWeight: 900, color: '#fff', fontFamily: 'Sora, sans-serif', lineHeight: 1, marginBottom: 6 }}>{pct}%</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{correctCount} / {totalCount} correct</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          {topics.find(t => t.slug === selectedTopic)?.title || selectedTopic}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 80px', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: '14px', background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.25)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e', fontFamily: 'Sora, sans-serif' }}>{correctCount}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Correct</div>
          </div>
          <div style={{ flex: 1, padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#EF4444', fontFamily: 'Sora, sans-serif' }}>{totalCount - correctCount}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Wrong</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { setQIdx(0); setPhase('review') }}
            style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 22px ${accent}45` }}>
            Review with Solutions →
          </button>
          <button onClick={() => { loadQuestions(selectedTopic); setPhase('quiz') }}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: 16, color: accent, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            Try Again
          </button>
          <button onClick={() => setPhase('pick')}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: `1.5px solid rgba(0,0,0,0.1)`, borderRadius: 16, color: M.textSecondary, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            ← All Topics
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: REVIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const rq      = questions[qIdx]
    const rSteps  = rq ? (Array.isArray(rq.solution_steps) ? rq.solution_steps : (rq.solution_steps ? [rq.solution_steps] : [])) : []
    const picked  = rq ? answers[rq.id] : null
    const correct = rq && picked === rq.correct_answer

    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
        <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>

        <Header
          title="Review"
          subtitle={`Q${qIdx + 1} of ${questions.length} · ${correctCount}/${totalCount} correct`}
          onBack={() => setPhase('result')}
        />

        <div style={{ height: 3, background: M.progressTrack || 'rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${((qIdx + 1) / questions.length) * 100}%`, background: accent }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rq && (
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px max(100px,calc(80px + env(safe-area-inset-bottom)))', animation: 'fadeUp 0.2s ease both' }}>

              {/* Question card */}
              <div style={{ background: M.lessonCard || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: M.cardShadow || '0 4px 24px rgba(0,0,0,0.08)', border: M.lessonBorder || '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>

                <div style={{ padding: '10px 16px', background: picked ? (correct ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)') : `${accent}08`, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: accent }}>{rq.exam_body} {rq.year} · Q{rq.question_number}</span>
                  {picked && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: correct ? '#22c55e' : '#EF4444' }}>
                      {correct ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  )}
                </div>

                <div style={{ padding: '20px 20px 24px' }}>
                  <Diagram svg={rq.diagram_svg} description={rq.diagram_description} accent={accent} />
                  <div style={{ fontSize: 17, fontWeight: 700, color: M.textPrimary, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Nunito, sans-serif' }}>
                    <MathText text={rq.question_text} size={17} />
                  </div>

                  {rq.question_type === 'mcq' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                      {(rq.options || []).map((opt, i) => {
                        const isRight    = opt === rq.correct_answer
                        const isWrong    = picked === opt && !isRight
                        let bg = 'transparent', border = 'rgba(0,0,0,0.1)', color = M.textPrimary
                        if (isRight)  { bg = 'rgba(34,197,94,0.1)';  border = '#22c55e'; color = '#15803d' }
                        if (isWrong)  { bg = 'rgba(239,68,68,0.08)'; border = '#EF4444'; color = '#dc2626' }
                        return (
                          <div key={i} style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${border}18`, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: border, flexShrink: 0 }}>
                              {isRight ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
                            </div>
                            <MathText text={opt} size={15} />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Step by step solution */}
                  {rSteps.length > 0 && <SolutionReveal key={rq.id} steps={rSteps} finalAnswer={rq.final_answer} accent={accent} />}
                </div>
              </div>

              {/* Nav */}
              <div style={{ display: 'flex', gap: 10 }}>
                {qIdx > 0 && (
                  <button onClick={() => setQIdx(i => i - 1)} style={{ flex: '0 0 52px', padding: '15px', background: 'transparent', border: `1.5px solid ${M.progressTrack || 'rgba(0,0,0,0.1)'}`, borderRadius: 14, cursor: 'pointer', fontSize: 18, color: M.textSecondary }}>←</button>
                )}
                {qIdx < questions.length - 1 ? (
                  <button onClick={() => setQIdx(i => i + 1)} style={{ flex: 1, padding: '15px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
                    Next →
                  </button>
                ) : (
                  <button onClick={() => setPhase('result')} style={{ flex: 1, padding: '15px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                    Back to Results
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}