import { NavBar } from '@/components/layout/NavBar'

export function UserAgreementPage() {
  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="用户协议" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-base font-bold mb-3">书法成长树用户服务协议</h2>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">
          <p>欢迎使用"书法成长树"（以下简称"本平台"）。请您在使用本平台前仔细阅读本协议。</p>

          <h3 className="font-semibold text-text-primary pt-2">一、服务说明</h3>
          <p>本平台是一款面向书法学习者的成长记录与管理工具，为用户提供练习记录、作品展示、积分管理、成长树培育等服务功能。</p>

          <h3 className="font-semibold text-text-primary pt-2">二、用户注册</h3>
          <p>1. 用户须使用真实手机号进行注册，并对所提供信息的真实性负责。</p>
          <p>2. 用户应妥善保管账号和密码，因账号密码泄露造成的损失由用户自行承担。</p>
          <p>3. 未满14周岁的用户需在监护人同意下使用本平台。</p>

          <h3 className="font-semibold text-text-primary pt-2">三、用户行为规范</h3>
          <p>1. 用户在使用本平台时，应遵守相关法律法规和社会公共道德。</p>
          <p>2. 用户不得利用本平台从事任何违法、违规行为。</p>
          <p>3. 用户上传的作品内容应为本人原创或已获得合法授权。</p>

          <h3 className="font-semibold text-text-primary pt-2">四、知识产权</h3>
          <p>1. 本平台的所有内容（包括但不限于文字、图片、标识、界面设计等）的知识产权归平台所有。</p>
          <p>2. 用户上传的作品，其著作权归用户本人所有，但用户同意授予平台在服务范围内的使用权。</p>

          <h3 className="font-semibold text-text-primary pt-2">五、免责声明</h3>
          <p>1. 因网络状况、通讯线路等非本平台控制因素导致的服务中断，本平台不承担责任。</p>
          <p>2. 本平台有权根据运营需要修改服务内容，修改后的内容以平台公告为准。</p>

          <h3 className="font-semibold text-text-primary pt-2">六、协议修改</h3>
          <p>本平台有权对本协议进行修改，修改后的协议将在平台上公布，用户继续使用本平台即视为接受修改后的协议。</p>

          <p className="pt-4 text-text-tertiary text-xs">最后更新日期：2025年1月1日</p>
        </div>
      </div>
    </div>
  )
}
