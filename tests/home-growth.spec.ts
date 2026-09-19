import { test, expect } from '@playwright/test';
import { initialWorld } from '../src/domain/engine';

test('home grows from the current scene through the three approved richer images', async ({page}, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const base={...initialWorld(Date.UTC(2026,8,19)),vitality:100,habitat:100,homeCare:{wear:0,day:'2026-09-19',dailyWear:0}};
  const cases=[
    {built:[],stage:0,src:'/art/workshop-idle.jpg'},
    {built:['shelf'],stage:1,src:'/art/home-growth-1.png'},
    {built:['shelf','hammock'],stage:2,src:'/art/home-growth-2.png'},
    {built:['shelf','hammock','garden'],stage:3,src:'/art/home-growth-3.png'},
  ] as const;
  for (const item of cases) {
    await page.evaluate(w=>localStorage.setItem('tamago.world.v1',JSON.stringify(w)),{...base,built:[...item.built]});
    await page.reload();
    if (item.stage===0) {
      await expect(page.locator('.scene-art')).toHaveAttribute('src',item.src);
      await expect(page.locator('.home-growth-art')).toHaveCount(0);
    } else {
      await expect(page.locator(`[data-home-growth-stage="${item.stage}"]`)).toBeVisible();
      await expect(page.locator('.home-growth-art')).toHaveAttribute('src',item.src);
      await expect.poll(()=>page.locator('.home-growth-art').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
    }
    const path=`test-results/visual/${testInfo.project.name}-home-growth-${item.stage}.png`;
    await page.screenshot({path});
    await testInfo.attach(`home-growth-${item.stage}`,{path,contentType:'image/png'});
  }
});

test('deterioration visually overrides rich art without deleting completed furnishings', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const world={...initialWorld(Date.UTC(2026,8,19)),vitality:80,habitat:80,built:['shelf','hammock','garden'],expeditionCount:3,homeCare:{wear:25,day:'2026-09-19',dailyWear:25}};
  await page.evaluate(w=>localStorage.setItem('tamago.world.v1',JSON.stringify(w)),world);
  await page.reload();
  await expect(page.locator('.home-growth-art')).toHaveCount(0);
  await expect(page.locator('.habitat-layers')).toHaveAttribute('data-home-stage','faded');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tamago.world.v1')!));
  expect(saved.built).toEqual(['shelf','hammock','garden']);
});
