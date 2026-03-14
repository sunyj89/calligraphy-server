import { MessageCircle, Phone } from 'lucide-react'

import { NavBar } from '@/components/layout/NavBar'
import { CONTACT_CHANNELS } from '@/lib/constants'

export function ContactUsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white">
      <NavBar title="联系我们" />
      <div className="flex flex-col gap-5 px-5 py-6">
        <div className="rounded-card bg-primary-lighter p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <Phone size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">联系电话</p>
              <p className="text-xs text-text-tertiary">{CONTACT_CHANNELS.servicePhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">微信号</p>
              <p className="text-xs text-text-tertiary">{CONTACT_CHANNELS.wechat}</p>
            </div>
          </div>
        </div>

        <div className="rounded-card bg-primary-lighter p-5 text-xs leading-6 text-text-secondary">
          {CONTACT_CHANNELS.campuses.map((campus) => (
            <div key={campus.name} className="mb-3 last:mb-0">
              <p className="font-semibold text-text-primary">{campus.name}</p>
              <p>{campus.address}</p>
              <p>{campus.contact}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-tertiary">{CONTACT_CHANNELS.serviceHours}</p>
      </div>
    </div>
  )
}
