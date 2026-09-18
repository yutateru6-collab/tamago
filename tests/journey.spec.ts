import { test, expect } from '@playwright/test';
import { beginQuiet, completeQuiet, initialWorld, startCraft } from '../src/domain/engine';
import { describeQuietProgress } from '../src/domain/progress';
import type { World } from '../src/domain/model';

const start = Date.UTC(2026, 8, 19);
const rest = (world: World, at = start) => completeQuiet(beginQuiet(world, at), at + 1800000);

test('rest report describes actual progress without changing rules or mutating input', () => {
  const before = startCraft(initialWorld(start), 'shelf');
  const snapshot = structuredClone(before);
  const after = rest(before);
  expect(before).toEqual(snapshot);
  expect(after.vitality).toBe(64);
  expect(after.habitat).toBe(56);
  expect(after.crafting?.minutes).toBe(30);
  expect(after.inventory).toEqual(before.inventory);
  expect(after.memories[0].detail).toContain('宝物の小さな棚：0 → 30 / 60分（50%）');
  expect(after.memories[0].detail).toContain('この子の元気：55 → 64 / 100');
  const completed = rest(after, start + 1800000);
  expect(completed.memories[0].detail).toContain('宝物の小さな棚：完成');
  expect(completed.built).toEqual(['shelf']);
  expect(() => completeQuiet(completed, start + 3600000)).toThrow();
  const copy = structuredClone(after);
  describeQuietProgress(before, after);
  expect(after).toEqual(copy);
});

test('rest report distinguishes recovery, repair and exploration with real material gains', () => {
  const tired = {...startCraft(initialWorld(start), 'shelf'), vitality: 10};
  const recovered = rest(tired);
  expect(recovered.crafting?.minutes).toBe(0);
  expect(recovered.memories[0].detail).toContain('今回は元気の回復');
  expect(recovered.memories[0].detail).not.toContain('50%');
  const damaged = {...startCraft(initialWorld(start), 'shelf'), homeCare: {wear: 22.5, day:'2026-09-19', dailyWear:25}};
  const repaired = rest(damaged);
  expect(repaired.homeCare?.wear).toBe(0);
  expect(repaired.homeCare?.dailyWear).toBe(25);
  expect(repaired.crafting?.minutes).toBe(0);
  expect(repaired.inventory).toEqual(damaged.inventory);
  expect(repaired.memories[0].detail).toContain('修繕完了');
  const explored = rest({...initialWorld(start), expeditionMinutes:30});
  expect(explored.memories[0].detail).toContain('木のかけら +2・ガラス玉 +1');
  expect(explored.expeditionMinutes).toBe(0);
});

test('journey: choose furniture, resume from habitat, see saved fifty percent after rest and reload', async ({page}, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.clock.setFixedTime(new Date(start));
  await page.goto('/');
  await page.getByRole('button',{name:'集めた木で、小さな棚をつくろう'}).click();
  await expect(page.locator('[data-recipe="shelf"]')).toContainText('そろった');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:`test-results/visual/${testInfo.project.name}-journey-390-furniture.png`});
  await page.getByRole('button',{name:'これをつくろう',exact:true}).click();
  await expect(page.getByRole('button',{name:'ホーム',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('complementary',{name:'この子の暮らし'})).toHaveAttribute('data-activity','craft');
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await expect(page.locator('[data-recipe="shelf"]')).toContainText('確保済み');
  await page.getByRole('button',{name:'制作のために、30分休む'}).click();
  await expect(page.getByRole('timer',{name:'お約束の残り時間'})).toContainText('30:00');
  await page.clock.setFixedTime(new Date(start+1800000));
  await page.getByRole('button',{name:'30分、スマホを休めた'}).click();
  const report = page.getByRole('dialog',{name:'おかえり',exact:true});
  await expect(report).toContainText('宝物の小さな棚：0 → 30 / 60分（50%）');
  await expect(report).toContainText('この子の元気：55 → 64 / 100');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:`test-results/visual/${testInfo.project.name}-journey-390-return.png`});
  const saved = await page.evaluate(() => localStorage.getItem('tamago.world.v1'));
  await page.reload();
  await expect(report).toContainText('宝物の小さな棚：0 → 30 / 60分（50%）');
  expect(await page.evaluate(() => localStorage.getItem('tamago.world.v1'))).toBe(saved);
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await expect(page.locator('.home-scene-note')).toContainText('50%');
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await expect(page.getByRole('progressbar',{name:'宝物の小さな棚の制作進捗'})).toHaveAttribute('value','30');
  await page.screenshot({path:`test-results/visual/${testInfo.project.name}-journey-390-halfway.png`});
  await page.getByRole('button',{name:'記録',exact:true}).click();
  await expect(page.locator('.memory').first()).toContainText('宝物の小さな棚：0 → 30 / 60分（50%）');
});

test('missing materials leads to exploration and selected destination starts a voluntary rest', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await expect(page.locator('[data-recipe="hammock"]')).toContainText('布きれ 0 / 2 · あと2');
  await page.locator('[data-recipe="hammock"]').getByRole('button',{name:'足りない材料を探しにいく'}).click();
  await expect(page.getByRole('heading',{name:'探索',exact:true})).toBeVisible();
  await expect(page.getByLabel('古い工房で見つかる材料')).toContainText('布きれ × 2');
  await page.getByRole('button',{name:'次の行き先にする',exact:true}).click();
  await expect(page.getByRole('button',{name:'ホーム',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'探索',exact:true}).click();
  await page.getByRole('button',{name:'この行き先で、30分のお約束へ'}).click();
  await expect(page.getByRole('timer',{name:'お約束の残り時間'})).toBeVisible();
  await page.getByRole('button',{name:'途中でやめる（罰はありません）'}).click();
  await page.getByRole('button',{name:'今回はおしまいにする'}).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tamago.world.v1')!));
  expect(saved.destination).toBe('workshop');
  expect(saved.vitality).toBe(55);
  expect(saved.inventory).toEqual({wood:2,cloth:0,glass:0,seed:0});
});

test('320px and 430px journey cards fit and expose the real next action', async ({page}, testInfo) => {
  for (const width of [320,430]) {
    await page.setViewportSize({width,height:width === 320 ? 568 : 844});
    await page.goto('/');
    await page.getByRole('button',{name:'集めた木で、小さな棚をつくろう'}).scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:`test-results/visual/${testInfo.project.name}-journey-${width}-guide.png`});
    expect(await page.locator('.first-project').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button',{name:'集めた木で、小さな棚をつくろう'}).click();
    await page.locator('[data-recipe="shelf"]').scrollIntoViewIfNeeded();
    expect(await page.locator('[data-recipe="shelf"]').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({path:`test-results/visual/${testInfo.project.name}-journey-${width}-furniture.png`});
    await page.locator('[data-recipe="garden"]').getByRole('button',{name:'足りない材料を探しにいく'}).click();
    await expect(page.getByRole('heading',{name:'探索',exact:true})).toBeVisible();
  }
});

test('failed save stays on furniture screen and does not consume materials or navigate', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage test failure', 'QuotaExceededError'); }; });
  await page.getByRole('button',{name:'これをつくろう',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button',{name:'住処',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('[data-recipe="shelf"]')).toContainText('木のかけら 2 / 2');
  await expect(page.getByRole('button',{name:'これをつくろう',exact:true})).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('tamago.world.v1'))).toBeNull();
});
