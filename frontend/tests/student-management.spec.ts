import { test, expect } from '@playwright/test';

const PHONE = '13900000000';
const PASSWORD = 'admin123';

// 辅助函数：登录
async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('login-phone').fill(PHONE);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('nav-students')).toBeVisible({ timeout: 15000 });
  // 导航到学员管理页面
  await page.getByTestId('nav-students').click();
}

test.describe('学员管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('学员列表正确加载', async ({ page }) => {
    // 等待学员列表区域出现
    await expect(page.getByText('学员列表')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByTestId('add-student-btn')).toBeVisible();
  });

  test('统计卡片显示正确', async ({ page }) => {
    await expect(page.getByText('总学员数')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('资深学员')).toBeVisible();
  });

  test('搜索功能正常工作', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible({ timeout: 10000 });

    // 输入搜索关键词
    await page.getByTestId('search-input').fill('不存在的学员名');

    // 等待搜索结果（防抖 300ms + API 请求时间）
    await page.waitForTimeout(1000);

    // 搜索不到结果时应显示空状态
    const hasResults = await page.getByTestId('student-row').count();
    if (hasResults === 0) {
      await expect(page.getByText('暂无学员数据')).toBeVisible();
    }

    // 清空搜索恢复列表
    await page.getByTestId('search-input').fill('');
    await page.waitForTimeout(1000);
  });

  test('创建学员流程', async ({ page }) => {
    await expect(page.getByTestId('add-student-btn')).toBeVisible({ timeout: 10000 });

    // 打开添加学员对话框
    await page.getByTestId('add-student-btn').click();
    await expect(page.getByText('添加新学员')).toBeVisible();

    // 填写必填字段
    const uniqueName = `测试学员_${Date.now()}`;
    const uniquePhone = `138${String(Date.now()).slice(-8)}`;
    const password = 'student123';

    await page.getByTestId('new-student-name').fill(uniqueName);
    await page.getByTestId('new-student-phone').fill(uniquePhone);
    await page.getByTestId('new-student-password').fill(password);

    // 确认按钮应该可用
    await expect(page.getByTestId('confirm-add-student')).toBeEnabled();

    // 提交
    await page.getByTestId('confirm-add-student').click();

    // 对话框应关闭，列表中应出现新学员
    await expect(page.getByText('添加新学员')).not.toBeVisible({ timeout: 10000 });

    // 等待学员列表刷新
    await page.waitForTimeout(1000);
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
  });

  test('点击学员进入详情页', async ({ page }) => {
    // 等待学员列表加载
    await page.waitForTimeout(2000);

    const studentRows = page.getByTestId('student-row');
    const count = await studentRows.count();

    if (count > 0) {
      // 点击第一个学员
      await studentRows.first().click();

      // 应该进入学员详情页
      await expect(page.getByText('返回学员列表')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('积分操作')).toBeVisible();
      await expect(page.getByText('操作记录', { exact: true })).toBeVisible();
    }
  });
});
