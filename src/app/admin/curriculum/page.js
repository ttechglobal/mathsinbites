'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

const CLASS_LEVELS = [
  { code: 'JSS1', name: 'JSS 1', category: 'junior' },
  { code: 'JSS2', name: 'JSS 2', category: 'junior' },
  { code: 'JSS3', name: 'JSS 3', category: 'junior' },
  { code: 'SS1', name: 'SS 1', category: 'senior' },
  { code: 'SS2', name: 'SS 2', category: 'senior' },
  { code: 'SS3', name: 'SS 3', category: 'senior' },
  { code: 'Primary1', name: 'Primary 1', category: 'primary' },
  { code: 'Primary2', name: 'Primary 2', category: 'primary' },
  { code: 'Primary3', name: 'Primary 3', category: 'primary' },
  { code: 'Primary4', name: 'Primary 4', category: 'primary' },
  { code: 'Primary5', name: 'Primary 5', category: 'primary' },
  { code: 'Primary6', name: 'Primary 6', category: 'primary' },
]

const TERM_NAMES = {
  1: 'First Term',
  2: 'Second Term',
  3: 'Third Term',
}

export default function CurriculumPage() {
  const supabase = createClient()
  const [selectedLevel, setSelectedLevel] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedTerms, setExpandedTerms] = useState({})
  const [expandedUnits, setExpandedUnits] = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})

  const exampleJSON = JSON.stringify([
    {
      term: 1,
      term_name: "First Term",
      units: [
        {
          unit: "Number and Numeration",
          topics: [
            {
              title: "Whole Numbers",
              subtopics: [
                {
                  title: "Reading and writing whole numbers",
                  objectives: [
                    "Read whole numbers up to 1,000,000",
                    "Write whole numbers in words and figures"
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ], null, 2)

  function parseJSON() {
    setParseError('')
    setParsed(null)
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('JSON must be an array of terms')
      if (!data[0]?.term) throw new Error('Each item must have a "term" number (1, 2, or 3)')
      setParsed(data)
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message)
    }
  }

  async function saveCurriculum() {
    if (!selectedLevel) return alert('Please select a class level')
    if (!parsed) return alert('Please parse the JSON first')
    setSaving(true)

    try {
      const levelData = CLASS_LEVELS.find(l => l.code === selectedLevel)

      // Upsert level
      const { data: level, error: levelError } = await supabase
        .from('levels')
        .upsert(
          { name: levelData.name, code: levelData.code, category: levelData.category },
          { onConflict: 'code' }
        )
        .select()
        .single()

      if (levelError) throw levelError

      // Loop through terms
      for (const termData of parsed) {
        // Create term
        const { data: term, error: termError } = await supabase
          .from('terms')
          .upsert(
            {
              level_id: level.id,
              name: termData.term_name || TERM_NAMES[termData.term],
              term_number: termData.term,
              order_index: termData.term - 1,
            },
            { onConflict: 'level_id,term_number' }
          )
          .select()
          .single()

        if (termError) throw termError

        // Loop through units in this term
        for (let uIdx = 0; uIdx < termData.units.length; uIdx++) {
          const unit = termData.units[uIdx]

          const { data: unitRow, error: unitError } = await supabase
            .from('units')
            .insert({
              level_id: level.id,
              term_id: term.id,
              title: unit.unit,
              order_index: uIdx,
            })
            .select()
            .single()

          if (unitError) throw unitError

          // Loop through topics
          for (let tIdx = 0; tIdx < unit.topics.length; tIdx++) {
            const topic = unit.topics[tIdx]

            const { data: topicRow, error: topicError } = await supabase
              .from('topics')
              .insert({
                unit_id: unitRow.id,
                title: topic.title,
                order_index: tIdx,
              })
              .select()
              .single()

            if (topicError) throw topicError

            // Loop through subtopics
            for (let sIdx = 0; sIdx < topic.subtopics.length; sIdx++) {
              const subtopic = topic.subtopics[sIdx]

              const { error: subError } = await supabase
                .from('subtopics')
                .insert({
                  topic_id: topicRow.id,
                  title: subtopic.title,
                  learning_objectives: subtopic.objectives || [],
                  order_index: sIdx,
                })

              if (subError) throw subError
            }
          }
        }
      }

      setSaved(true)
      setParsed(null)
      setJsonInput('')
      setTimeout(() => setSaved(false), 4000)

    } catch (err) {
      alert('Error saving curriculum: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Count totals
  const totalTerms = parsed?.length || 0
  const totalUnits = parsed?.reduce((a, t) => a + (t.units?.length || 0), 0) || 0
  const totalTopics = parsed?.reduce((a, t) =>
    a + (t.units || []).reduce((b, u) => b + (u.topics?.length || 0), 0), 0) || 0
  const totalSubtopics = parsed?.reduce((a, t) =>
    a + (t.units || []).reduce((b, u) =>
      b + (u.topics || []).reduce((c, tp) => c + (tp.subtopics?.length || 0), 0), 0), 0) || 0

  return (
    <div className="max-w-4xl">
      <h2 className="text-white text-2xl font-bold mb-1">Curriculum Upload</h2>
      <p className="text-[#8899AA] text-sm mb-8">
        Paste your AI-generated JSON curriculum. Organised by Term → Unit → Topic → Subtopic.
      </p>

      {saved && (
        <div className="flex items-center gap-3 bg-[#00E676]/10 border border-[#00E676]/30 rounded-2xl p-4 mb-6">
          <CheckCircle size={20} className="text-[#00E676]" />
          <p className="text-[#00E676] font-semibold">Curriculum saved successfully!</p>
        </div>
      )}

      {/* Step 1 — Select Level */}
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 mb-4">
        <h3 className="text-white font-bold mb-1">Step 1 — Select Class Level</h3>
        <p className="text-[#8899AA] text-xs mb-4">Which class is this curriculum for?</p>
        <div className="grid grid-cols-6 gap-2">
          {CLASS_LEVELS.map(level => (
            <button
              key={level.code}
              onClick={() => setSelectedLevel(level.code)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedLevel === level.code
                  ? 'bg-[#00E676] text-black'
                  : 'bg-[#0D1117] border border-white/10 text-[#8899AA] hover:border-white/20'
              }`}
            >
              {level.code}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Paste JSON */}
      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 mb-4">
        <h3 className="text-white font-bold mb-1">Step 2 — Paste Curriculum JSON</h3>
        <p className="text-[#8899AA] text-xs mb-4">
          Must include all 3 terms. Structure: Term → Units → Topics → Subtopics.
        </p>

        <details className="mb-4">
          <summary className="text-[#00E676] text-xs font-semibold cursor-pointer hover:opacity-80">
            View expected JSON format
          </summary>
          <pre className="bg-[#0D1117] border border-white/10 rounded-xl p-4 text-xs text-[#8899AA] overflow-auto mt-2">
            {exampleJSON}
          </pre>
        </details>

        <textarea
          value={jsonInput}
          onChange={e => { setJsonInput(e.target.value); setParsed(null) }}
          placeholder="Paste your curriculum JSON here..."
          rows={14}
          className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors font-mono resize-none"
        />

        {parseError && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
            <AlertCircle size={16} />
            {parseError}
          </div>
        )}

        <button
          onClick={parseJSON}
          disabled={!jsonInput.trim()}
          className="mt-3 px-6 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:border-[#00E676]/30 hover:text-[#00E676] transition-colors disabled:opacity-40 text-sm"
        >
          Parse & Preview →
        </button>
      </div>

      {/* Step 3 — Preview */}
      {parsed && (
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 mb-4">
          <h3 className="text-white font-bold mb-1">Step 3 — Preview & Confirm</h3>
          <p className="text-[#8899AA] text-xs mb-4">
            Class: <span className="text-[#00E676] font-semibold">{selectedLevel || 'Not selected'}</span>
          </p>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Terms', value: totalTerms, color: 'text-blue-400' },
              { label: 'Units', value: totalUnits, color: 'text-yellow-400' },
              { label: 'Topics', value: totalTopics, color: 'text-[#00E676]' },
              { label: 'Subtopics', value: totalSubtopics, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#0D1117] rounded-xl p-3 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[#8899AA] text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tree Preview */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {parsed.map((termData, tIdx) => (
              <div key={tIdx} className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden">

                {/* Term Header */}
                <button
                  onClick={() => setExpandedTerms({ ...expandedTerms, [tIdx]: !expandedTerms[tIdx] })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  {expandedTerms[tIdx]
                    ? <ChevronDown size={16} className="text-blue-400" />
                    : <ChevronRight size={16} className="text-blue-400" />
                  }
                  <span className="text-blue-400 font-bold text-sm">
                    {termData.term_name || TERM_NAMES[termData.term]}
                  </span>
                  <span className="text-[#8899AA] text-xs ml-auto">
                    {termData.units?.length || 0} units
                  </span>
                </button>

                {/* Units */}
                {expandedTerms[tIdx] && (
                  <div className="px-4 pb-3 space-y-2">
                    {(termData.units || []).map((unit, uIdx) => (
                      <div key={uIdx} className="bg-[#161B22] border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedUnits({ ...expandedUnits, [`${tIdx}-${uIdx}`]: !expandedUnits[`${tIdx}-${uIdx}`] })}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          {expandedUnits[`${tIdx}-${uIdx}`]
                            ? <ChevronDown size={14} className="text-[#8899AA]" />
                            : <ChevronRight size={14} className="text-[#8899AA]" />
                          }
                          <span className="text-white text-sm font-semibold flex-1 text-left">{unit.unit}</span>
                          <span className="text-[#8899AA] text-xs">{unit.topics?.length || 0} topics</span>
                        </button>

                        {/* Topics */}
                        {expandedUnits[`${tIdx}-${uIdx}`] && (
                          <div className="px-3 pb-3 space-y-1">
                            {(unit.topics || []).map((topic, topIdx) => (
                              <div key={topIdx} className="bg-[#0D1117] border border-white/5 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => setExpandedTopics({ ...expandedTopics, [`${tIdx}-${uIdx}-${topIdx}`]: !expandedTopics[`${tIdx}-${uIdx}-${topIdx}`] })}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                                >
                                  {expandedTopics[`${tIdx}-${uIdx}-${topIdx}`]
                                    ? <ChevronDown size={12} className="text-[#8899AA]" />
                                    : <ChevronRight size={12} className="text-[#8899AA]" />
                                  }
                                  <span className="text-white text-xs font-medium flex-1 text-left">{topic.title}</span>
                                  <span className="text-[#8899AA] text-xs">{topic.subtopics?.length || 0} subtopics</span>
                                </button>

                                {/* Subtopics */}
                                {expandedTopics[`${tIdx}-${uIdx}-${topIdx}`] && (
                                  <div className="px-3 pb-2 space-y-1">
                                    {(topic.subtopics || []).map((sub, sIdx) => (
                                      <div key={sIdx} className="px-3 py-2 bg-[#161B22] rounded-lg">
                                        <p className="text-white text-xs font-medium">{sub.title}</p>
                                        {sub.objectives?.length > 0 && (
                                          <ul className="mt-1 space-y-0.5">
                                            {sub.objectives.map((obj, oIdx) => (
                                              <li key={oIdx} className="text-[#8899AA] text-xs flex items-start gap-1">
                                                <span className="text-[#00E676] mt-0.5">•</span>
                                                {obj}
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={saveCurriculum}
            disabled={saving || !selectedLevel}
            className="w-full mt-5 py-4 bg-[#00E676] text-black font-bold rounded-2xl hover:bg-[#00C853] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving to database...' : `Save ${selectedLevel} Curriculum →`}
          </button>
        </div>
      )}

      {!selectedLevel && !parsed && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-white font-semibold">Select a class level to begin</p>
          <p className="text-[#8899AA] text-sm mt-1">
            Curriculum will be organised into First, Second and Third Term automatically
          </p>
        </div>
      )}
    </div>
  )
}