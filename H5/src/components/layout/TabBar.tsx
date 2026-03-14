import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, List, TreeDeciduous, User } from 'lucide-react'

import { cn } from '@/lib/utils'

const TABS = [
  { path: '/home', icon: TreeDeciduous, label: '成长总览' },
  { path: '/records', icon: List, label: '成长明细' },
  { path: '/bookshelf', icon: BookOpen, label: '书架' },
  { path: '/profile', icon: User, label: '个人中心' },
]

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="safe-area-bottom flex items-start justify-between bg-white px-5 pb-7 pt-3">
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <Icon size={22} className={cn(isActive ? 'text-primary' : 'text-text-disabled')} />
            <span
              className={cn(
                'text-[10px] tracking-wider',
                isActive ? 'font-bold text-primary' : 'font-medium text-text-disabled'
              )}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
