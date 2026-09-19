import { test, expect, type Page } from '@playwright/test';
import { sandboxPreset } from '../src/domain/sandbox';
import { COMPANION_KEY } from '../src/ui/CompanionContext';

async function seed(page:Page, preset='rest120') {
  const world=sandboxPreset(preset);
  await page.goto('/');
  await page.evaluate(w=>localStorage.setItem('tamago.world.v1',JSON.stringify({...w,seenMemoryIds:w.memories.map(m=>m.id)})),world);
  await page.reload();
}
test('rest event: real thirty minute confirmation unlocks food; postpone, enjoy and reload preserve balance',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});
  const start=Date.UTC(2026,8,19);await page.clock.setFixedTime(new Date(start));
  await page.goto('/');
  await expect(page.locator('[data-rest-event="snack"]')).toContainText('あと30分');
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await expect(page.getByRole('timer')).toContainText('30:00');
  await expect(page.locator('.quiet-reward')).toContainText('木の実のおやつ');
  await page.clock.setFixedTime(new Date(start+1800000));
  await page.getByRole('button',{name:'30分、スマホを休めた'}).click();
  await expect(page.getByRole('dialog',{name:'おかえり',exact:true})).toContainText('木の実のおやつ');
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await page.getByRole('button',{name:'木の実のおやつを楽しむ'}).click();
  await page.getByRole('button',{name:'またあとで楽しむ'}).click();
  await page.reload();
  await page.getByRole('button',{name:'木の実のおやつを楽しむ'}).click();
  await page.getByRole('button',{name:'おやつを分ける'}).click();
  await expect(page.getByRole('status')).toContainText('器は空っぽ');
  await page.screenshot({path:`test-results/visual/${info.project.name}-snack-done.png`});
  await page.getByRole('button',{name:'住処へ戻る',exact:true}).click();
  await expect(page.locator('[data-rest-event="snack"]')).toContainText('あと30分');
  await page.reload();
  await expect(page.getByRole('button',{name:'木の実のおやつを楽しむ'})).toHaveCount(0);
  await page.getByRole('button',{name:'記録',exact:true}).click();
  await expect(page.locator('.memory').first()).toContainText('木の実のおやつを、一緒に。');
});

test('event save failure grants no completion; stale requests from another tab cannot consume twice',async({page,context})=>{
  await seed(page);
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  await page.getByRole('button',{name:'こもれびのお茶を楽しむ'}).click();
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('test','QuotaExceededError');};});
  await page.getByRole('button',{name:'お茶を淹れる',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await expect(page.locator('.event-finished')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
  await page.reload();
  const second=await context.newPage();await second.goto('/');
  await page.getByRole('button',{name:'こもれびのお茶を楽しむ'}).click();
  await second.getByRole('button',{name:'こもれびのお茶を楽しむ'}).click();
  await second.getByRole('button',{name:'お茶を淹れる',exact:true}).click();
  await expect(page.getByRole('button',{name:'お茶を淹れる',exact:true})).toBeDisabled();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago.world.v1')!));
  expect(saved.restEvents).toEqual({minutes:120,enjoyed:{tea:1}});
});

test('all three companions share backgrounds, possessions and events across screens without changing personal saves',async({page},info)=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:390,height:844});
  await seed(page);
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  await page.getByRole('button',{name:'設定と試作モード'}).click();
  await page.getByRole('button',{name:'開発者モードを開く'}).click();
  for(const [id,name] of [['chestnut','木の実色の子'],['owl','こもれびのフクロウ'],['original','工房の青い子']]) {
    await page.getByRole('button',{name,exact:true}).click();
    await page.getByRole('button',{name:'休息120分・ピクニック',exact:true}).click();
    await page.getByRole('button',{name:'この状態でホームを見る'}).click();
    for(const tab of ['ホーム','探索','住処','記録']) {
      await page.getByRole('button',{name:tab,exact:true}).click();
      await expect(page.locator('.living-art')).toHaveAttribute('data-companion',id);
      await expect(page.locator('.scene-art')).toHaveAttribute('src','/art/home-base.webp');
      await expect(page.locator('[data-decor="shelf"]')).toHaveCount(0);
      await expect.poll(()=>page.locator('.living-art img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).naturalWidth>0))).toBe(true);
    }
    await page.getByRole('button',{name:'ホーム',exact:true}).click();
    await page.getByRole('button',{name:'水辺のピクニックを楽しむ'}).click();
    const event=page.getByRole('dialog',{name:'水辺のピクニック',exact:true});
    await expect(event.locator('.living-art')).toHaveAttribute('data-companion',id);
    await expect.poll(()=>event.locator('.event-icon').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
    const prop=await event.locator('.event-tableau').boundingBox(),control=await event.locator('.motion-toggle').boundingBox();
    expect(prop!.y+prop!.height).toBeLessThanOrEqual(control!.y);
    await page.screenshot({path:`test-results/visual/${info.project.name}-picnic-ready-${id}.png`});
    await page.getByRole('button',{name:'お弁当をひらく'}).click();
    await expect(event.getByRole('status')).toContainText('お弁当を半分こ');
    await page.screenshot({path:`test-results/visual/${info.project.name}-picnic-${id}.png`});
    await page.getByRole('button',{name:'住処へ戻る',exact:true}).click();
    await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
    await expect(page.locator('.living-art')).toHaveAttribute('data-companion',id);
    await page.getByRole('button',{name:'確認パネル',exact:true}).click();
    await page.getByRole('button',{name:'家具がすべて完成',exact:true}).click();
    await expect(page.locator('[data-decor="shelf"]')).toHaveCount(1);
    for(const screen of ['ホーム','探索','住処','記録']) {
      await page.getByRole('button',{name:screen,exact:true}).click();
      await expect(page.locator('.living-art')).toHaveAttribute('data-companion',id);
      await expect(page.locator('[data-decor="shelf"],[data-decor="hammock"],[data-decor="garden"]')).toHaveCount(3);
    }
    await page.reload();
    await expect(page.locator('.living-art')).toHaveAttribute('data-companion',id);
  }
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
  await page.getByRole('button',{name:'通常に戻る'}).click();
  await expect(page.locator('.living-art')).toHaveAttribute('data-companion','original');
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
  expect(await page.evaluate(key=>sessionStorage.getItem(key),COMPANION_KEY)).toBe('original');
});

test('event cards and sheets fit phone widths and all invitations remain reachable',async({page},info)=>{
  for(const width of [320,390,430]) {
    await page.setViewportSize({width,height:width===320?568:844});await seed(page);
    await page.getByRole('heading',{name:'休んだあとの、お楽しみ'}).scrollIntoViewIfNeeded();
    expect(await page.locator('.rest-events').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.screenshot({path:`test-results/visual/${info.project.name}-events-${width}.png`});
    await page.getByRole('button',{name:'こもれびのお茶を楽しむ'}).click();
    await page.getByRole('button',{name:'お茶を淹れる',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('ふたつのカップ');
    expect(await page.locator('.rest-event-sheet').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.getByRole('button',{name:'住処へ戻る',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`test-results/visual/${info.project.name}-tea-${width}.png`});
  }
});

test('additional companion respects reduced motion, explicit playback and pause without earning progress',async({page})=>{
  await page.goto('/?dev=1');
  await page.getByRole('button',{name:'木の実色の子',exact:true}).click();
  const sprite=page.locator('.variant-companion');
  await expect(sprite).toHaveCSS('animation-name','none');
  const before=await page.evaluate(()=>sessionStorage.getItem('tamago.sandbox.v1'));
  await page.getByRole('button',{name:'キャラの動きを再生する'}).click();
  await expect(sprite).toHaveCSS('animation-name','companion-breathe');
  const transform=await sprite.evaluate(el=>getComputedStyle(el).transform);
  await expect.poll(()=>sprite.evaluate(el=>getComputedStyle(el).transform)).not.toBe(transform);
  await page.getByRole('button',{name:'キャラの動きを止める'}).click();
  await expect(sprite).toHaveCSS('animation-name','none');
  expect(await page.evaluate(()=>sessionStorage.getItem('tamago.sandbox.v1'))).toBe(before);
});
