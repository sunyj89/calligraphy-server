import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'
import { formatDate, GALLERY_SCOPE_LABELS, getBookName, TERM_LABELS } from '@/lib/student'
import type { Book, Work } from '@/types'

export function WorkDetailPage() {
  const { workId } = useParams<{ workId: string }>()
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workId) return

    Promise.all([api.getWork(workId), api.getBooks()])
      .then(([workResult, bookResult]) => {
        setWork(workResult)
        setBooks(bookResult.items)
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [workId, navigate])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-mobile items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!work) return null

  const bookName = getBookName(books, work.bookId)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white" data-testid="h5-work-detail">
      <NavBar title="作品详情" />

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <div className="overflow-hidden rounded-card border border-divider">
          <img src={work.imageUrl} alt={work.description || '作品图片'} className="w-full object-cover" />
        </div>

        <div className="rounded-card bg-primary-lighter p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-base font-bold text-text-primary">{work.description || `作品槽位 ${work.slotIndex}`}</div>
              <div className="mt-1 text-xs text-text-tertiary">{formatDate(work.createdAt)}</div>
            </div>
            <div className="text-right">
              <div className="font-number text-2xl font-semibold text-primary">{work.score}</div>
              <div className="text-[11px] text-text-tertiary">作品分</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-card bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">学期</span>
            <span className="font-medium text-text-primary">{TERM_LABELS[work.term]}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">槽位</span>
            <span className="font-medium text-text-primary">{work.slotIndex}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">展示范围</span>
            <span className="font-medium text-text-primary">{GALLERY_SCOPE_LABELS[work.galleryScope]}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">关联练习册</span>
            <span className="font-medium text-text-primary">{bookName || '--'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">当前状态</span>
            <span className="font-medium text-text-primary">{work.isActive ? '生效中' : '已失效'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
