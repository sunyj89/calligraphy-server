import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

export function EditProfilePage() {
  const navigate = useNavigate()
  const student = useAuthStore((state) => state.student)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!student) return
    setName(student.name || '')
    setGender(student.gender || '')
    setBirthday(student.birthday || '')
    setSchool(student.school || '')
    setGrade(student.grade || '')
  }, [student])

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      await api.updateProfile({ name, gender, birthday, school, grade })
      await refreshProfile()
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white">
      <NavBar
        title="修改个人信息"
        rightAction={
          <button onClick={handleSave} disabled={loading} className="text-sm font-semibold text-primary">
            {loading ? '保存中...' : '保存'}
          </button>
        }
      />

      <div className="flex flex-col px-5 py-4">
        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">头像</span>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-lg">
              {student?.avatar ? <img src={student.avatar} alt={student.name} className="h-full w-full rounded-full object-cover" /> : '学'}
            </div>
            <ChevronRight size={18} className="text-[#CCCCCC]" />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">姓名</span>
          <input value={name} onChange={(event) => setName(event.target.value)} className="text-right text-sm outline-none" placeholder="请输入姓名" />
        </div>

        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">性别</span>
          <div className="flex gap-3">
            {['male', 'female'].map((value) => (
              <button
                key={value}
                onClick={() => setGender(value)}
                className={gender === value ? 'text-sm font-semibold text-primary' : 'text-sm text-text-tertiary'}
              >
                {value === 'male' ? '男' : '女'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">生日</span>
          <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} className="text-right text-sm text-text-primary outline-none" />
        </div>

        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">学校</span>
          <input value={school} onChange={(event) => setSchool(event.target.value)} className="text-right text-sm outline-none" placeholder="请输入学校" />
        </div>

        <div className="flex items-center justify-between border-b border-divider py-4">
          <span className="text-sm text-text-secondary">年级</span>
          <input value={grade} onChange={(event) => setGrade(event.target.value)} className="text-right text-sm outline-none" placeholder="请输入年级" />
        </div>

        {error && <p className="pt-4 text-center text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
