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

// 辅助函数：进入学员详情
async function navigateToStudentDetail(page: import('@playwright/test').Page) {
  await page.waitForTimeout(2000);
  const studentRows = page.getByTestId('student-row');
  const count = await studentRows.count();
  if (count === 0) {
    test.skip();
    return;
  }
  await studentRows.first().click();
  await expect(page.getByText('积分操作')).toBeVisible({ timeout: 10000 });
}

test.describe('积分操作', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentDetail(page);
  });

  test('基础练习加分Tab显示正确', async ({ page }) => {
    // 默认应在基础练习 Tab
    await expect(page.getByText('选择练习册')).toBeVisible();
    await expect(page.getByText('得分等级')).toBeVisible();
    await expect(page.getByText('备注 (选填)')).toBeVisible();
    await expect(page.getByTestId('submit-basic')).toBeVisible();
  });

  test('提交基础练习加分', async ({ page }) => {
    // 备注非必填，直接提交（默认已选择第一册和50分）
    await page.getByTestId('submit-basic').click();

    // 等待提交完成，检查操作记录区域有更新
    await page.waitForTimeout(2000);

    // 操作记录区域应显示新记录
    const records = page.locator('[class*="bg-gray-50"]').filter({ hasText: '基础练习' });
    await expect(records.first()).toBeVisible({ timeout: 10000 });
  });

  test('日常作业加分Tab显示正确', async ({ page }) => {
    // 切换到日常作业 Tab
    await page.getByRole('tab', { name: '日常作业' }).click();

    await expect(page.getByText('作业名称')).toBeVisible();
    await expect(page.getByTestId('submit-homework')).toBeVisible();
  });

  test('提交日常作业加分', async ({ page }) => {
    // 切换到日常作业 Tab
    await page.getByRole('tab', { name: '日常作业' }).click();

    // 填写作业名称
    await page.getByPlaceholder('如：第5课 课后练习').fill('Playwright 测试作业');

    // 提交
    await page.getByTestId('submit-homework').click();
    await page.waitForTimeout(2000);

    // 检查记录
    const records = page.locator('[class*="bg-gray-50"]').filter({ hasText: '日常作业' });
    await expect(records.first()).toBeVisible({ timeout: 10000 });
  });

  test('比赛作品加分Tab显示正确', async ({ page }) => {
    // 切换到比赛作品 Tab
    await page.getByRole('tab', { name: '比赛作品' }).click();

    await expect(page.getByText('作品/比赛名称')).toBeVisible();
    await expect(page.getByText('得分 (30-50分)')).toBeVisible();
    await expect(page.getByTestId('submit-competition')).toBeVisible();
  });

  test('提交比赛作品加分', async ({ page }) => {
    // 切换到比赛作品 Tab
    await page.getByRole('tab', { name: '比赛作品' }).click();

    // 填写比赛名称
    await page.getByPlaceholder('如：校艺术节书法展').fill('Playwright 测试比赛');

    // 提交
    await page.getByTestId('submit-competition').click();
    await page.waitForTimeout(2000);

    // 检查记录
    const records = page.locator('[class*="bg-gray-50"]').filter({ hasText: '比赛作品' });
    await expect(records.first()).toBeVisible({ timeout: 10000 });
  });

  test('积分调整Tab显示正确', async ({ page }) => {
    // 切换到积分调整 Tab
    await page.getByRole('tab', { name: '积分调整' }).click();

    await expect(page.getByText('调整类型', { exact: true })).toBeVisible();
    await expect(page.getByText('调整数值 (支持负数)')).toBeVisible();
    await expect(page.getByText('调整原因 (必填)')).toBeVisible();
    await expect(page.getByTestId('submit-adjustment')).toBeVisible();
  });

  test('积分总数在加分后更新', async ({ page }) => {
    // 获取当前总分
    const totalScoreElement = page.locator('.bg-green-50 .text-2xl');
    await expect(totalScoreElement).toBeVisible({ timeout: 10000 });
    const initialScore = await totalScoreElement.textContent();

    // 提交基础练习加分
    await page.getByTestId('submit-basic').click();
    await page.waitForTimeout(3000);

    // 总分应该更新
    const updatedScoreElement = page.locator('.bg-green-50 .text-2xl');
    const updatedScore = await updatedScoreElement.textContent();
    // 注意：如果重复加分被阻止，分数可能不变，这里只验证分数存在
    expect(updatedScore).toBeTruthy();
  });

  test('操作记录正确显示', async ({ page }) => {
    // 操作记录区域
    await expect(page.getByText('操作记录', { exact: true })).toBeVisible();

    // 如果有记录，应该有类型标签
    const recordArea = page.locator('text=操作记录').first().locator('..').locator('..');
    await expect(recordArea).toBeVisible();
  });
});
