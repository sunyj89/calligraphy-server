import { create } from 'zustand'
import { api } from '@/lib/api'
import type { ScoreRecord, Book, Work } from '@/types'

interface StudentState {
  records: ScoreRecord[]
  recordsTotal: number
  recordsLoading: boolean

  books: Book[]
  booksLoading: boolean

  works: Work[]
  worksLoading: boolean

  fetchRecords: (type?: string, page?: number) => Promise<void>
  fetchBooks: () => Promise<void>
  fetchWorks: (bookId?: string, page?: number) => Promise<void>
}

export const useStudentStore = create<StudentState>((set) => ({
  records: [],
  recordsTotal: 0,
  recordsLoading: false,

  books: [],
  booksLoading: false,

  works: [],
  worksLoading: false,

  fetchRecords: async (type = 'all', page = 1) => {
    set({ recordsLoading: true })
    try {
      const res = await api.getScores(type, page)
      set({ records: res.items, recordsTotal: res.total, recordsLoading: false })
    } catch {
      set({ recordsLoading: false })
    }
  },

  fetchBooks: async () => {
    set({ booksLoading: true })
    try {
      const res = await api.getBooks()
      set({ books: res.items, booksLoading: false })
    } catch {
      set({ booksLoading: false })
    }
  },

  fetchWorks: async (bookId?: string, page = 1) => {
    set({ worksLoading: true })
    try {
      const res = await api.getWorks(bookId, page)
      set({ works: res.items, worksLoading: false })
    } catch {
      set({ worksLoading: false })
    }
  },
}))
