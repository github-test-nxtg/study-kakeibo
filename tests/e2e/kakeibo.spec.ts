import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_URL = pathToFileURL(path.resolve('dist/index.html')).href;
// 日付を固定して、サンプルデータと「今月」を毎回同じにする
const FIXED_NOW = new Date('2026-11-16T10:00:00+09:00');

async function openApp(page: Page) {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(APP_URL);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('11月');
}

/** 月の収支欄の金額を数値で読む */
async function summaryAmount(page: Page, label: '収入' | '支出' | '収支'): Promise<number> {
  const row = page.locator('.summary__row', { has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) });
  const text = await row.locator('dd').innerText();
  const n = Number(text.replace(/[^\d]/g, ''));
  return text.includes('−') ? -n : n;
}

async function addRecord(
  page: Page,
  opts: { amount: string; category: string; memo: string; type?: '支出' | '収入' },
) {
  await page.getByRole('button', { name: '記入する' }).click();
  const dialog = page.getByRole('dialog');
  if (opts.type === '収入') await dialog.getByRole('radio', { name: '収入' }).click();
  await dialog.getByLabel('金額').fill(opts.amount);
  await dialog.getByRole('button', { name: opts.category }).click();
  await dialog.getByLabel('メモ').fill(opts.memo);
  await dialog.getByRole('button', { name: '記入する' }).click();
  await expect(dialog).toBeHidden();
}

const entry = (page: Page, memo: string) => page.getByRole('button', { name: new RegExp(`${memo} を編集`) });

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('初回起動時にサンプルデータが表示される', async ({ page }) => {
  await expect(page.locator('.entry').first()).toBeVisible();
  expect(await summaryAmount(page, '収入')).toBeGreaterThan(0);
  expect(await summaryAmount(page, '支出')).toBeGreaterThan(0);
});

test('支出を登録すると明細と集計に反映される', async ({ page }) => {
  const before = await summaryAmount(page, '支出');
  await addRecord(page, { amount: '１，５００', category: '交通', memo: 'E2E支出' });

  await expect(entry(page, 'E2E支出')).toBeVisible();
  await expect(entry(page, 'E2E支出')).toHaveAccessibleName(/1,500/);
  await expect(page.getByText('交通を記入しました')).toBeVisible();
  await expect.poll(() => summaryAmount(page, '支出')).toBe(before + 1500);
});

test('収入を登録すると収入の合計が増える', async ({ page }) => {
  const before = await summaryAmount(page, '収入');
  await addRecord(page, { type: '収入', amount: '50000', category: '副業', memo: 'E2E収入' });
  await expect(entry(page, 'E2E収入')).toBeVisible();
  await expect.poll(() => summaryAmount(page, '収入')).toBe(before + 50000);
});

test('記録を編集できる', async ({ page }) => {
  await addRecord(page, { amount: '1000', category: '食費', memo: 'E2E編集' });
  await entry(page, 'E2E編集').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText('記録を編集');
  await dialog.getByLabel('金額').fill('2000');
  await dialog.getByRole('button', { name: '変更を保存' }).click();
  await expect(entry(page, 'E2E編集')).toHaveAccessibleName(/2,000/);
});

test('削除した記録を元に戻せる', async ({ page }) => {
  await addRecord(page, { amount: '800', category: '食費', memo: 'E2E削除' });
  await entry(page, 'E2E削除').click();
  await page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
  await expect(entry(page, 'E2E削除')).toHaveCount(0);

  await page.getByRole('button', { name: '元に戻す' }).click();
  await expect(entry(page, 'E2E削除')).toBeVisible();
});

test('金額が空のままでは保存できない', async ({ page }) => {
  await page.getByRole('button', { name: '記入する' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '記入する' }).click();
  await expect(dialog.getByText('1円以上の整数で入力してください')).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('キーワードで検索できる', async ({ page }) => {
  await page.getByPlaceholder(/検索/).fill('スーパー');
  const entries = page.locator('.entry');
  await expect(entries.first()).toBeVisible();
  for (const name of await entries.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''))) {
    expect(name).toContain('スーパー');
  }

  await page.getByPlaceholder(/検索/).fill('該当しないキーワード');
  await expect(page.getByText(/一致する記録はありません/)).toBeVisible();
});

test('再読み込みしてもデータが残る', async ({ page }) => {
  await addRecord(page, { amount: '1234', category: '日用品', memo: 'E2E保存' });
  await page.reload();
  await expect(entry(page, 'E2E保存')).toBeVisible();
});

test('ダークモードに切り替えられ、設定が保存される', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /表示テーマ/ });
  await toggle.click(); // システム → ライト
  await toggle.click(); // ライト → ダーク
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('N キーで入力画面が開き、Esc で閉じる', async ({ page }) => {
  await page.keyboard.press('n');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('前の月に移動すると表示が切り替わる', async ({ page }) => {
  await page.getByRole('button', { name: '前の月' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('10月');
  await expect(page.getByText('10月の明細')).toBeVisible();
});

test('並び順を何度切り替えても、明細が重複しない', async ({ page }) => {
  const names = () =>
    page.locator('.entry').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const initial = await names();
  const toggle = page.getByRole('button', { name: /順にする/ });

  for (let i = 0; i < 4; i++) {
    await toggle.click();
    const now = await names();
    expect(new Set(now).size).toBe(now.length); // 同じ行が二重に出ていない
    expect(now.length).toBe(initial.length);    // 件数が変わっていない
  }
  await expect(toggle).toHaveText('金額順にする');
  expect(await names()).toEqual(initial);       // 偶数回押したら元の並びに戻る
});