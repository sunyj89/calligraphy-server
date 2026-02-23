import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import { ChevronRight } from 'lucide-react'

export function EditProfilePage() {
  const navigate = useNavigate()
  const student = useAuthStore(s => s.student)
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (student) {
      setName(student.name || '')
      setGender(student.gender || '')
      setBirthday(student.birthday || '')
      setSchool(student.school || '')
      setGrade(student.grade || '')
    }
  }, [student])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateProfile({ name, gender, birthday, school, grade })
      await refreshProfile()
      navigate(-1)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="修改个人信息" rightAction={
        <button onClick={handleSave} disabled={loading} className="text-sm text-primary font-semibold">
          {loading ? '保存中...' : '保存'}
        </button>
      } />
      <div className="px-5 py-4 flex flex-col">
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">头像</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-lg">😊</div>
            <ChevronRight size={18} className="text-[#CCCCCC]" />
          </div>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">昵称</span>
          <input value={name} onChange={e => setName(e.target.value)} className="text-sm text-right outline-none" placeholder="请输入昵称" />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">性别</span>
          <div className="flex gap-3">
            {['男', '女'].map(g => (
              <button key={g} onClick={() => setGender(g)} className={gender === g ? 'text-sm text-primary font-semibold' : 'text-sm text-text-tertiary'}>{g}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">生日</span>
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="text-sm text-right outline-none text-text-primary" />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">学校</span>
          <input value={school} onChange={e => setSchool(e.target.value)} className="text-sm text-right outline-none" placeholder="请输入学校" />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-divider">
          <span className="text-sm text-text-secondary">年级</span>
          <input value={grade} onChange={e => setGrade(e.target.value)} className="text-sm text-right outline-none" placeholder="请输入年级" />
        </div>
      </div>
    </div>
  )
}
