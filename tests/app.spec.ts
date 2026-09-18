import { test, expect } from '@playwright/test';

test('painted companion follows world state and preserves playback choice',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('complementary',{name:'この子の暮らし'})).toHaveAttribute('data-activity','explore');
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await page.getByRole('button',{name:'これをつくろう',exact:true}).click();
  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'この子の暮らし'})).toHaveAttribute('data-activity','craft');
  await page.getByRole('button',{name:'設定と試作モード'}).click();
  await page.getByRole('button',{name:'離れた時間を試す（2時間）'}).click();
  await page.getByRole('button',{name:'住処に戻る',exact:true}).click();
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  const video=page.getByLabel('工房の青い子の原画アニメ');
  await expect(video).toHaveJSProperty('paused',false);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(1);
  await expect(page.locator('.life-keepsakes')).toContainText('宝物の小さな棚');
  await page.getByRole('button',{name:'キャラの動きを止める'}).click();
  await expect(video).toHaveJSProperty('paused',true);
  await page.reload();
  await expect(video).toBeHidden();
  await page.getByRole('button',{name:'キャラの動きを再生する'}).click();
  await expect(video).toHaveJSProperty('paused',false);
  await page.waitForTimeout(10500);
  await page.screenshot({path:'test-results/painted-home.png'});
  await page.getByRole('button',{name:'設定と試作モード'}).click();
  await page.getByRole('button',{name:'使いすぎた状態を試す（2時間）'}).click();
  await page.getByRole('button',{name:'住処に戻る',exact:true}).click();
  await expect(video).toBeVisible();
  await expect(page.locator('feDisplacementMap,.eyelids')).toHaveCount(0);
  await expect(page.getByRole('complementary',{name:'この子の暮らし'})).toHaveAttribute('data-activity','rest');
});
test('craft, return, persist, and deteriorate', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'こもれびの巣' })).toBeVisible();
  await expect(page.locator('.scene-art')).toHaveJSProperty('naturalWidth', 960);
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
  await expect(page.locator('.scene-art')).toHaveAttribute('src', '/art/workshop-idle.jpg');
  await expect(page.getByRole('region',{name:'住処の様子：まずは、ひとやすみ'})).toBeVisible();
  await expect(page.locator('.scene-art')).toHaveJSProperty('naturalWidth', 960);
  await page.getByRole('button', { name: '記録', exact: true }).click();
  await expect(page.getByRole('heading', { name: '宝物の小さな棚が、できていた。' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('iPhone fullscreen, persisted promise, confirmation and no penalty on cancel', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.clock.setFixedTime(new Date('2026-09-18T00:00:00Z'));
  await page.goto('/');
  await expect(page.getByTestId('device-picker')).toBeHidden();
  const screen = await page.getByTestId('device-screen').boundingBox();
  expect(screen?.width).toBe(390);
  expect(screen?.height).toBeCloseTo(844,0);
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await expect(page.getByRole('heading',{name:'あとは、スマホを置いて。'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'お約束のつづきを見る'}).click();
  await expect(page.getByRole('button',{name:'30分、スマホを休めた'})).toBeHidden();
  await page.clock.setFixedTime(new Date('2026-09-18T00:30:00Z'));
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

test('visual review: Japanese font, iPhone layouts and character motion',async({page},testInfo)=>{
  const shot=async(name:string)=>{
    const path=`test-results/visual/${testInfo.project.name}-${name}.png`;
    await page.screenshot({path});
    await testInfo.attach(name,{path,contentType:'image/png'});
  };
  for(const width of [390,320,430]) {
    await page.setViewportSize({width,height:width===320?568:844});
    await page.goto('/');
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.fonts.check('700 22px "Zen Maru Gothic"','こもれびの巣'))).toBe(true);
    await expect(page.locator('.scene-header h1')).toHaveCSS('font-family',/Zen Maru Gothic/);
    await shot(`${width}-home`);
    await page.getByRole('button',{name:/30分、協力する|お約束のつづきを見る/}).click();
    await expect(page.locator('.quiet-clock strong')).toHaveCSS('font-size','36px');
    await page.getByRole('heading',{name:'あとは、スマホを置いて。'}).scrollIntoViewIfNeeded();
    await page.locator('.quiet-back').scrollIntoViewIfNeeded();
    await shot(`${width}-quiet`);
    expect(await page.locator('.quiet-screen').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.getByRole('button',{name:'途中でやめる（罰はありません）'}).scrollIntoViewIfNeeded();
    await shot(`${width}-quiet-bottom`);
  }
});


test('original painting plays on home and quiet screen without legacy deformation',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const video=page.getByLabel('工房の青い子の原画アニメ');
  await expect(page.locator('feDisplacementMap,.eyelids,.creature-motion')).toHaveCount(0);
  await expect(video).toHaveJSProperty('paused',false);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(1);
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await expect(video).toHaveJSProperty('paused',false);
  await expect(page.locator('feDisplacementMap,.eyelids')).toHaveCount(0);
  await page.getByRole('button',{name:'‹ 住処へ戻る'}).click();
  await page.getByRole('button',{name:'キャラの動きを止める'}).click();
  await expect(video).toHaveJSProperty('paused',true);
  await page.reload();
  await expect(video).toBeHidden();
  await page.evaluate(()=>localStorage.removeItem('tamago-character-motion'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await expect(video).toBeHidden();
  await page.getByRole('button',{name:'キャラの動きを再生する'}).click();
  await expect(video).toHaveJSProperty('paused',false);
  await page.waitForTimeout(10500);
});
