import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'
import type { Work } from '@/types'

export function WorkDetailPage() {
  const { workId } = useParams<{ workId: string }>()
  const navigate = useNavigate()
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workId) return
    setLoading(true)
    api.getWork(workId).then(setWork).catch(() => navigate(-1)).finally(() => setLoading(false))
  }, [workId, navigate])

  if (loading) {
    return (
      <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!work) return null

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="练习详情" />

      <div className="flex-1 px-5 py-3 flex flex-col gap-4">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium mr-2">
              {work.bookName || '练习'}
            </span>
            <span className="text-base font-bold">{work.description || '练习作品'}</span>
          </div>
          {work.rating !== undefined && (
            <span className="text-primary font-bold text-sm">+{work.rating}分</span>
          )}
        </div>
        <span className="text-xs text-text-tertiary">
          {new Date(work.createdAt).toLocaleDateString('zh-CN')}
        </span>

        {/* 作品图片 */}
        <div>
          <h3 className="text-sm font-semibold mb-3">我的作品</h3>
          <div className="rounded-card overflow-hidden border border-divider">
            <img src={work.imageUrl} alt="作品" className="w-full object-cover" />
          </div>
        </div>

        {/* 教师评价 */}
        {work.teacherComment && (
          <div className="bg-primary-lighter rounded-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                <span className="text-sm">👩‍🏫</span>
              </div>
              <span className="text-sm font-semibold">{work.teacherName || '老师'}</span>
              <div className="ml-auto flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={14} className={i <= (work.rating || 0) ? 'text-primary fill-primary' : 'text-gray-300'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{work.teacherComment}</p>
            {work.tags && work.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {work.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
