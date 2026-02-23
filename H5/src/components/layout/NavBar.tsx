import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface NavBarProps {
  title: string
  onBack?: () => void
  rightAction?: React.ReactNode
}

export function NavBar({ title, onBack, rightAction }: NavBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <button onClick={handleBack} className="p-1 -ml-1">
        <ChevronLeft size={24} className="text-text-primary" />
      </button>
      <h1 className="flex-1 text-base font-semibold">{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </div>
  )
}
