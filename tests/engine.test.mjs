import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorld, applyActivity, startCraft, conditionOf, chooseDestination } from '../.test-build/domain/engine.js';
import { WorldRepository, STORAGE_KEY } from '../.test-build/platform/storage.js';
const windowOf=(start,minutes,kind='away')=>({id:`${start}:${kind}`,start,end:start+minutes*60000,kind,evidence:'demo'});
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
