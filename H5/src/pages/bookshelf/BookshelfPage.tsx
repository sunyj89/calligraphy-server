import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Image as ImageIcon } from 'lucide-react'

import { formatDate, GALLERY_SCOPE_LABELS, getBookProgress, getWorkDisplayTitle, TERM_LABELS } from '@/lib/student'
import { useStudentStore } from '@/stores/student'

export function BookshelfPage() {
  const navigate = useNavigate()
  const { books, booksLoading, works, worksLoading, fetchBooks, fetchWorks } = useStudentStore()

  useEffect(() => {
    void fetchBooks()
    void fetchWorks()
  }, [fetchBooks, fetchWorks])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">书架</h1>
        <div className="flex items-center gap-1">
          <BookOpen size={16} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">{books.length} 册</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">练习册点亮状态</h2>
            <span className="text-xs text-text-tertiary">顺序按后端 `order_num` 返回</span>
          </div>

          {booksLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-card bg-primary-lighter p-4 text-sm text-text-tertiary">当前没有练习册数据</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {books.map((book) => {
                const progress = getBookProgress(book)

                return (
                  <div
                    key={book.id}
                    className={`rounded-input border p-3 ${
                      progress.lit === true ? 'border-primary bg-primary-lighter' : 'border-divider bg-gray-50'
                    }`}
                  >
                    <div className="text-xs text-text-tertiary">{String(book.orderNum).padStart(2, '0')}</div>
                    <h3 className="mt-1 text-sm font-semibold text-text-primary">{book.name}</h3>
                    <p className="mt-2 text-xs text-text-secondary">
                      {progress.lit === true ? '已点亮' : progress.lit === false ? '未点亮' : '待后端返回'}
                    </p>
                    <div className="mt-2 space-y-1 text-[11px] text-text-tertiary">
                      <div>点亮分值：{progress.litScore ?? '--'}</div>
                      <div>{progress.lit === null ? '当前接口未返回 is_lit / lit_score' : '点亮状态由后端字段控制'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="pb-4 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">我的作品</h2>
            <span className="text-xs text-text-tertiary">作品接口：`GET /api/student/works`</span>
          </div>

          {worksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : works.length === 0 ? (
            <div className="rounded-card bg-primary-lighter p-4 text-sm text-text-tertiary">当前没有作品数据</div>
          ) : (
            <div className="space-y-3">
              {works.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  data-testid="h5-work-card"
                  onClick={() => navigate(`/works/${work.id}`)}
                  className="flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-sm"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-card bg-primary-lighter">
                    {work.thumbnailUrl || work.imageUrl ? (
                      <img src={work.thumbnailUrl || work.imageUrl} alt={work.description || '作品'} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text-primary">{getWorkDisplayTitle(work, books)}</div>
                    <div className="mt-1 text-[11px] text-text-tertiary">
                      {TERM_LABELS[work.term]} · 槽位 {work.slotIndex}
                    </div>
                    <div className="mt-1 text-[11px] text-text-tertiary">{GALLERY_SCOPE_LABELS[work.galleryScope]}</div>
                    <div className="mt-1 text-[11px] text-text-tertiary">{formatDate(work.createdAt)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-number text-lg font-semibold text-primary">{work.score}</div>
                    <div className="text-[11px] text-text-tertiary">作品分</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
