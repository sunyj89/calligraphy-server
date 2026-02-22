import { useState } from 'react';
import { GraduationCap, Users, Shield, BookOpen, BarChart3, Trophy, Library, LogOut, Loader2, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StudentManagement } from '@/sections/teacher/StudentManagement';
import { StudentDetail } from '@/sections/teacher/StudentDetail';
import { TeacherManagement } from '@/sections/admin/TeacherManagement';
import { ClassroomManagement } from '@/sections/admin/ClassroomManagement';
import { BookManagement } from '@/sections/admin/BookManagement';
import { AuditLog } from '@/sections/admin/AuditLog';
import { Dashboard } from '@/sections/dashboard/Dashboard';
import { Leaderboard } from '@/sections/dashboard/Leaderboard';
import { Profile } from '@/sections/settings/Profile';
import { Login } from '@/sections/auth/Login';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import type { Student } from '@/types';

type NavPage = 'dashboard' | 'students' | 'classrooms' | 'leaderboard' | 'books' | 'teachers' | 'audit-logs' | 'profile';
type StudentSubPage = 'list' | 'detail';

function AppContent() {
  const { teacher, isAuthenticated, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [studentSubPage, setStudentSubPage] = useState<StudentSubPage>('list');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const isAdmin = teacher?.role === 'admin';

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSubPage('detail');
  };

  const handleBackToList = () => {
    setStudentSubPage('list');
    setSelectedStudent(null);
  };

  const handleStudentUpdated = (updated: Student) => {
    setSelectedStudent(updated);
  };

  const handleNavChange = (page: NavPage) => {
    setCurrentPage(page);
    if (page === 'students') {
      setStudentSubPage('list');
      setSelectedStudent(null);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return studentSubPage === 'list' ? (
          <StudentManagement onSelectStudent={handleSelectStudent} />
        ) : selectedStudent ? (
          <StudentDetail student={selectedStudent} onBack={handleBackToList} onStudentUpdated={handleStudentUpdated} />
        ) : null;
      case 'classrooms':
        return <ClassroomManagement />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'books':
        return isAdmin ? <BookManagement /> : null;
      case 'teachers':
        return isAdmin ? <TeacherManagement /> : null;
      case 'audit-logs':
        return isAdmin ? <AuditLog /> : null;
      case 'profile':
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">书法成长树</h1>
                <p className="text-xs text-gray-500">Calligraphy Growth Tree</p>
              </div>
            </div>

            {/* 导航标签 */}
            <nav className="flex items-center gap-1">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavChange('dashboard')}
                className={currentPage === 'dashboard' ? 'bg-green-600 hover:bg-green-700' : ''}
                data-testid="nav-dashboard"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                仪表盘
              </Button>
              <Button
                variant={currentPage === 'students' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavChange('students')}
                className={currentPage === 'students' ? 'bg-green-600 hover:bg-green-700' : ''}
                data-testid="nav-students"
              >
                <Users className="w-4 h-4 mr-1.5" />
                学员管理
              </Button>
              <Button
                variant={currentPage === 'classrooms' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavChange('classrooms')}
                className={currentPage === 'classrooms' ? 'bg-green-600 hover:bg-green-700' : ''}
                data-testid="nav-classrooms"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                班级管理
              </Button>
              <Button
                variant={currentPage === 'leaderboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavChange('leaderboard')}
                className={currentPage === 'leaderboard' ? 'bg-green-600 hover:bg-green-700' : ''}
                data-testid="nav-leaderboard"
              >
                <Trophy className="w-4 h-4 mr-1.5" />
                排行榜
              </Button>
              {isAdmin && (
                <Button
                  variant={currentPage === 'books' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavChange('books')}
                  className={currentPage === 'books' ? 'bg-green-600 hover:bg-green-700' : ''}
                  data-testid="nav-books"
                >
                  <Library className="w-4 h-4 mr-1.5" />
                  练习册
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant={currentPage === 'teachers' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavChange('teachers')}
                  className={currentPage === 'teachers' ? 'bg-green-600 hover:bg-green-700' : ''}
                  data-testid="nav-teachers"
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  教师管理
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant={currentPage === 'audit-logs' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavChange('audit-logs')}
                  className={currentPage === 'audit-logs' ? 'bg-green-600 hover:bg-green-700' : ''}
                  data-testid="nav-audit-logs"
                >
                  <ScrollText className="w-4 h-4 mr-1.5" />
                  日志
                </Button>
              )}
            </nav>

            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavChange('profile')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={teacher?.avatar || ''} />
                  <AvatarFallback>{teacher?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{teacher?.name}</p>
                  <p className="text-xs text-gray-500">{isAdmin ? '管理员' : '教师'}</p>
                </div>
              </button>
              <Button variant="ghost" size="icon" className="text-gray-400" onClick={logout} data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-in fade-in duration-300">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
