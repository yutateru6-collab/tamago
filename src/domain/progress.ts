import { DESTINATIONS, MATERIAL_NAMES, RECIPES, RULES } from './catalog.js';
import { homeState } from './home.js';
import type { Material, World } from './model.js';

const number = (value: number) => String(Math.round(value * 10) / 10);
/** Describe two actual states. This never simulates time, awards progress or mutates either state.
 * The text is stored in the existing Memory.detail together with the confirmed rest transaction.
 * A reload therefore shows the original outcome, not a recalculation from the current world. */
export function describeQuietProgress(before: World, after: World): string {
  const lines = ['あなたの自己申告で、30分の休息を記録しました。'];
  if (after.vitality > before.vitality) lines.push(`この子の元気：${number(before.vitality)} → ${number(after.vitality)} / 100`);
  if (after.habitat > before.habitat) lines.push(`住処の心地よさ：${number(before.habitat)} → ${number(after.habitat)} / 100`);
  let workChanged = false;
  const oldHome = homeState(before), newHome = homeState(after);
  if (newHome.wear < oldHome.wear) {
    workChanged = true;
    lines.push(newHome.wear === 0 ? '住処のお手入れ：修繕完了。住処を整えました。' : `住処のお手入れ：残り約${oldHome.repairMinutes} → ${newHome.repairMinutes}分`);
  }
  for (const id of after.built.filter(id => !before.built.includes(id))) {
    const recipe = RECIPES.find(item => item.id === id);
    if (recipe) { workChanged = true; lines.push(`${recipe.name}：完成。住処に置かれました。`); }
  }
  if (before.crafting && after.crafting?.recipeId === before.crafting.recipeId && after.crafting.minutes > before.crafting.minutes) {
    const recipe = RECIPES.find(item => item.id === after.crafting!.recipeId)!;
    workChanged = true;
    lines.push(`${recipe.name}：${number(before.crafting.minutes)} → ${number(after.crafting.minutes)} / ${recipe.minutes}分（${Math.floor(after.crafting.minutes / recipe.minutes * 100)}%）`);
  }
  const discoveries = after.expeditionCount - before.expeditionCount;
  const destination = DESTINATIONS.find(item => item.id === after.destination)!;
  if (discoveries > 0) {
    workChanged = true;
    lines.push(`${destination.name}の探索：${discoveries}回ぶんの拾い物。`);
    if (after.expeditionMinutes > 0) lines.push(`次の探索：${number(after.expeditionMinutes)} / ${destination.minutes}分まで進みました。`);
  } else if (after.expeditionMinutes > before.expeditionMinutes) {
    workChanged = true;
    lines.push(`${destination.name}の探索：${number(before.expeditionMinutes)} → ${number(after.expeditionMinutes)} / ${destination.minutes}分`);
  }
  const materials = (Object.keys(MATERIAL_NAMES) as Material[]).flatMap(item => {
    const added = after.inventory[item] - before.inventory[item];
    return added > 0 ? [`${MATERIAL_NAMES[item]} +${added}`] : [];
  });
  if (materials.length) lines.push(`見つけた材料：${materials.join('・')}`);
  if (!workChanged) lines.push('今回は元気の回復が進みました。作業のつづきは、元気が戻ってから。');
  return lines.join('\n');
}


export function quietPlan(world: World): { title: string; detail: string } {
  const recoveryMinutes = Math.max(0, (RULES.workThreshold - world.vitality) / RULES.recoveryPerMinute);
  const repairMinutes = homeState(world).repairMinutes;
  const prefix = recoveryMinutes > 0 ? recoveryMinutes : repairMinutes > 0 ? repairMinutes : 0;
  if (recoveryMinutes >= 30) return {
    title: '今回は、元気の回復が中心。',
    detail: `作業できる元気まで、あと約${Math.ceil(recoveryMinutes)}分。次の30分は回復を優先します。`,
  };
  if (repairMinutes > 0) {
    const total = recoveryMinutes + repairMinutes;
    return {
      title: recoveryMinutes > 0 ? '回復してから、住処をお手入れ。' : '今回は、住処のお手入れ。',
      detail: `今の状態なら、お手入れ完了まで約${Math.max(1, Math.ceil(total / 30))}回の30分が目安です。`,
    };
  }
  if (world.crafting) {
    const recipe = RECIPES.find(item => item.id === world.crafting!.recipeId)!;
    const remaining = Math.max(0, recipe.minutes - world.crafting.minutes);
    const total = recoveryMinutes + remaining;
    return {
      title: `${recipe.name}を、少しずつ。`,
      detail: `今の状態なら完成まで約${Math.max(1, Math.ceil(total / 30))}回の30分。あと約${Math.ceil(remaining)}分の制作です。`,
    };
  }
  const destination = DESTINATIONS.find(item => item.id === world.destination)!;
  const remaining = Math.max(0, destination.minutes - world.expeditionMinutes);
  const total = recoveryMinutes + remaining;
  return {
    title: `${destination.name}の探索へ。`,
    detail: `次の拾い物まで約${Math.max(1, Math.ceil(total / 30))}回の30分。あと約${Math.ceil(remaining)}分の探索です。`,
  };
}
