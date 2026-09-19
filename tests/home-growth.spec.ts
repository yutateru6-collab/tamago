import { test, expect } from '@playwright/test';
import { initialWorld } from '../src/domain/engine';
import { sandboxPreset } from '../src/domain/sandbox';

async function seed(page: import('@playwright/test').Page, name:string) {
  const w=sandboxPreset(name);
  await page.goto('/');
  await page.evaluate(w=>localStorage.setItem('tamago.world.v1',JSON.stringify({...w,seenMemoryIds:w.memories.map(m=>m.id)})),w);
  await page.reload();
}

test('same home, original motion, and only earned furniture at every stage',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});
  for(const name of ['initial','half','shelf','finds','full','faded','damaged','empty']) {
    await seed(page,name);
    await expect(page.locator('.scene-art')).toHaveAttribute('src','/art/home-room.webp');
    await expect(page.locator('.home-growth-art')).toHaveCount(0);
    await expect(page.getByLabel('工房の青い子の原画アニメ')).toHaveCount(1);
    await expect(page.locator('[data-decor="shelf"]')).toHaveCount(name==='initial'?0:1);
    await expect(page.locator('[data-decor="hammock"]')).toHaveCount(['full','faded','damaged','empty'].includes(name)?1:0);
    await expect(page.locator('[data-decor="field-notes"]')).toHaveCount(['finds','full','faded','damaged','empty'].includes(name)?1:0);
    await expect.poll(()=>page.locator('.scene img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:`test-results/visual/${info.project.name}-living-${name}.png`});
  }
});

test('existing personal saves acquire display only; arranging and repairs preserve earned items',async({page})=>{
  await seed(page,'damaged');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago.world.v1')!));
  await page.getByRole('button',{name:'住処',exact:true}).click();
  const shelf=page.locator('.decor-row').filter({has:page.getByRole('heading',{name:'宝物の小さな棚',exact:true})});
  await shelf.getByRole('button',{name:'少し手前に'}).click();
  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await expect(page.getByTestId('home-shelf')).toHaveAttribute('style',/top: 49%/);
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await shelf.getByRole('button',{name:'しまう',exact:true}).click();
  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await expect(page.getByTestId('home-shelf')).toHaveCount(0);
  await expect(page.locator('[data-decor="field-notes"]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('home-shelf')).toHaveCount(0);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago.world.v1')!));
  expect(saved.built).toEqual(before.built);
  expect(saved.inventory).toEqual(before.inventory);
  await page.getByRole('button',{name:'住処',exact:true}).click();
  await shelf.getByRole('button',{name:'いつもの場所'}).click();
  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await expect(page.getByTestId('home-shelf')).toBeVisible();
});

test('developer presets and events are isolated from personal storage, including reload and return',async({page})=>{
  await seed(page,'half');
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  await page.getByRole('button',{name:'設定と試作モード'}).click();
  await page.getByRole('button',{name:'開発者モードを開く'}).click();
  await expect(page.getByRole('heading',{name:'暮らしの変化を試す'})).toBeVisible();
  await page.getByRole('button',{name:'棚の制作50%',exact:true}).click();
  await page.getByRole('button',{name:'30分の休息を完了する'}).click();
  await expect(page.getByRole('dialog',{name:'おかえり',exact:true})).toContainText('宝物の小さな棚');
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await expect(page.getByTestId('home-shelf')).toBeVisible();
  await page.getByRole('button',{name:'確認パネル'}).click();
  await page.getByRole('button',{name:'家具が傷む',exact:true}).click();
  await expect(page.locator('.habitat-layers')).toHaveAttribute('data-home-stage','damaged');
  await page.getByRole('button',{name:'離れた時間を試す（2時間）'}).click();
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await expect(page.locator('.habitat-layers')).toHaveAttribute('data-home-stage','warm');
  await page.reload();
  await expect(page.locator('.habitat-layers')).toHaveAttribute('data-home-stage','warm');
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
  await page.getByRole('button',{name:'通常に戻る'}).click();
  await expect(page.getByTestId('home-shelf-progress')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
});

test('developer preview, slots and furniture actions fit 320/390/430px',async({page},info)=>{
  for(const width of [320,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/?dev=1');
    await page.getByRole('button',{name:'家具がすべて完成'}).click();
    await page.getByRole('button',{name:'配置枠を見る'}).click();
    await expect(page.locator('.decor-slot')).toHaveCount(6);
    expect(await page.locator('.sandbox-screen').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.screenshot({path:`test-results/visual/${info.project.name}-sandbox-${width}.png`});
    await page.getByRole('button',{name:'この状態でホームを見る'}).click();
    await page.getByRole('button',{name:'住処',exact:true}).click();
    await page.getByRole('region',{name:'模様がえ'}).scrollIntoViewIfNeeded();
    expect(await page.locator('.decor-collection').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  }
});

test('normal play builds the shelf, adds only earned keepsakes and survives reload',async({page})=>{
  test.setTimeout(75000);
  const start=Date.UTC(2026,8,19);
  await page.clock.setFixedTime(new Date(start));
  await page.goto('/');
  await page.getByRole('button',{name:'集めた木で、小さな棚をつくろう'}).click();
  await page.getByRole('button',{name:'これをつくろう',exact:true}).click();
  for(let step=1;step<=6;step++) {
    await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
    await expect(page.getByRole('timer',{name:'お約束の残り時間'})).toContainText('30:00');
    await page.clock.setFixedTime(new Date(start+step*1800000));
    await page.getByRole('button',{name:'30分、スマホを休めた'}).click();
    await page.getByRole('button',{name:'住処をのぞく'}).click();
    await expect(page.locator('.scene-art')).toHaveAttribute('src','/art/home-room.webp');
    await expect(page.getByTestId('home-shelf')).toHaveCount(step>=2?1:0);
    await expect(page.locator('[data-decor="field-notes"]')).toHaveCount(step===6?1:0);
    await expect(page.getByTestId('home-hammock')).toHaveCount(0);
    await expect(page.getByTestId('home-plant')).toHaveCount(0);
  }
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  const saved=JSON.parse(before!);
  expect(saved.built).toEqual(['shelf']);
  expect(saved.expeditionCount).toBe(2);
  expect(saved.inventory).toEqual({wood:4,cloth:0,glass:2,seed:0});
  await page.reload();
  await expect(page.locator('[data-decor="field-notes"]')).toBeVisible();
  await expect(page.locator('.home-treasure')).toHaveCount(2);
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
});
