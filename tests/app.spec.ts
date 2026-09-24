import { test, expect } from '@playwright/test';
import { initialWorld } from '../src/domain/engine';

test('published video supports metadata and resume byte ranges',async({request})=>{
  const full=await request.get('/art/workshop-idle.mp4');
  expect(full.status()).toBe(200);
  const bytes=await full.body();
  for(const [range,start,end] of [['bytes=0-1',0,1],['bytes=3749-',3749,bytes.length-1]] as const){
    const partial=await request.get('/art/workshop-idle.mp4',{headers:{Range:range}});
    expect(partial.status()).toBe(206);
    expect(partial.headers()['content-range']).toBe(`bytes ${start}-${end}/${bytes.length}`);
    expect(partial.headers()['content-length']).toBe(String(end-start+1));
    expect(await partial.body()).toEqual(bytes.subarray(start,end+1));
  }
});

test('first thirty minutes visibly advances the unfinished shelf',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-09-18T00:00:00Z'));
  await page.goto('/');
  await page.getByRole('button',{name:'最初の棚をつくる'}).click();
  await page.getByRole('button',{name:'これをつくろう',exact:true}).click();
  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await expect(page.getByRole('timer',{name:'お約束の残り時間'})).toContainText('30:00');
  await page.clock.setFixedTime(new Date('2026-09-18T00:30:00Z'));
  await page.getByRole('button',{name:'30分、スマホを休めた'}).click();
  await page.getByRole('button',{name:'住処をのぞく'}).click();
  await expect(page.getByTestId('home-shelf-progress')).toBeVisible();
  await expect(page.locator('.home-scene-note')).toContainText('50%');
  await page.reload();
  await expect(page.locator('.home-scene-note')).toContainText('50%');
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
  await page.getByText('元気・持ちもの・暮らし方',{exact:true}).click();
  await expect(page.getByRole('meter',{name:'この子の元気'})).toHaveAttribute('value','64');
  await page.getByText('元気・持ちもの・暮らし方',{exact:true}).click();
  await page.getByRole('button',{name:'30分、協力する',exact:true}).click();
  await page.getByRole('button',{name:'途中でやめる（罰はありません）'}).click();
  await page.getByRole('button',{name:'今回はおしまいにする'}).click();
  await page.getByText('元気・持ちもの・暮らし方',{exact:true}).click();
  await expect(page.getByRole('meter',{name:'この子の元気'})).toHaveAttribute('value','64');
  await page.getByText('元気・持ちもの・暮らし方',{exact:true}).click();
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
    await expect.poll(()=>page.locator('.scene-art').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.fonts.check('700 22px "Zen Maru Gothic"','こもれびの巣'))).toBe(true);
    await expect(page.locator('.scene-header h1')).toHaveCSS('font-family',/Zen Maru Gothic/);
    await expect(page.locator('.scene-furniture-count')).toContainText('0 / 3');
    if(width===390) await expect(page.getByRole('button',{name:'30分、協力する',exact:true})).toBeInViewport();
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
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:15000}).toBeGreaterThan(1);
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
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(1);
  await page.waitForTimeout(10500);
  await expect(video).toHaveJSProperty('error',null);
  await expect(video).toHaveJSProperty('paused',false);
});

test('original video can recover from a media load failure without changing progress',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(world=>localStorage.setItem('tamago.world.v1',JSON.stringify(world)),initialWorld());
  await page.goto('/');
  const video=page.getByLabel('工房の青い子の原画アニメ');
  await expect(video).toHaveJSProperty('paused',false);
  // WebKit's native media loader can bypass Playwright routing. Give the real
  // decoder an invalid source so both engines produce an actual media error.
  await video.evaluate((v:HTMLVideoElement)=>{v.src='data:video/mp4;base64,AA==';v.load();});
  const retry=page.getByRole('button',{name:'キャラの動画を読み直して再生する'});
  await expect(retry).toBeVisible();
  await expect(video).toBeHidden();
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  await video.evaluate((v:HTMLVideoElement)=>{v.src='/art/workshop-idle.mp4';});
  await retry.click();
  await expect(video).toBeVisible();
  await expect(video).toHaveJSProperty('paused',false);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(1);
  await page.getByRole('button',{name:'キャラの動きを止める'}).click();
  await expect(video).toHaveJSProperty('paused',true);
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
});

test('explicit play works when autoplay was rejected with motion already enabled',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{
    localStorage.setItem('tamago-character-motion','on');
    // DOM inspection can itself grant transient userActivation in WebKit.
    // Reject playback until an actual trusted pointer event reaches the page.
    let clicked=false;
    document.addEventListener('pointerdown',event=>{if(event.isTrusted)clicked=true;},true);
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      if(!clicked)return Promise.reject(new DOMException('A gesture is required','NotAllowedError'));
      return play.call(this);
    };
  });
  await page.goto('/');
  const video=page.getByLabel('工房の青い子の原画アニメ');
  await expect(video).toHaveJSProperty('paused',true);
  await page.getByRole('button',{name:'キャラの動きを再生する'}).click();
  await expect(video).toHaveJSProperty('paused',false);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(1);
  await page.getByRole('button',{name:'キャラの動きを止める'}).click();
  await expect(video).toHaveJSProperty('paused',true);
});


test('priority UX: first goal, compact secondary screens, safe usage confirmation, backup and focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','ja');
  await expect(page.getByRole('button',{name:'最初の棚をつくる'})).toBeVisible();
  await expect(page.getByLabel('次の30分の見通し')).toContainText('最初は、小さな棚から');
  expect(parseFloat(await page.locator('.honesty-note').evaluate(el=>getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);

  await page.getByRole('button',{name:'探索',exact:true}).click();
  const exploreHeading=page.getByRole('heading',{name:'探索',exact:true});
  await expect(exploreHeading).toBeFocused();
  await expect(page.getByText('いまの住処を見る',{exact:true})).toBeVisible();
  await expect(page.locator('.world-preview')).toBeHidden();
  await expect(page.locator('.choice-card').first().getByRole('button')).toBeInViewport();

  await page.getByRole('button',{name:'ホーム',exact:true}).click();
  await page.getByRole('button',{name:'設定と試作モード'}).click();
  const before=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  await page.getByRole('button',{name:'使いすぎ30分を記録する'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('tamago.world.v1'))).toBe(before);
  await expect(page.getByRole('button',{name:'30分を記録する'})).toBeVisible();
  await page.getByRole('button',{name:'やめる'}).click();

  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'バックアップを書き出す'}).click();
  expect((await download).suggestedFilename()).toMatch(/^tamago-backup-\d{4}-\d{2}-\d{2}\.json$/);

  const raw=await page.evaluate(()=>localStorage.getItem('tamago.world.v1'));
  const world=raw?JSON.parse(raw):initialWorld();
  const restoredWorld={...world,inventory:{...world.inventory,wood:9}};
  const backup=JSON.stringify({format:'tamago-backup',version:1,exportedAt:Date.now(),world:restoredWorld});
  const input=page.locator('input[type="file"]');
  await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
  await expect(page.getByRole('button',{name:'このバックアップを復元する'})).toBeVisible();
  await page.getByRole('button',{name:'復元しない'}).click();
  await expect(page.getByRole('status')).toContainText('現在の記録はそのまま');
  await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
  await page.getByRole('button',{name:'このバックアップを復元する'}).click();
  await expect(page.getByRole('status')).toContainText('バックアップを復元しました');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago.world.v1')!).inventory.wood)).toBe(9);
});


test('priority actions stay visible at audited phone sizes',async({page})=>{
  for(const size of [{width:390,height:844},{width:360,height:740}]){
    await page.setViewportSize(size);
    await page.goto('/');
    await page.getByRole('button',{name:'探索',exact:true}).click();
    await expect(page.locator('.choice-card').first().getByRole('button')).toBeInViewport();
    await page.getByRole('button',{name:'住処',exact:true}).click();
    await expect(page.getByRole('button',{name:'これをつくろう',exact:true}).first()).toBeInViewport();
  }
});
