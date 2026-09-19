import { RECIPES } from './catalog.js';
import { homeState } from './home.js';
import type { World } from './model.js';

export interface Placement { x: number; y: number; width: number; z: number }
export interface DecorItem {
  id: string; name: string; image: string; wornImage?: string;
  recipe?: string; discoveries?: number; parent?: string;
  slots: Record<string, Placement>; defaultSlot: string;
}
// Percentages of the same 3:4 painting. Child slots follow their parent.
export const DECOR: DecorItem[] = [
  {id:'shelf',name:'宝物の小さな棚',image:'/art/home-shelf.webp',recipe:'shelf',defaultSlot:'wall',slots:{wall:{x:65,y:43,width:30,z:20},low:{x:65,y:49,width:30,z:20}}},
  {id:'hammock',name:'やわらかな寝床',image:'/art/home-hammock.webp',recipe:'hammock',defaultSlot:'beam',slots:{beam:{x:61,y:25,width:36,z:10},lower:{x:61,y:30,width:36,z:10}}},
  {id:'garden',name:'窓辺の小さな庭',image:'/art/home-plant.webp',wornImage:'/art/home-plant-wilt.webp',recipe:'garden',defaultSlot:'stone',slots:{stone:{x:77,y:69,width:18,z:30},near:{x:65,y:72,width:18,z:30}}},
  {id:'treasure-1',name:'はじめての宝物',image:'/art/home-treasure.webp',discoveries:1,parent:'shelf',defaultSlot:'top',slots:{top:{x:18,y:4,width:24,z:21}}},
  {id:'treasure-2',name:'ふたつめの宝物',image:'/art/home-treasure.webp',discoveries:2,parent:'shelf',defaultSlot:'middle',slots:{middle:{x:60,y:34,width:24,z:21}}},
  {id:'treasure-3',name:'みっつめの宝物',image:'/art/home-treasure.webp',discoveries:3,parent:'shelf',defaultSlot:'bottom',slots:{bottom:{x:60,y:63,width:24,z:21}}},
  {id:'field-notes',name:'森の小さな手帖',image:'/art/home-field-notes.webp',discoveries:2,parent:'shelf',defaultSlot:'books',slots:{books:{x:13,y:63,width:37,z:22}}},
];
export function ownsDecor(world: World, item: DecorItem): boolean {
  return item.recipe ? world.built.includes(item.recipe) : world.expeditionCount >= (item.discoveries ?? Infinity);
}
export function decorState(world: World, item: DecorItem, catalog: DecorItem[] = DECOR) {
  const home = homeState(world);
  const crafting = !!item.recipe && item.recipe === world.crafting?.recipeId;
  const recipe = RECIPES.find(r => r.id === item.recipe);
  const progress = crafting && recipe ? world.crafting!.minutes / recipe.minutes : 1;
  const owned = ownsDecor(world,item);
  const hidden = world.decor?.hidden.includes(item.id) ?? false;
  const parent = catalog.find(p => p.id === item.parent);
  const parentVisible = !item.parent || !!parent && ownsDecor(world,parent) && !world.decor?.hidden.includes(parent.id);
  const visible = (owned || crafting) && !hidden && parentVisible;
  const slot = world.decor?.placements[item.id] ?? item.defaultSlot;
  return {owned,crafting,progress,visible,hidden,stage:home.stage,placement:item.slots[slot] ?? item.slots[item.defaultSlot],image:home.stage !== 'warm' && item.wornImage ? item.wornImage : item.image};
}
export function arrangeDecor(original: World, id: string, slot: string | null): World {
  const item = DECOR.find(i => i.id === id);
  if (!item || !ownsDecor(original,item)) throw new Error('まだ手に入れていない飾りです');
  if (slot !== null && !Object.hasOwn(item.slots,slot)) throw new Error('ここには置けません');
  const world = structuredClone(original);
  world.decor ??= {hidden:[],placements:{}};
  world.decor.hidden = world.decor.hidden.filter(key => key !== id);
  if (slot === null) world.decor.hidden.push(id);
  else world.decor.placements[id] = slot;
  return world;
}
