import { useLocation, useNavigate } from 'react-router-dom'
import { TreeDeciduous, List, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { path: '/home', icon: TreeDeciduous, label: '成长树' },
  { path: '/records', icon: List, label: '明细' },
  { path: '/bookshelf', icon: BookOpen, label: '书架' },
  { path: '/profile', icon: User, label: '我的' },
]

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex items-start justify-between bg-white px-5 pt-3 pb-7 safe-area-bottom">
      {TABS.map(tab => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <Icon
              size={22}
              className={cn(isActive ? 'text-primary' : 'text-text-disabled')}
            />
            <span
              className={cn(
                'text-[10px] tracking-wider',
                isActive ? 'text-primary font-bold' : 'text-text-disabled font-medium'
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
