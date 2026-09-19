import type { CSSProperties } from 'react';
import type { World } from '../domain/model';
import { homeState } from '../domain/home';
import { DECOR, decorState, type DecorItem } from '../domain/decor';
import { RECIPES } from '../domain/catalog';

export function HabitatLayers({world, showSlots=false}: {world: World; showSlots?: boolean}) {
  const home = homeState(world);
  const recipe = RECIPES.find(r => r.id === world.crafting?.recipeId);
  const render = (item: DecorItem) => {
    const state = decorState(world,item);
    if (!state.visible) return null;
    const p = state.placement;
    const style: CSSProperties = {left:`${p.x}%`,top:`${p.y}%`,width:`${p.width}%`,zIndex:p.z};
    const label = state.crafting ? `${item.name}を制作中 ${Math.floor(state.progress*100)}%` : `${item.name}${home.wear>0?'（お手入れ待ち）':''}`;
    return <div key={item.id} className={`decor-item ${state.crafting?'decor-building':''} ${item.id.startsWith('treasure')?'home-treasure':''}`} data-decor={item.id} data-testid={`home-${item.id==='garden'?'plant':item.id}${state.crafting?'-progress':''}`} data-progress={state.progress} style={style}>
      <img src={state.image} alt={label} draggable={false} style={state.crafting?{clipPath:`inset(${Math.round(75*(1-state.progress))}% 0 0 0)`}:undefined}/>
      {!state.crafting && DECOR.filter(child=>child.parent===item.id).map(render)}
    </div>;
  };
  return <div className="habitat-layers" data-home-stage={home.stage} aria-label={home.wear>0?'お手入れが必要な住処。つくったものは残っています。':'お手入れされた住処。'}>
    {DECOR.filter(item=>!item.parent).map(render)}
    {showSlots && DECOR.filter(item=>!item.parent).flatMap(item=>Object.entries(item.slots).map(([key,p])=><div className="decor-slot" key={`${item.id}:${key}`} style={{left:`${p.x}%`,top:`${p.y}%`,width:`${p.width}%`}}>{item.name} · {key}</div>))}
    <div className="home-atmosphere"/>
    <span className="home-scene-note">{recipe?`${recipe.id==='shelf'?'小さな棚':recipe.name}を制作中 · ${Math.floor(world.crafting!.minutes/recipe.minutes*100)}%`:home.wear>0?'つくったものを、また元気に':world.built.length?`暮らしに、${world.built.length}つの手づくり`:'ここから、暮らしをつくろう'}</span>
  </div>;
}
