'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, CheckCircle, Circle, Lock } from 'lucide-react'

export default function TopicPage({ topic, student, progress }) {
  const router = useRouter()

  function getStatus(subtopicId) {
    return progress.find(p => p.subtopic_id === subtopicId)?.status || 'not_started'
  }

  function getFirstIncomplete() {
    return topic.subtopics.find(s => getStatus(s.id) !== 'completed')
  }

  const completedCount = topic.subtopics.filter(s => getStatus(s.id) === 'completed').length
  const totalCount = topic.subtopics.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const firstIncomplete = getFirstIncomplete()

  function canAccess(subtopic, idx) {
    if (idx === 0) return true
    const prevSubtopic = topic.subtopics[idx - 1]
    return getStatus(prevSubtopic.id) === 'completed'
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">

      {/* Header */}
      <div className="bg-[#161B22] border-b border-white/10 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/learn')}
            className="text-[#8899AA] hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-[#8899AA] text-xs">
              {topic.units?.levels?.name} · {topic.units?.title}
            </p>
            <h1 className="text-white font-bold text-lg leading-tight">{topic.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Progress Card */}
        <div className="bg-[#161B22] border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Topic Progress</span>
            <span className="text-[#00E676] font-bold">{progressPercent}%</span>
          </div>
          <div className="bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00C853] to-[#00E676] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[#8899AA] text-xs mt-2">
            {completedCount} of {totalCount} subtopics completed
          </p>
        </div>

        {/* Continue Button */}
        {firstIncomplete && (
          <button
            onClick={() => router.push(`/learn/lesson/${firstIncomplete.id}`)}
            className="w-full bg-[#00E676] text-black font-bold py-4 rounded-2xl hover:bg-[#00C853] transition-colors mb-6 flex items-center justify-center gap-2"
          >
            {completedCount === 0 ? '🚀 Start Topic' : '▶️ Continue Learning'}
          </button>
        )}

        {progressPercent === 100 && (
          <div className="w-full bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] font-bold py-4 rounded-2xl mb-6 flex items-center justify-center gap-2">
            ✅ Topic Complete! Well done!
          </div>
        )}

        {/* Subtopics List */}
        <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h2 className="text-white font-bold text-sm">Subtopics</h2>
          </div>

          <div className="divide-y divide-white/5">
            {topic.subtopics.map((subtopic, idx) => {
              const status = getStatus(subtopic.id)
              const accessible = canAccess(subtopic, idx)

              return (
                <button
                  key={subtopic.id}
                  onClick={() => accessible && router.push(`/learn/lesson/${subtopic.id}`)}
                  disabled={!accessible}
                  className={`w-full px-5 py-4 flex items-center gap-4 transition-colors text-left ${
                    accessible
                      ? 'hover:bg-white/5 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle size={22} className="text-[#00E676]" />
                    ) : status === 'in_progress' ? (
                      <Circle size={22} className="text-yellow-400" />
                    ) : accessible ? (
                      <Circle size={22} className="text-[#8899AA]" />
                    ) : (
                      <Lock size={22} className="text-[#8899AA]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${
                      status === 'completed' ? 'text-[#00E676]' : 'text-white'
                    }`}>
                      {subtopic.title}
                    </p>
                    {subtopic.learning_objectives?.length > 0 && (
                      <p className="text-[#8899AA] text-xs mt-0.5 truncate">
                        {subtopic.learning_objectives[0]}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status === 'in_progress' && (
                      <span className="text-yellow-400 text-xs font-semibold">In Progress</span>
                    )}
                    {accessible && status !== 'completed' && (
                      <ChevronRight size={16} className="text-[#8899AA]" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* XP Info */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[#8899AA] text-xs">
          <span>⚡ Earn 10 XP for each completed subtopic</span>
        </div>

      </div>
    </div>
  )
}