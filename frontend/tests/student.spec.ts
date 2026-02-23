import { test, expect } from '@playwright/test';

const STUDENT_PHONE = '13700000000';
const STUDENT_PASSWORD = 'test123456';

test.describe('H5学生端登录注册', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('账号密码登录成功', async ({ page }) => {
    await page.getByPlaceholder('请输入手机号').fill(STUDENT_PHONE);
    await page.getByPlaceholder('请输入密码').fill(STUDENT_PASSWORD);
    await page.getByText('登 录').click();
    
    await expect(page.getByText('书法成长树')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('当前积分')).toBeVisible();
  });

  test('登录失败显示错误', async ({ page }) => {
    await page.getByPlaceholder('请输入手机号').fill(STUDENT_PHONE);
    await page.getByPlaceholder('请输入密码').fill('wrongpassword');
    await page.getByText('登 录').click();
    
    await expect(page.getByText('手机号或密码错误')).toBeVisible({ timeout: 10000 });
  });

  test('注册新账号', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    
    await page.getByPlaceholder('请输入手机号').fill('13912345678');
    await page.getByPlaceholder('验证码').fill('888888');
    await page.getByPlaceholder('请设置密码（6-16位）').fill('test123456');
    await page.getByPlaceholder('请再次输入密码').fill('test123456');
    await page.getByPlaceholder('给自己起个昵称吧').fill('新用户');
    
    const checkbox = page.locator('.rounded\\[\\1\\.5px\\]').first();
    await checkbox.click();
    
    await page.getByText('注  册').click();
    
    await expect(page.getByText('书法成长树')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('H5学生端功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByPlaceholder('请输入手机号').fill(STUDENT_PHONE);
    await page.getByPlaceholder('请输入密码').fill(STUDENT_PASSWORD);
    await page.getByText('登 录').click();
    await page.waitForTimeout(3000);
  });

  test('查看成长树页面', async ({ page }) => {
    await expect(page.getByText('当前积分')).toBeVisible();
    await expect(page.getByText('成长阶段')).toBeVisible();
    await expect(page.getByText('4587')).toBeVisible();
  });

  test('查看积分记录', async ({ page }) => {
    await page.getByText('查看明细 →').click();
    await expect(page.getByText('积分记录')).toBeVisible({ timeout: 5000 });
  });

  test('查看个人中心', async ({ page }) => {
    await page.getByText('我的').click();
    await expect(page.getByText('测试学生')).toBeVisible();
    await expect(page.getByText('****0000')).toBeVisible();
  });

  test('退出登录', async ({ page }) => {
    await page.getByText('我的').click();
    await page.getByText('退出登录').click();
    
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible({ timeout: 5000 });
  });
});
