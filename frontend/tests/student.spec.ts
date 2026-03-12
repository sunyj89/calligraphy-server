import { expect, test } from '@playwright/test';

const H5_BASE = 'http://localhost:4173/h5/';
const STUDENT_PHONE = '13700000000';
const STUDENT_PASSWORD = 'test123456';

async function gotoLogin(page: import('@playwright/test').Page) {
  await page.goto(H5_BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(H5_BASE);
  await page.getByRole('button', { name: '立即登录' }).click();
}

async function agreeAndLogin(page: import('@playwright/test').Page, password = STUDENT_PASSWORD) {
  await gotoLogin(page);
  await page.getByPlaceholder('请输入手机号').fill(STUDENT_PHONE);
  await page.getByPlaceholder('请输入密码').fill(password);
  await page.locator('.cursor-pointer').first().click();
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.getByText('当前积分')).toBeVisible({ timeout: 15000 });
}

test.describe.serial('H5学生端', () => {
  test('账号密码登录成功', async ({ page }) => {
    await agreeAndLogin(page);
    await expect(page.getByText('书法成长树').first()).toBeVisible();
    await expect(page.getByText('成长阶段')).toBeVisible();
  });

  test('错误密码会显示登录失败', async ({ page }) => {
    await gotoLogin(page);
    await page.getByPlaceholder('请输入手机号').fill(STUDENT_PHONE);
    await page.getByPlaceholder('请输入密码').fill('wrongpassword');
    await page.locator('.cursor-pointer').first().click();
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.locator('.text-red-500').first()).toBeVisible({ timeout: 10000 });
  });

  test('可以查看成长明细', async ({ page }) => {
    await agreeAndLogin(page);
    await page.getByText('查看明细').click();
    await expect(page.getByText('成长明细')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('总计')).toBeVisible();
  });

  test('可以查看作品详情', async ({ page }) => {
    await agreeAndLogin(page);
    await page.getByRole('button', { name: '书架' }).click();
    await page.getByRole('button', { name: '我的作品' }).click();
    const cards = page.locator('[data-testid="h5-work-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    await cards.first().click();
    await expect(page.locator('[data-testid="h5-work-detail"]')).toBeVisible({ timeout: 10000 });
  });

  test('可以修改个人资料', async ({ page }) => {
    await agreeAndLogin(page);
    await page.getByRole('button', { name: '我的' }).click();
    await page.getByText('修改个人信息').click();

    const school = `示范学校${Date.now()}`;
    const grade = '三年级';

    await page.getByPlaceholder('请输入学校').fill(school);
    await page.getByPlaceholder('请输入年级').fill(grade);
    await page.getByRole('button', { name: '保存' }).click();

    await page.getByText('修改个人信息').click();
    await expect(page.getByPlaceholder('请输入学校')).toHaveValue(school);
    await expect(page.getByPlaceholder('请输入年级')).toHaveValue(grade);
  });

  test('可以退出登录', async ({ page }) => {
    await agreeAndLogin(page);
    await page.getByRole('button', { name: '我的' }).click();
    await page.getByText('退出登录').click();
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible({ timeout: 10000 });
  });

  test('可以修改密码并使用新密码重新登录', async ({ page }) => {
    const nextPassword = 'student654';

    await agreeAndLogin(page);
    await page.getByRole('button', { name: '我的' }).click();
    await page.getByText('修改登录密码').click();
    await page.getByPlaceholder('请输入原密码').fill(STUDENT_PASSWORD);
    await page.getByPlaceholder('请输入新密码（至少6位）').fill(nextPassword);
    await page.getByPlaceholder('请再次输入新密码').fill(nextPassword);
    await page.getByRole('button', { name: '确认修改' }).click();

    await page.getByText('退出登录').click();
    await agreeAndLogin(page, nextPassword);
  });
});
