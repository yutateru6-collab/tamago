import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorld, applyActivity, startCraft, conditionOf, chooseDestination } from '../.test-build/domain/engine.js';
import { WorldRepository, STORAGE_KEY, createBackup, parseBackup } from '../.test-build/platform/storage.js';
import { homeState, homeDay } from '../.test-build/domain/home.js';
const windowOf=(start,minutes,kind='away')=>({id:`${start}:${kind}`,start,end:start+minutes*60000,kind,evidence:'demo'});
test('home wear caps per recorded day, keeps achievements, and does not reset on clock rollback',()=>{
  let w={...initialWorld(0),built:['shelf','garden'],expeditionCount:3};
  const day=Date.UTC(2026,8,18);
  const usage=(at)=>({...windowOf(w.processedUntil,480,'usage'),recordedAt:at});
  const first=usage(day); w=applyActivity(w,[first]);
  assert.equal(homeState(w).wear,25);
  assert.deepEqual(applyActivity(w,[first]),w);
  w=applyActivity(w,[usage(day)]); assert.equal(homeState(w).wear,25);
  w=applyActivity(w,[usage(day-86400000)]); assert.equal(homeState(w).wear,25);
  w=applyActivity(w,[usage(day+86400000)]); assert.equal(homeState(w).wear,50);
  w=applyActivity(w,[usage(day+2*86400000)]); assert.equal(homeState(w).stage,'empty');
  assert.equal(homeState(w).treasureCount,0);
  assert.deepEqual(w.built,['shelf','garden']);
  assert.equal(homeDay(Date.UTC(2026,8,18,14,59)),'2026-09-18');
  assert.equal(homeDay(Date.UTC(2026,8,18,15)),'2026-09-19');
});
test('rest repairs before crafting without spending materials or reopening daily allowance',()=>{
  const original={...startCraft(initialWorld(0),'shelf'),homeCare:{wear:22.5,day:'2026-09-18',dailyWear:25}};
  const repaired=applyActivity(original,[windowOf(0,30)]);
  assert.equal(homeState(repaired).wear,0);
  assert.equal(repaired.crafting.minutes,0);
  assert.deepEqual(repaired.inventory,original.inventory);
  assert.equal(repaired.homeCare.dailyWear,25);
  const next=applyActivity(repaired,[windowOf(repaired.processedUntil,60)]);
  assert.deepEqual(next.built,['shelf']);
});
test('home care persists, accepts old saves, and unknown time cannot damage or repair',()=>{
  const r=new WorldRepository(storage());
  let w=r.save(initialWorld(0),0);
  w=r.save(applyActivity(w,[{...windowOf(0,30,'usage'),recordedAt:Date.UTC(2026,8,18)}]),1);
  assert.deepEqual(r.load().homeCare,w.homeCare);
  const n=applyActivity(w,[windowOf(w.processedUntil,480,'unknown')]);
  assert.deepEqual(n.homeCare,w.homeCare);
  assert.throws(()=>r.save({...w,homeCare:{wear:101,day:'2026-09-18',dailyWear:0}},2));
});
test('replaying the same interval never duplicates rewards',()=>{const w=initialWorld(0),a=windowOf(0,120);const next=applyActivity(w,[a]);assert.equal(next.expeditionCount,2);assert.deepEqual(applyActivity(next,[a]),next);assert.equal(w.inventory.wood,2);});
test('overlapping intervals only count the unseen portion',()=>{const a=applyActivity(initialWorld(0),[windowOf(0,60)]);const b=applyActivity(a,[windowOf(0,120)]);assert.equal(b.expeditionCount,2);});
test('unknown time and clock rollback do not reward or punish',()=>{const w=initialWorld(600000);const n=applyActivity(w,[windowOf(600000,120,'unknown')]);assert.equal(n.vitality,w.vitality);assert.equal(n.expeditionCount,0);assert.deepEqual(applyActivity(w,[windowOf(0,5)]),w);});
test('a wall clock gap is not away time',()=>{const n=applyActivity(initialWorld(0),[windowOf(86400000,60)]);assert.equal(n.expeditionCount,1);});
test('overuse harms character and habitat; away restores both',()=>{let w=applyActivity(initialWorld(0),[windowOf(0,120,'usage')]);assert.equal(conditionOf(w),'weary');assert.equal(w.vitality,0);w=applyActivity(w,[windowOf(w.processedUntil,480)]);assert.equal(conditionOf(w),'thriving');});
test('craft reserves materials once and completes once before exploring',()=>{const w=startCraft(initialWorld(0),'shelf');assert.equal(w.inventory.wood,0);assert.throws(()=>startCraft(w,'shelf'));const n=applyActivity(w,[windowOf(0,120)]);assert.deepEqual(n.built,['shelf']);assert.equal(n.expeditionCount,1);assert.equal(n.memories.filter(m=>m.kind==='craft').length,1);assert.throws(()=>startCraft(n,'shelf'));});
test('exhausted creatures recover before working',()=>{const w={...initialWorld(0),vitality:0};const n=applyActivity(w,[windowOf(0,60)]);assert.equal(n.expeditionMinutes,0);assert.equal(n.vitality,18);});
test('changing destination cannot erase earned progress',()=>{const w=applyActivity(initialWorld(0),[windowOf(0,30)]);assert.throws(()=>chooseDestination(w,'workshop'));});
test('invalid intervals and unconnected OS evidence are rejected',()=>{assert.throws(()=>applyActivity(initialWorld(0),[{...windowOf(0,1),end:NaN}]));assert.throws(()=>applyActivity(initialWorld(0),[{...windowOf(0,1),evidence:'os'}]));});
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
test('reload retains partial crafting and stale writes fail',()=>{const s=storage(),r=new WorldRepository(s);const a=r.save(applyActivity(startCraft(initialWorld(0),'shelf'),[windowOf(0,30)]),0);assert.equal(new WorldRepository(s).load().crafting.minutes,30);assert.throws(()=>r.save(a,0));const b=r.save(applyActivity(r.load(),[windowOf(30*60000,30)]),1);assert.deepEqual(b.built,['shelf']);});
test('corrupt data is never overwritten',()=>{const s=storage();s.setItem(STORAGE_KEY,'{broken');const r=new WorldRepository(s);assert.throws(()=>r.save(initialWorld(0),0));assert.equal(s.getItem(STORAGE_KEY),'{broken');});
test('storage write failures propagate',()=>{const r=new WorldRepository({getItem:()=>null,setItem:()=>{throw new Error('quota');}});assert.throws(()=>r.save(initialWorld(0),0),/quota/);});

test('milestone memories survive after more than one hundred repeat logs', async()=>{
  const { prependMemory, MAX_MEMORIES } = await import('../.test-build/domain/memories.js');
  const milestone={id:'craft:shelf',at:1,kind:'craft',title:'棚ができた',detail:'節目'};
  let memories=[milestone];
  for(let i=0;i<150;i++) memories=prependMemory(memories,{id:`discovery:stress:${i}`,at:i+2,kind:'discovery',title:'探索',detail:'反復ログ'});
  assert.ok(memories.length<=MAX_MEMORIES);
  assert.ok(memories.some(memory=>memory.id==='craft:shelf'));
  assert.equal(memories[0].id,'discovery:stress:149');
  assert.equal(isWorld({...initialWorld(0),memories,seenMemoryIds:[]}),true);
});

test('backup round-trip is validated and rejects corrupt, future and oversized files',()=>{
  const world={...initialWorld(0),built:['shelf'],memories:[{id:'craft:shelf',at:1,kind:'craft',title:'棚',detail:'完成'}]};
  const raw=createBackup(world,1234);
  assert.deepEqual(parseBackup(raw),world);
  assert.throws(()=>parseBackup('{broken'),/バックアップを読めません/);
  assert.throws(()=>parseBackup(JSON.stringify({format:'tamago-backup',version:2,exportedAt:1,world})),/版にはまだ対応/);
  assert.throws(()=>parseBackup('x'.repeat(1_000_001)),/大きすぎます/);
});

test('next thirty-minute plan distinguishes recovery, repair, crafting and exploration',async()=>{
  const { quietPlan }=await import('../.test-build/domain/progress.js');
  assert.match(quietPlan({...initialWorld(0),vitality:0}).title,/回復/);
  assert.match(quietPlan({...initialWorld(0),homeCare:{wear:15,day:'2026-09-19',dailyWear:0}}).title,/お手入れ/);
  assert.match(quietPlan(startCraft(initialWorld(0),'shelf')).detail,/完成まで約2回/);
  assert.match(quietPlan(initialWorld(0)).detail,/次の拾い物まで約2回/);
});



test('quiet promise: wait, confirm once, and preserve old saves', async () => {
  const { beginQuiet, completeQuiet } = await import('../.test-build/domain/engine.js');
  const { isWorld } = await import('../.test-build/platform/storage.js');
  const base = initialWorld(1000);
  const started = beginQuiet(base, 1000);
  assert.equal(isWorld(base), true);
  assert.equal(isWorld(started), true);
  assert.throws(() => completeQuiet(started, 1001));
  const done = completeQuiet(started, 1801000);
  assert.equal(done.vitality, base.vitality + 9);
  assert.equal(done.habitat, base.habitat + 6);
  assert.equal(done.quietSession, null);
  assert.throws(() => completeQuiet(done, 1801000));
  assert.equal(done.memories.filter(m => m.id === 'quiet:1000').length, 1);
  assert.equal(isWorld(done), true);
});

import { DECOR, decorState, arrangeDecor } from '../.test-build/domain/decor.js';
import { sandboxPreset, sandboxRest } from '../.test-build/domain/sandbox.js';
import { isWorld, SANDBOX_KEY } from '../.test-build/platform/storage.js';
import { REST_EVENTS, restEventState, enjoyRestEvent } from '../.test-build/domain/restEvents.js';
import { beginQuiet, completeQuiet } from '../.test-build/domain/engine.js';
test('only confirmed rest earns events, including recovery; no cancel, unknown or usage rewards',()=>{
  const original={...initialWorld(1000),vitality:0};
  const pending=beginQuiet(original,1000);
  assert.throws(()=>completeQuiet(pending,1800999));
  assert.equal(restEventState(pending,'snack').available,0);
  assert.equal(restEventState({...pending,quietSession:null},'snack').available,0);
  for(const kind of ['unknown','usage','away']) assert.equal(restEventState(applyActivity(original,[windowOf(1000,120,kind)]),'snack').available,0);
  const done=completeQuiet(pending,1801000);
  assert.equal(done.restEvents.minutes,30);
  assert.equal(done.expeditionMinutes,0);
  assert.equal(restEventState(done,'snack').available,1);
  assert.equal(restEventState(done,'tea').remaining,30);
  assert.throws(()=>completeQuiet(done,1801000));
  assert.equal(original.restEvents,undefined);
});
test('30/60/120 minute invitations accumulate independently, persist, and use exactly once per request',()=>{
  let world=initialWorld(0);
  for(let i=1;i<=4;i++) {
    world=completeQuiet(beginQuiet(world,i*1800000), (i+1)*1800000);
    for(const event of REST_EVENTS) assert.equal(restEventState(world,event.id).available,Math.floor(i*30/event.minutes));
  }
  const before=structuredClone(world);
  const enjoyed=enjoyRestEvent(world,'picnic',0,1234);
  assert.deepEqual(world,before);
  assert.equal(restEventState(enjoyed,'picnic').available,0);
  assert.equal(restEventState(enjoyed,'snack').available,4);
  for(const key of ['inventory','built','vitality','habitat','growthMinutes','expeditionCount']) assert.deepEqual(enjoyed[key],before[key]);
  assert.throws(()=>enjoyRestEvent(enjoyed,'picnic',0));
  const snack=enjoyRestEvent(enjoyed,'snack',0);
  assert.throws(()=>enjoyRestEvent(snack,'snack',0));
  assert.equal(restEventState(enjoyRestEvent(snack,'snack',1),'snack').available,2);
  const r=new WorldRepository(storage());r.save(snack,0);
  assert.equal(restEventState(r.load(),'snack').available,3);
  assert.equal(r.load().memories.filter(m=>m.kind==='event').length,2);
  assert.throws(()=>enjoyRestEvent(initialWorld(0),'snack',0));
  assert.throws(()=>enjoyRestEvent(world,'missing',0));
});
test('event storage accepts legacy saves and rejects impossible or malformed balances',()=>{
  const base=initialWorld(0);
  assert.equal(isWorld(base),true);
  for(const events of [{minutes:NaN,enjoyed:{}},{minutes:1,enjoyed:{}},{minutes:30,enjoyed:[]},{minutes:30,enjoyed:{snack:2}},{minutes:30,enjoyed:{tea:1}},{minutes:30,enjoyed:{snack:-1}},{minutes:30,enjoyed:{unknown:0}}]) assert.equal(isWorld({...base,restEvents:events}),false);
  for(const name of ['rest30','rest60','rest120']) assert.equal(isWorld(sandboxPreset(name)),true);
});
test('a recipe becomes one object; discoveries require a shelf, and extension uses only a definition',()=>{
  const initial=initialWorld(0), shelf=DECOR.find(i=>i.id==='shelf');
  assert.equal(decorState(initial,shelf).visible,false);
  const half=sandboxPreset('half');
  assert.equal(decorState(half,shelf).progress,.5);
  assert.equal(decorState(half,shelf).owned,false);
  const done=sandboxRest(half);
  assert.equal(decorState(done,shelf).owned,true);
  assert.equal(decorState(done,DECOR.find(i=>i.id==='garden')).visible,false);
  const sample={id:'future-item',name:'Future',image:'/future.png',discoveries:2,parent:'shelf',defaultSlot:'a',slots:{a:{x:5,y:5,width:10,z:21}}};
  assert.equal(decorState(sandboxPreset('finds'),sample,[...DECOR,sample]).visible,true);
  assert.equal(decorState({...initial,expeditionCount:2},sample,[...DECOR,sample]).visible,false);
});
test('arranging, deterioration and repair retain acquisitions and reject unowned or invalid placement',()=>{
  const world=sandboxPreset('full'),shelf=DECOR.find(i=>i.id==='shelf');
  const snapshot=structuredClone(world);
  const hidden=arrangeDecor(world,'shelf',null);
  assert.equal(decorState(hidden,shelf).visible,false);
  assert.equal(decorState(hidden,DECOR.find(i=>i.id==='field-notes')).visible,false);
  assert.deepEqual(world,snapshot);
  assert.deepEqual(hidden.built,world.built);
  const moved=arrangeDecor(hidden,'shelf','low');
  assert.equal(decorState(moved,shelf).placement.y,49);
  assert.throws(()=>arrangeDecor(initialWorld(0),'shelf','wall'));
  assert.throws(()=>arrangeDecor(world,'shelf','__proto__'));
  const worn=sandboxPreset('empty');
  assert.equal(decorState(worn,shelf).visible,true);
  assert.deepEqual(sandboxRest(worn).built,worn.built);
  assert.deepEqual(sandboxRest(worn).inventory,worn.inventory);
});
test('old save compatibility, decor validation and isolated sandbox repository',()=>{
  const s=storage(),personal=new WorldRepository(s),sandbox=new WorldRepository(s,SANDBOX_KEY);
  personal.save(initialWorld(0),0);
  const before=s.getItem(STORAGE_KEY);
  sandbox.save(sandboxPreset('full'),0);
  assert.equal(s.getItem(STORAGE_KEY),before);
  assert.equal(isWorld(personal.load()),true);
  assert.equal(isWorld({...personal.load(),decor:{hidden:['missing'],placements:{}}}),false);
  assert.equal(isWorld({...personal.load(),decor:{hidden:[],placements:{shelf:'invalid'}}}),false);
  for(const preset of ['initial','half','shelf','finds','full','faded','damaged','empty']) assert.equal(isWorld(sandboxPreset(preset)),true,preset);
});
