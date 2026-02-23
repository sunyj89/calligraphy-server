import { useState } from 'react'
import { NavBar } from '@/components/layout/NavBar'

function SwitchItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-divider">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export function PrivacySettingsPage() {
  const [settings, setSettings] = useState({
    showScore: true,
    showStage: true,
    showWorks: false,
    showSchool: false,
  })

  const update = (key: keyof typeof settings) => (val: boolean) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="个人隐私保护" />
      <div className="px-5 py-2">
        <p className="text-xs text-text-tertiary mb-4">设置你的个人信息可见范围</p>
        <SwitchItem label="展示我的积分" checked={settings.showScore} onChange={update('showScore')} />
        <SwitchItem label="展示我的阶段" checked={settings.showStage} onChange={update('showStage')} />
        <SwitchItem label="展示我的作品" checked={settings.showWorks} onChange={update('showWorks')} />
        <SwitchItem label="展示我的学校" checked={settings.showSchool} onChange={update('showSchool')} />
      </div>
    </div>
  )
}
