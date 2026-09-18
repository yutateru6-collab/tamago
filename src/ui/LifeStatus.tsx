import { DESTINATIONS, RECIPES, RULES } from '../domain/catalog';
import type { World } from '../domain/model';

export function LifeStatus({world}: {world:World}) {
  const resting=world.vitality<RULES.workThreshold;
  const recipe=RECIPES.find(item=>item.id===world.crafting?.recipeId);
  const destination=DESTINATIONS.find(item=>item.id===world.destination)!;
  const minutes=recipe?world.crafting!.minutes:world.expeditionMinutes;
  const total=recipe?recipe.minutes:destination.minutes;
  const title=resting?'まずは、ひとやすみ':recipe?`${recipe.name}を制作中`:`${destination.name}を探索中`;
  return <aside className="life-status" aria-label="この子の暮らし" data-activity={resting?'rest':recipe?'craft':'explore'}>
    <span className="eyebrow">この子の暮らし</span><h3>{title}</h3>
    <p>{resting?'元気が戻ったら、つづきに取りかかります。':'30分のお約束のあと「休めた」と伝えると進みます。'}</p>
    {!resting&&<><progress aria-label={recipe?'制作の進み具合':'探索の進み具合'} max={total} value={minutes}/><small>記録した進み具合 {Math.floor(minutes)} / {total}分</small></>}
    {world.built.length>0&&<p className="life-keepsakes">つくったもの：{world.built.map(id=>RECIPES.find(item=>item.id===id)?.name).filter(Boolean).join('・')}</p>}
  </aside>;
}
