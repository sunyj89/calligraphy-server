import { createBrowserRouter } from 'react-router-dom'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { AuthGuard } from './AuthGuard'

import { WelcomePage } from '@/pages/auth/WelcomePage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

import { GrowthTreePage } from '@/pages/home/GrowthTreePage'
import { GrowthDetailPage } from '@/pages/records/GrowthDetailPage'
import { BookshelfPage } from '@/pages/bookshelf/BookshelfPage'
import { WorkDetailPage } from '@/pages/bookshelf/WorkDetailPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'

import { EditProfilePage } from '@/pages/settings/EditProfilePage'
import { PrivacySettingsPage } from '@/pages/settings/PrivacySettingsPage'
import { ChangePasswordPage } from '@/pages/settings/ChangePasswordPage'
import { ChangePhonePage } from '@/pages/settings/ChangePhonePage'
import { ContactUsPage } from '@/pages/settings/ContactUsPage'
import { UserAgreementPage } from '@/pages/settings/UserAgreementPage'
import { PrivacyPolicyPage } from '@/pages/settings/PrivacyPolicyPage'

export const router = createBrowserRouter([
  { path: '/', element: <WelcomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/agreement', element: <UserAgreementPage /> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },

  {
    element: <AuthGuard />,
    children: [
      {
        element: <MobileLayout />,
        children: [
          { path: '/home', element: <GrowthTreePage /> },
          { path: '/records', element: <GrowthDetailPage /> },
          { path: '/bookshelf', element: <BookshelfPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      { path: '/works/:workId', element: <WorkDetailPage /> },
      { path: '/settings/profile', element: <EditProfilePage /> },
      { path: '/settings/privacy', element: <PrivacySettingsPage /> },
      { path: '/settings/password', element: <ChangePasswordPage /> },
      { path: '/settings/phone', element: <ChangePhonePage /> },
      { path: '/settings/contact', element: <ContactUsPage /> },
    ],
  },
], { basename: '/h5/' })
