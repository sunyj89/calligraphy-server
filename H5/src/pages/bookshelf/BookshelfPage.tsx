import { useEffect, useMemo } from 'react';

import { BookOpen } from 'lucide-react';

import { useStudentStore } from '@/stores/student';

export function BookshelfPage() {
  const { books, booksLoading, records, fetchBooks, fetchRecords } = useStudentStore();

  useEffect(() => {
    void fetchBooks();
    void fetchRecords('practice', 1);
  }, [fetchBooks, fetchRecords]);

  const completedBookIds = useMemo(() => {
    const map = new Map<string, number>();
    records
      .filter((r) => r.scoreType === 'practice' && r.bookId)
      .forEach((r) => {
        const score = r.rawScore ?? r.score;
        map.set(r.bookId!, Math.max(map.get(r.bookId!) ?? 0, score));
      });
    return new Set(Array.from(map.entries()).filter(([, max]) => max >= 50).map(([bookId]) => bookId));
  }, [records]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">练习书架</h1>
        <div className="flex items-center gap-1">
          <BookOpen size={16} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">{books.length}本</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2">
        {booksLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {books.map((book) => {
              const completed = completedBookIds.has(book.id);
              return (
                <div
                  key={book.id}
                  className={`rounded-input border p-3 ${completed ? 'border-primary bg-primary-lighter' : 'border-divider bg-gray-50 opacity-60'}`}
                >
                  <div className="text-xs text-text-tertiary">{String(book.orderNum).padStart(2, '0')}</div>
                  <h3 className="mt-1 text-sm font-semibold">{book.name}</h3>
                  <p className="mt-2 text-xs">{completed ? '已点亮（单次>=50）' : '未完成'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
