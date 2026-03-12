'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function GeneratePage({ levels }) {
  const [expandedLevels, setExpandedLevels] = useState({})
  const [expandedUnits, setExpandedUnits] = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})
  const [generating, setGenerating] = useState({})
  const [generated, setGenerated] = useState({})
  const [errors, setErrors] = useState({})

  function toggleLevel(id) {
    setExpandedLevels(prev => ({ ...prev, [id]: !prev[id] }))
  }
  function toggleUnit(id) {
    setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }))
  }
  function toggleTopic(id) {
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function generateLesson(subtopicId) {
    setGenerating(prev => ({ ...prev, [subtopicId]: true }))
    setErrors(prev => ({ ...prev, [subtopicId]: null }))

    try {
      const res = await fetch('/api/generate/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setGenerated(prev => ({ ...prev, [subtopicId]: true }))
    } catch (err) {
      setErrors(prev => ({ ...prev, [subtopicId]: err.message }))
    } finally {
      setGenerating(prev => ({ ...prev, [subtopicId]: false }))
    }
  }

  async function generateAllInTopic(subtopics) {
    for (const subtopic of subtopics) {
      if (!subtopic.is_published && !generated[subtopic.id]) {
        await generateLesson(subtopic.id)
        // Small delay between generations
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  function getSubtopicStatus(subtopic) {
    if (generating[subtopic.id]) return 'generating'
    if (generated[subtopic.id] || subtopic.is_published) return 'done'
    if (errors[subtopic.id]) return 'error'
    return 'pending'
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-white text-2xl font-bold mb-1">Generate Lessons</h2>
      <p className="text-[#8899AA] text-sm mb-8">
        Use AI to generate bite-sized lessons for each subtopic. Click generate on individual subtopics or generate all at once for a topic.
      </p>

      {levels.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-white font-semibold">No curriculum uploaded yet</p>
          <p className="text-[#8899AA] text-sm mt-1">
            Go to <a href="/admin/curriculum" className="text-[#00E676] hover:underline">Curriculum</a> to upload first
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {levels.map(level => {
            const allSubtopics = (level.units || [])
              .flatMap(u => u.topics || [])
              .flatMap(t => t.subtopics || [])
            const publishedCount = allSubtopics.filter(s => s.is_published || generated[s.id]).length

            return (
              <div key={level.id} className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">

                {/* Level Header */}
                <button
                  onClick={() => toggleLevel(level.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  {expandedLevels[level.id]
                    ? <ChevronDown size={18} className="text-[#8899AA]" />
                    : <ChevronRight size={18} className="text-[#8899AA]" />
                  }
                  <span className="text-white font-bold text-lg flex-1 text-left">{level.name}</span>
                  <span className="text-[#8899AA] text-sm">
                    {publishedCount}/{allSubtopics.length} lessons generated
                  </span>
                  <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden ml-2">
                    <div
                      className="h-full bg-[#00E676] rounded-full"
                      style={{ width: allSubtopics.length > 0 ? `${(publishedCount / allSubtopics.length) * 100}%` : '0%' }}
                    />
                  </div>
                </button>

                {/* Units */}
                {expandedLevels[level.id] && (
                  <div className="border-t border-white/10">
                    {(level.units || []).map(unit => (
                      <div key={unit.id} className="border-b border-white/5 last:border-0">

                        {/* Unit Header */}
                        <button
                          onClick={() => toggleUnit(unit.id)}
                          className="w-full flex items-center gap-3 px-8 py-3 hover:bg-white/5 transition-colors"
                        >
                          {expandedUnits[unit.id]
                            ? <ChevronDown size={16} className="text-[#8899AA]" />
                            : <ChevronRight size={16} className="text-[#8899AA]" />
                          }
                          <span className="text-white font-semibold flex-1 text-left text-sm">
                            {unit.title}
                          </span>
                        </button>

                        {/* Topics */}
                        {expandedUnits[unit.id] && (
                          <div className="pb-2">
                            {(unit.topics || []).map(topic => (
                              <div key={topic.id} className="mx-4 mb-2 bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden">

                                {/* Topic Header */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                                  <button
                                    onClick={() => toggleTopic(topic.id)}
                                    className="flex items-center gap-2 flex-1 text-left"
                                  >
                                    {expandedTopics[topic.id]
                                      ? <ChevronDown size={14} className="text-[#8899AA]" />
                                      : <ChevronRight size={14} className="text-[#8899AA]" />
                                    }
                                    <span className="text-white text-sm font-semibold">{topic.title}</span>
                                    <span className="text-[#8899AA] text-xs ml-1">
                                      ({topic.subtopics?.length || 0} subtopics)
                                    </span>
                                  </button>

                                  {/* Generate All button */}
                                  <button
                                    onClick={() => generateAllInTopic(topic.subtopics || [])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] text-xs font-semibold rounded-lg hover:bg-[#00E676]/20 transition-colors"
                                  >
                                    <Zap size={12} />
                                    Generate All
                                  </button>
                                </div>

                                {/* Subtopics */}
                                {expandedTopics[topic.id] && (
                                  <div className="divide-y divide-white/5">
                                    {(topic.subtopics || []).sort((a,b) => a.order_index - b.order_index).map(subtopic => {
                                      const status = getSubtopicStatus(subtopic)

                                      return (
                                        <div key={subtopic.id} className="flex items-center gap-3 px-4 py-3">

                                          {/* Status Icon */}
                                          <div className="flex-shrink-0">
                                            {status === 'generating' && (
                                              <RefreshCw size={16} className="text-yellow-400 animate-spin" />
                                            )}
                                            {status === 'done' && (
                                              <CheckCircle size={16} className="text-[#00E676]" />
                                            )}
                                            {status === 'error' && (
                                              <AlertCircle size={16} className="text-red-400" />
                                            )}
                                            {status === 'pending' && (
                                              <Clock size={16} className="text-[#8899AA]" />
                                            )}
                                          </div>

                                          {/* Subtopic title */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-medium truncate">
                                              {subtopic.title}
                                            </p>
                                            {errors[subtopic.id] && (
                                              <p className="text-red-400 text-xs mt-0.5 truncate">
                                                {errors[subtopic.id]}
                                              </p>
                                            )}
                                            {subtopic.generated_at && (
                                              <p className="text-[#8899AA] text-xs mt-0.5">
                                                Generated {new Date(subtopic.generated_at).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>

                                          {/* Action Button */}
                                          <button
                                            onClick={() => generateLesson(subtopic.id)}
                                            disabled={status === 'generating'}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                                              status === 'done'
                                                ? 'bg-white/5 border border-white/10 text-[#8899AA] hover:border-white/20'
                                                : status === 'generating'
                                                ? 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 cursor-not-allowed'
                                                : status === 'error'
                                                ? 'bg-red-400/10 border border-red-400/20 text-red-400 hover:bg-red-400/20'
                                                : 'bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/20'
                                            }`}
                                          >
                                            <Zap size={11} />
                                            {status === 'generating' ? 'Generating...' :
                                             status === 'done' ? 'Regenerate' :
                                             status === 'error' ? 'Retry' :
                                             'Generate'}
                                          </button>
                                        </div>
                                      )
                                    })}
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
            )
          })}
        </div>
      )}
    </div>
  )
}