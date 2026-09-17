import { test, expect } from '@playwright/test';
test('craft, return, persist, and deteriorate', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'こもれびの巣' })).toBeVisible();
  await expect(page.locator('.scene-art')).toHaveJSProperty('naturalWidth', 1086);
  await page.getByRole('button', { name: '住処', exact: true }).click();
  await page.getByRole('button', { name: 'これをつくろう', exact: true }).click();
  await page.getByRole('button', { name: 'ホーム', exact: true }).click();
  await page.getByRole('button', { name: '設定と試作モード' }).click();
  await page.getByRole('button', { name: '離れた時間を試す（2時間）', exact: true }).click();
  await page.getByRole('button', { name: '住処に戻る', exact: true }).click();
  await expect(page.getByRole('heading', { name: '宝物の小さな棚が、できていた。' })).toBeVisible();
  await page.getByRole('button', { name: '住処をのぞく' }).click();
  await expect(page.getByRole('dialog', { name: 'おかえり', exact: true })).toBeHidden();
  await page.reload();
  await page.getByRole('button', { name: '住処', exact: true }).click();
  await expect(page.getByRole('button', { name: 'できあがり', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'ホーム', exact: true }).click();
  await page.getByRole('button', { name: '設定と試作モード' }).click();
  await page.getByRole('button', { name: '使いすぎた状態を試す（2時間）', exact: true }).click();
  await page.getByRole('button', { name: '使いすぎた状態を試す（2時間）', exact: true }).click();
  await page.getByRole('button', { name: '住処に戻る', exact: true }).click();
  await expect(page.locator('.scene-art')).toHaveAttribute('src', '/art/weary.png');
  await expect(page.locator('.scene-art')).toHaveJSProperty('naturalWidth', 1086);
  await page.getByRole('button', { name: '記録', exact: true }).click();
  await expect(page.getByRole('heading', { name: '宝物の小さな棚が、できていた。' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('iPhone fullscreen, persisted promise, confirmation and no penalty on cancel', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByTestId('device-picker')).toBeHidden();
  const screen = await page.getByTestId('device-screen').boundingBox();
  expect(screen?.width).toBe(390);
  expect(screen?.height).toBe(844);
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await expect(page.getByRole('heading',{name:'あとは、スマホを置いて。'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'お約束のつづきを見る'}).click();
  await expect(page.getByRole('button',{name:'30分、スマホを休めた'})).toBeHidden();
  await page.clock.fastForward(30*60000);
  await page.getByRole('button',{name:'30分、スマホを休めた'}).click();
  await expect(page.getByRole('heading',{name:'30分、そっと見守ってくれた。'})).toBeVisible();
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await expect(page.getByRole('meter',{name:'この子の元気'})).toHaveAttribute('value','64');
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await page.getByRole('button',{name:'途中でやめる（罰はありません）'}).click();
  await page.getByRole('button',{name:'今回はおしまいにする'}).click();
  await expect(page.getByRole('meter',{name:'この子の元気'})).toHaveAttribute('value','64');
  await page.screenshot({path:'test-results/iphone-home.png'});
});

test('small and landscape screens remain usable',async({page})=>{
  for(const size of [{width:320,height:568},{width:844,height:390}]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await page.getByRole('button',{name:/30分、協力する|お約束のつづきを見る/}).click();
    await expect(page.getByRole('heading',{name:'あとは、スマホを置いて。'})).toBeVisible();
    await page.getByRole('button',{name:'‹ 住処へ戻る'}).click();
    await page.getByRole('button',{name:'設定と試作モード'}).click();
    await page.getByRole('button',{name:'住処に戻る',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  }
});
