import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Images, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudentStore } from '@/stores/student'
import type { Work } from '@/types'

const SEGMENTS = [
  { key: 'books', label: '练习册' },
  { key: 'works', label: '我的作品' },
] as const

type SegmentKey = (typeof SEGMENTS)[number]['key']

export function BookshelfPage() {
  const navigate = useNavigate()
  const { books, booksLoading, works, worksLoading, fetchBooks, fetchWorks } = useStudentStore()
  const [segment, setSegment] = useState<SegmentKey>('books')

  useEffect(() => {
    fetchBooks()
    fetchWorks()
  }, [fetchBooks, fetchWorks])

  const worksByBook = new Map<string, Work[]>()
  for (const work of works) {
    if (!work.bookId) {
      continue
    }

    const bookWorks = worksByBook.get(work.bookId) || []
    bookWorks.push(work)
    bookWorks.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    worksByBook.set(work.bookId, bookWorks)
  }

  const recentWorks = [...works].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )

  const openLatestWork = (bookId: string) => {
    const latestWork = worksByBook.get(bookId)?.[0]
    if (latestWork) {
      navigate(`/works/${latestWork.id}`)
    }
  }

  const isLoading = segment === 'books' ? booksLoading : worksLoading

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">练习书架</h1>
        <div className="flex items-center gap-1 text-text-secondary">
          {segment === 'books' ? <BookOpen size={16} /> : <Images size={16} />}
          <span className="text-xs font-semibold">{segment === 'books' ? `${books.length} 本` : `${works.length} 幅`}</span>
        </div>
      </div>

      <div className="px-5 pb-2">
        <div className="flex rounded-tag border border-border overflow-hidden">
          {SEGMENTS.map((item, index) => (
            <button
              key={item.key}
              onClick={() => setSegment(item.key)}
              className={cn(
                'flex-1 py-2.5 text-[13px] font-medium text-center',
                segment === item.key ? 'bg-primary text-white rounded-lg' : 'text-text-secondary',
                index > 0 && segment !== item.key && 'border-l border-border'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : segment === 'books' ? (
          <div className="flex flex-col gap-3">
            {books.map((book) => {
              const bookWorks = worksByBook.get(book.id) || []
              const latestWork = bookWorks[0]
              const submittedCount = bookWorks.length

              return (
                <button
                  key={book.id}
                  onClick={() => openLatestWork(book.id)}
                  disabled={!latestWork}
                  data-testid="h5-book-card"
                  className={cn(
                    'w-full rounded-card border border-divider p-4 text-left transition',
                    latestWork ? 'bg-white' : 'bg-[#FAFAFA]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-text-tertiary font-number mb-1">
                        第 {String(book.orderNum).padStart(2, '0')} 册
                      </p>
                      <h3 className="text-base font-semibold">{book.name}</h3>
                      <p className="text-sm text-text-tertiary mt-1 leading-6">
                        {book.description || '老师布置的练习内容会按册归档在这里。'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-[#CCCCCC] shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-tertiary">
                    <span>已提交作品 {submittedCount} 幅</span>
                    <span>{latestWork ? `最近提交 ${new Date(latestWork.createdAt).toLocaleDateString('zh-CN')}` : '暂未提交作品'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : recentWorks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {recentWorks.map((work) => {
              const book = books.find((item) => item.id === work.bookId)
              return (
                <button
                  key={work.id}
                  onClick={() => navigate(`/works/${work.id}`)}
                  data-testid="h5-work-card"
                  className="rounded-card overflow-hidden border border-divider bg-white text-left"
                >
                  <div className="aspect-[4/5] bg-primary-lighter">
                    <img
                      src={work.thumbnailUrl || work.imageUrl}
                      alt={work.description || '作品'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{work.description || '练习作品'}</p>
                    <p className="text-xs text-text-tertiary mt-1 truncate">{book?.name || '未关联练习册'}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-card bg-primary-lighter px-5 py-8 text-center text-sm text-text-tertiary leading-6">
            你还没有提交作品。
            <br />
            完成练习后，老师上传或记录的作品会展示在这里。
          </div>
        )}
      </div>
    </div>
  )
}
