import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudentStore } from '@/stores/student'
import { cn } from '@/lib/utils'
import { BookOpen, Star } from 'lucide-react'

const SEGMENTS = [
  { key: 'all', label: '全部' },
  { key: 'stroke', label: '笔画 1-16' },
  { key: 'structure', label: '结构 17-25' },
]

export function BookshelfPage() {
  const navigate = useNavigate()
  const { books, booksLoading, fetchBooks } = useStudentStore()
  const [segment, setSegment] = useState('all')

  useEffect(() => { fetchBooks() }, [fetchBooks])

  const filteredBooks = books.filter(b => {
    if (segment === 'stroke') return b.category === 'root'
    if (segment === 'structure') return b.category === 'trunk'
    return true
  })
  const isGrid = segment !== 'all'

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">练习书架</h1>
        <div className="flex items-center gap-1">
          <BookOpen size={16} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">{books.length}本</span>
        </div>
      </div>

      {/* 分段控制 */}
      <div className="px-5 pb-2">
        <div className="flex rounded-tag border border-border overflow-hidden">
          {SEGMENTS.map((seg, i) => (
            <button
              key={seg.key}
              onClick={() => setSegment(seg.key)}
              className={cn(
                'flex-1 py-2.5 text-[13px] font-medium text-center',
                segment === seg.key ? 'bg-primary text-white rounded-lg' : 'text-text-secondary',
                i > 0 && segment !== seg.key && 'border-l border-border'
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表/网格 */}
      <div className="flex-1 overflow-y-auto px-5 py-1">
        {booksLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isGrid ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredBooks.map(book => {
              const hasProgress = book.currentScore > 0
              return (
                <div key={book.id} onClick={() => navigate(`/works/${book.id}`)} className={cn('border border-divider rounded-input p-3 flex flex-col gap-2', !hasProgress && 'opacity-50')}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary font-number">{String(book.orderNum).padStart(2, '0')}</span>
                    {hasProgress && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">进行中</span>}
                  </div>
                  <h3 className="text-sm font-semibold">{book.name}</h3>
                  {hasProgress && (
                    <>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (book.currentScore / book.maxScore) * 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-tertiary">{book.currentScore}/{book.maxScore}</span>
                        <div className="flex gap-0.5">
                          {[book.scores.level5, book.scores.level20, book.scores.level50].map((achieved, i) => (
                            <Star key={i} size={12} className={achieved ? 'text-primary fill-primary' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredBooks.map(book => {
              const hasProgress = book.currentScore > 0
              return (
                <div key={book.id} onClick={() => navigate(`/works/${book.id}`)} className={cn('flex items-center justify-between py-3.5 border-b border-divider', !hasProgress && 'opacity-50')}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-text-tertiary font-number w-5">{String(book.orderNum).padStart(2, '0')}</span>
                    <span className="text-sm font-medium">{book.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasProgress && (
                      <>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (book.currentScore / book.maxScore) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-text-tertiary font-number">{book.currentScore}/{book.maxScore}</span>
                        <div className="flex gap-0.5">
                          {[book.scores.level5, book.scores.level20, book.scores.level50].map((achieved, i) => (
                            <Star key={i} size={10} className={achieved ? 'text-primary fill-primary' : 'text-gray-300'} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
