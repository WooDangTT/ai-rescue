import { test, expect } from '@playwright/test';
import { waitForHydration, isExternalError } from '../helpers/test-utils';

test.describe('홈 페이지 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page, 'hero');
  });

  test('홈 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 네비게이션 바 표시 확인
    await expect(page.getByTestId('navbar')).toBeVisible();
    await expect(page.getByTestId('navBrand')).toBeVisible();
    await expect(page.getByTestId('navBrand')).toContainText('AI RESCUE');

    // 히어로 섹션 표시 확인
    await expect(page.getByTestId('hero')).toBeVisible();

    // 히어로 배지 확인
    await expect(page.getByTestId('heroBadge')).toBeVisible();
    await expect(page.getByTestId('heroBadge')).toContainText('AI-Powered Code Analysis');

    // 히어로 타이틀 확인
    await expect(page.getByTestId('heroTitle')).toBeVisible();
    await expect(page.getByTestId('heroTitle')).toContainText('Long-Term Health');

    // 히어로 서브타이틀 확인
    await expect(page.getByTestId('heroSubtitle')).toBeVisible();

    // 푸터 확인
    await expect(page.getByTestId('footer')).toBeVisible();
    await expect(page.getByTestId('footer')).toContainText('AI RESCUE');
  });

  test('기능 섹션이 정상적으로 렌더링된다', async ({ page }) => {
    // 기능 섹션 및 4가지 분석 차원 확인
    await expect(page.getByTestId('featuresSection')).toBeVisible();
    await expect(page.getByTestId('featuresSection')).toContainText('4 Dimensions of Code Maturity');
    await expect(page.getByTestId('featuresSection')).toContainText('Scalability');
    await expect(page.getByTestId('featuresSection')).toContainText('Stability');
    await expect(page.getByTestId('featuresSection')).toContainText('Maintainability');
    await expect(page.getByTestId('featuresSection')).toContainText('Security');

    // How it works 섹션 확인
    await expect(page.getByTestId('howItWorksSection')).toBeVisible();
    await expect(page.getByTestId('howItWorksSection')).toContainText('Simple 3-Step Process');
  });

  test('페이지 타이틀이 올바르게 설정된다', async ({ page }) => {
    await expect(page).toHaveTitle(/AI RESCUE/);
  });

  test('비로그인 상태에서 Sign In with Google 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('heroCtaSignIn')).toBeVisible();
    await expect(page.getByTestId('heroCtaSignIn')).toContainText('Sign in with Google');
  });

  test('홈 페이지 콘솔 에러가 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isExternalError(msg.text())) {
        errors.push(msg.text());
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page, 'hero');
    expect(errors).toHaveLength(0);
  });
});
