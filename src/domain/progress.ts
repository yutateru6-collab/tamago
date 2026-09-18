import { DESTINATIONS, MATERIAL_NAMES, RECIPES } from './catalog.js';
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
    lines.push(newHome.wear === 0 ? '住処のお手入れ：修繕完了。飾りと家具が戻りました。' : `住処のお手入れ：残り約${oldHome.repairMinutes} → ${newHome.repairMinutes}分`);
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
