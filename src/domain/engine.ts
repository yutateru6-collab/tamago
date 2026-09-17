import { DESTINATIONS, RECIPES, RULES } from './catalog.js';
import type { ActivityWindow, Condition, Material, Memory, World } from './model.js';

export const conditionOf = (world: World): Condition => Math.min(world.vitality, world.habitat) < 30 ? 'weary' : Math.min(world.vitality, world.habitat) < 70 ? 'recovering' : 'thriving';
const clamp = (n: number) => Math.min(100, Math.max(0, n));
export function initialWorld(now = Date.now()): World {
  return { version: 1, revision: 0, mode: 'demo', vitality: 55, habitat: 50, growthMinutes: 0, processedUntil: now,
    inventory: { wood: 2, cloth: 0, glass: 0, seed: 0 }, destination: 'bridge', expeditionMinutes: 0, expeditionCount: 0,
    crafting: null, built: [], memories: [], seenMemoryIds: [] };
}
function remember(world: World, memory: Memory) {
  if (!world.memories.some(m => m.id === memory.id)) world.memories = [memory, ...world.memories].slice(0, 100);
  world.seenMemoryIds = world.seenMemoryIds.filter(id => world.memories.some(m => m.id === id));
}
/** Deterministic replay. OS adapters must normalize ordered non-overlapping evidence first.
 * Unknown windows never generate rewards or punishments. Wall-clock gaps are NOT away time. */
export function applyActivity(original: World, windows: ActivityWindow[]): World {
  const world = structuredClone(original);
  const oldCondition = conditionOf(world);
  for (const window of [...windows].sort((a, b) => a.start - b.start)) {
    if (!Number.isSafeInteger(window.start) || !Number.isSafeInteger(window.end) || window.start < 0 || window.end <= window.start) throw new Error('時間の記録が不正です');
    if (!['away', 'usage', 'unknown'].includes(window.kind) || !['demo', 'os', 'self-report'].includes(window.evidence)) throw new Error('計測情報が不正です');
    if (window.evidence === 'os') throw new Error('OS計測はまだ接続されていません');
    if (window.end <= world.processedUntil) continue;
    const start = Math.max(window.start, world.processedUntil);
    const minutes = Math.min((window.end - start) / 60000, RULES.maxWindowMinutes);
    world.processedUntil = window.end;
    if (window.kind === 'unknown') continue;
    if (window.kind === 'usage') {
      world.vitality = clamp(world.vitality - minutes * RULES.decayPerMinute);
      world.habitat = clamp(world.habitat - minutes * RULES.habitatDecay);
      continue;
    }
    const restNeeded = Math.max(0, (RULES.workThreshold - world.vitality) / RULES.recoveryPerMinute);
    const workMinutes = Math.max(0, minutes - restNeeded);
    world.vitality = clamp(world.vitality + minutes * RULES.recoveryPerMinute);
    world.habitat = clamp(world.habitat + minutes * RULES.habitatRecovery);
    world.growthMinutes += workMinutes;
    // A creature does one job at a time. It crafts first, then explores with remaining time.
    let exploration = workMinutes;
    if (world.crafting) {
      const recipe = RECIPES.find(r => r.id === world.crafting!.recipeId)!;
      const spent = Math.min(exploration, recipe.minutes - world.crafting.minutes);
      world.crafting.minutes += spent;
      exploration -= spent;
      if (world.crafting.minutes >= recipe.minutes) {
        world.built.push(recipe.id);
        remember(world, { id: `craft:${recipe.id}`, at: window.end, kind: 'craft', title: `${recipe.name}が、できていた。`, detail: recipe.description });
        world.crafting = null;
      }
    }
    const destination = DESTINATIONS.find(d => d.id === world.destination)!;
    world.expeditionMinutes += exploration;
    while (world.expeditionMinutes >= destination.minutes) {
      world.expeditionMinutes -= destination.minutes;
      world.expeditionCount++;
      for (const [item, amount] of Object.entries(destination.rewards)) world.inventory[item as Material] += amount;
      remember(world, { id: `discovery:${world.expeditionCount}`, at: window.end, kind: 'discovery', title: `${destination.name}から、拾い物。`, detail: 'この子が見つけた材料を、持ちものにしまいました。' });
    }
  }
  if (oldCondition !== 'thriving' && conditionOf(world) === 'thriving') remember(world, { id: 'growth:first-thriving', at: world.processedUntil, kind: 'growth', title: '住処に、光が戻った。', detail: '毛並みも、水も、見違えるほどきれいになりました。' });
  return world;
}
export function startCraft(original: World, id: string): World {
  const recipe = RECIPES.find(r => r.id === id);
  if (!recipe || original.crafting || original.built.includes(id)) throw new Error('いまは、この制作を始められません');
  for (const [key, amount] of Object.entries(recipe.cost)) if (original.inventory[key as Material] < amount) throw new Error('材料がまだ足りません');
  const world = structuredClone(original);
  for (const [key, amount] of Object.entries(recipe.cost)) world.inventory[key as Material] -= amount;
  world.crafting = { recipeId: id, minutes: 0 };
  return world;
}
export function chooseDestination(original: World, id: string): World {
  if (!DESTINATIONS.some(d => d.id === id)) throw new Error('行き先が見つかりません');
  if (original.destination === id) return original;
  // Finish the current expedition before changing: no hidden loss of earned progress.
  if (original.expeditionMinutes > 0) throw new Error('今の探索が終わってから、行き先を変えられます');
  return { ...original, destination: id };
}

export function beginQuiet(original: World, now = Date.now()): World {
  if (original.quietSession) return original;
  const purpose = conditionOf(original) === 'weary' ? 'ひとやすみ' : original.crafting ? '住処づくり' : '小さな探索';
  return { ...original, quietSession: { id: `quiet:${now}`, startedAt: now, endsAt: now + 30 * 60000, purpose } };
}
export function completeQuiet(original: World, now = Date.now()): World {
  const session = original.quietSession;
  if (!session || now < session.endsAt) throw new Error('お約束の30分が終わるまで、もう少し。');
  // Explicit user confirmation, not inferred OS activity. Apply once in the same saved transaction.
  const world = applyActivity(original, [{ id: session.id, start: original.processedUntil, end: original.processedUntil + 30 * 60000, kind: 'away', evidence: 'self-report' }]);
  world.quietSession = null;
  remember(world, { id: session.id, at: now, kind: 'growth', title: '30分、そっと見守ってくれた。', detail: 'あなたの自己申告で、30分の休息を記録しました。元気と住処が回復し、できるぶんだけ作業も進みました。' });
  return world;
}
