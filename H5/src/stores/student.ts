import { create } from 'zustand'
import { api } from '@/lib/api'
import type { ScoreRecord, Book, Work, Term } from '@/types'

interface StudentState {
  records: ScoreRecord[]
  recordsTotal: number
  recordsLoading: boolean

  books: Book[]
  booksLoading: boolean

  works: Work[]
  worksLoading: boolean

  fetchRecords: (scoreType?: string, page?: number, term?: Term) => Promise<void>
  fetchBooks: () => Promise<void>
  fetchWorks: (term?: Term, page?: number) => Promise<void>
}

export const useStudentStore = create<StudentState>((set) => ({
  records: [],
  recordsTotal: 0,
  recordsLoading: false,

  books: [],
  booksLoading: false,

  works: [],
  worksLoading: false,

  fetchRecords: async (scoreType = 'all', page = 1, term) => {
    set({ recordsLoading: true })
    try {
      const res = await api.getScores(scoreType, page, 20, term)
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

  fetchWorks: async (term, page = 1) => {
    set({ worksLoading: true })
    try {
      const res = await api.getWorks(term, page)
      set({ works: res.items, worksLoading: false })
    } catch {
      set({ worksLoading: false })
    }
  },
}))
