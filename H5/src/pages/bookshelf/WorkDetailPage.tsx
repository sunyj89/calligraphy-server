import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, BookOpen } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'
import type { Work } from '@/types'

export function WorkDetailPage() {
  const { workId } = useParams<{ workId: string }>()
  const navigate = useNavigate()
  const [work, setWork] = useState<Work | null>(null)
  const [bookName, setBookName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workId) {
      navigate(-1)
      return
    }

    Promise.all([api.getWork(workId), api.getBooks()])
      .then(([workDetail, booksResponse]) => {
        setWork(workDetail)
        const book = booksResponse.items.find((item) => item.id === workDetail.bookId)
        setBookName(book?.name || '')
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [workId, navigate])

  if (loading) {
    return (
      <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!work) {
    return null
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <NavBar title="作品详情" />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4">
        <div data-testid="h5-work-detail" className="rounded-card bg-primary-lighter px-4 py-3">
          <p className="text-lg font-bold">{work.description || '练习作品'}</p>
          <div className="flex flex-col gap-2 mt-3 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <span>{bookName || '未关联练习册'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" />
              <span>{new Date(work.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">作品图片</h3>
          <div className="rounded-card overflow-hidden border border-divider bg-white">
            <img src={work.imageUrl} alt={work.description || '作品'} className="w-full object-cover" />
          </div>
        </div>

        {work.thumbnailUrl && (
          <div>
            <h3 className="text-sm font-semibold mb-3">缩略图</h3>
            <div className="rounded-card overflow-hidden border border-divider bg-white">
              <img src={work.thumbnailUrl} alt="作品缩略图" className="w-full object-cover" />
            </div>
          </div>
        )}

        <div className="rounded-card border border-divider px-4 py-3 text-sm text-text-secondary leading-6">
          当前 MVP 版本展示老师记录的作品图片与基础信息。
          后续如需增加点评、评分或标签，可以在下一阶段扩展。
        </div>
      </div>
    </div>
  )
}
