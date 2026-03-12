import { test, expect } from '@playwright/test';

const PHONE = '13900000000';
const PASSWORD = 'admin123';

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage 确保从未登录状态开始
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('未登录时显示登录页面', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-phone')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByText('书法成长树')).toBeVisible();
    await expect(page.getByText('教师管理平台')).toBeVisible();
  });

  test('输入错误凭据显示错误信息', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-phone').fill('13900000000');
    await page.getByTestId('login-password').fill('wrong_password');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 });
  });

  test('登录成功后跳转到主界面', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-phone').fill(PHONE);
    await page.getByTestId('login-password').fill(PASSWORD);
    await page.getByTestId('login-submit').click();

    // 登录成功后应该看到主界面元素
    await expect(page.getByTestId('nav-students')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  test('登录后刷新页面保持登录状态（token 持久化）', async ({ page }) => {
    // 先登录
    await page.goto('/');
    await page.getByTestId('login-phone').fill(PHONE);
    await page.getByTestId('login-password').fill(PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('nav-students')).toBeVisible({ timeout: 15000 });

    // 刷新页面
    await page.reload();

    // 应该仍然处于登录状态
    await expect(page.getByTestId('nav-students')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  test('点击登出按钮回到登录页面', async ({ page }) => {
    // 先登录
    await page.goto('/');
    await page.getByTestId('login-phone').fill(PHONE);
    await page.getByTestId('login-password').fill(PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('nav-students')).toBeVisible({ timeout: 15000 });

    // 登出
    await page.getByTestId('logout-btn').click();

    // 应该回到登录页面
    await expect(page.getByTestId('login-phone')).toBeVisible({ timeout: 10000 });
  });
});
