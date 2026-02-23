import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function MobileLayout() {
  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
