import { NavBar } from '@/components/layout/NavBar'
import { Phone, Mail, MessageCircle } from 'lucide-react'

export function ContactUsPage() {
  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="联系我们" />
      <div className="px-5 py-6 flex flex-col gap-5">
        <div className="bg-primary-lighter rounded-card p-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <Phone size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">客服电话</p>
              <p className="text-xs text-text-tertiary mt-0.5">400-888-8888</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <Mail size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">客服邮箱</p>
              <p className="text-xs text-text-tertiary mt-0.5">service@shufa-tree.com</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">微信公众号</p>
              <p className="text-xs text-text-tertiary mt-0.5">书法成长树</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-text-tertiary text-center">服务时间：工作日 9:00 - 18:00</p>
      </div>
    </div>
  )
}
