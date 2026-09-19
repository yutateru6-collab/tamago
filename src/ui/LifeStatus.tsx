import { DESTINATIONS, RECIPES, RULES } from '../domain/catalog';
import type { World } from '../domain/model';
import { homeState } from '../domain/home';
import { ProjectArt } from './ProjectArt';

export function LifeStatus({world,compact=false}: {world: World;compact?:boolean}) {
  // Match the existing engine's work priority, not the broader scene condition label.
  const resting = world.vitality < RULES.workThreshold;
  const home = homeState(world);
  const repairing = home.wear > 0;
  const recipe = RECIPES.find(item => item.id === world.crafting?.recipeId);
  const destination = DESTINATIONS.find(item => item.id === world.destination)!;
  const minutes = recipe ? world.crafting!.minutes : world.expeditionMinutes;
  const total = recipe ? recipe.minutes : destination.minutes;
  const title = resting ? 'まずは、ひとやすみ' : repairing ? '住処を、少しずつお手入れ' : recipe ? `${recipe.name}を制作中` : `${destination.name}を探索中`;
  const percent = Math.min(100, Math.floor(minutes / total * 100));
  if (compact) return <aside className="life-status compact-life" aria-label="この子の暮らし" data-activity={resting?'rest':repairing?'repair':recipe?'craft':'explore'}>
    <span className="eyebrow">いま、この子は</span><h3>{title}</h3>
    {!resting&&!repairing&&<><progress aria-label={recipe?'制作の進み具合':'探索の進み具合'} max={total} value={minutes}/><small>{percent}% · 途中の進み具合は残ります</small></>}
    {repairing&&<small>元気が戻ってから、お手入れに約{home.repairMinutes}分</small>}
  </aside>;
  return <aside className="life-status" aria-label="この子の暮らし" data-activity={resting ? 'rest' : repairing ? 'repair' : recipe ? 'craft' : 'explore'}>
    <span className="eyebrow">この子の暮らし</span><h3>{title}</h3>
    <p>{resting ? 'まず元気を回復。そのあと、お手入れ・制作・探索の順で進みます。' : repairing ? 'つくったものは消えていません。休息でお手入れして、また飾れます。' : '30分のお約束のあと「休めた」と伝えると進みます。'}</p>
    {repairing && <p className="repair-note">元気が戻ったあとのお手入れ：残り約{home.repairMinutes}分。材料の追加は不要です。</p>}
    {(!resting && !repairing || recipe) && <div className="saved-project">
      {recipe && <ProjectArt recipeId={recipe.id}/>}
      <div><span className="saved-project-label">{resting || repairing ? '制作のつづきは保存済み' : 'ここまで、できています'}</span>
        <strong>{percent}%</strong>
        <progress aria-label={recipe ? '制作の進み具合' : '探索の進み具合'} max={total} value={minutes}/>
        <small>記録した進み具合 {Math.floor(minutes)} / {total}分</small>
      </div>
    </div>}
    <p className="life-order">回復 → お手入れ → 制作 → 探索<br/><span>必要なものから、ひとつずつ。途中の進み具合も残ります。</span></p>
    {world.built.length > 0 && <p className="life-keepsakes">つくったもの：{world.built.map(id => RECIPES.find(item => item.id === id)?.name).filter(Boolean).join('・')}</p>}
  </aside>;
}
