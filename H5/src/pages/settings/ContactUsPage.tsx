import { MessageCircle, Phone } from 'lucide-react';

import { NavBar } from '@/components/layout/NavBar';

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
              <p className="text-sm font-semibold">联系电话</p>
              <p className="text-xs text-text-tertiary">15867788239</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">微信号</p>
              <p className="text-xs text-text-tertiary">15867788239</p>
            </div>
          </div>
        </div>

        <div className="rounded-card bg-primary-lighter p-5 text-xs leading-6 text-text-secondary">
          <p className="font-semibold text-text-primary">龙湾校区</p>
          <p>温州市龙湾区蒲州街道达得利商场2楼清韵书院</p>
          <p>程老师 15057735099</p>
          <p className="mt-3 font-semibold text-text-primary">南浦校区</p>
          <p>温州市南浦路264号新绘象清韵书院</p>
          <p>张老师 15088982679</p>
        </div>

        <p className="text-center text-xs text-text-tertiary">客服时间：9:00-17:00（节假日休息）</p>
      </div>
    </div>
  );
}
