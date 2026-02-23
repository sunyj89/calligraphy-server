import { NavBar } from '@/components/layout/NavBar'

export function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="隐私政策" />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-base font-bold mb-3">书法成长树隐私政策</h2>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">
          <p>我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。</p>

          <h3 className="font-semibold text-text-primary pt-2">一、我们收集的信息</h3>
          <p>1. 注册信息：手机号码、昵称、密码。</p>
          <p>2. 个人资料：头像、性别、生日、学校、年级（选填）。</p>
          <p>3. 学习数据：练习记录、作品图片、积分数据、教师评价。</p>
          <p>4. 设备信息：设备型号、操作系统版本、浏览器类型。</p>

          <h3 className="font-semibold text-text-primary pt-2">二、信息的使用</h3>
          <p>1. 提供、维护和改进我们的服务。</p>
          <p>2. 记录和展示您的学习成长过程。</p>
          <p>3. 向您发送服务通知和学习提醒。</p>
          <p>4. 进行数据分析以改善用户体验。</p>

          <h3 className="font-semibold text-text-primary pt-2">三、信息的存储</h3>
          <p>1. 您的个人信息存储在中国境内的安全服务器上。</p>
          <p>2. 我们采用行业标准的安全技术措施保护您的信息。</p>
          <p>3. 我们会在实现服务目的所必需的期限内保留您的信息。</p>

          <h3 className="font-semibold text-text-primary pt-2">四、信息的共享</h3>
          <p>1. 未经您的同意，我们不会向第三方共享您的个人信息。</p>
          <p>2. 教师可以查看其所管理学生的学习数据和作品。</p>
          <p>3. 在法律法规要求的情况下，我们可能会披露您的信息。</p>

          <h3 className="font-semibold text-text-primary pt-2">五、您的权利</h3>
          <p>1. 您有权访问、更正和删除您的个人信息。</p>
          <p>2. 您有权注销您的账号。</p>
          <p>3. 您有权撤回您的授权同意。</p>

          <h3 className="font-semibold text-text-primary pt-2">六、未成年人保护</h3>
          <p>我们非常重视对未成年人个人信息的保护。若您是未满14周岁的未成年人，请在监护人的陪同下阅读本政策，并在取得监护人同意后使用我们的服务。</p>

          <h3 className="font-semibold text-text-primary pt-2">七、政策更新</h3>
          <p>我们可能会不时更新本隐私政策。更新后的政策将在平台上发布，建议您定期查阅。</p>

          <p className="pt-4 text-text-tertiary text-xs">最后更新日期：2025年1月1日</p>
        </div>
      </div>
    </div>
  )
}
