import { applyActivity, beginQuiet, completeQuiet, initialWorld, startCraft } from './engine.js';
import type { World } from './model.js';

export function sandboxRest(world: World): World {
  const pending = world.quietSession ? world : beginQuiet(world);
  return completeQuiet(pending,pending.quietSession!.endsAt);
}
export function sandboxPreset(name: string): World {
  const initial = initialWorld();
  const advance = (w: World, minutes: number) => applyActivity(w,[{id:`preview:${w.processedUntil}`,start:w.processedUntil,end:w.processedUntil+minutes*60000,kind:'away',evidence:'demo'}]);
  if (name === 'initial') return initial;
  if (['rest30','rest60','rest120'].includes(name)) {
    let world = initial;
    for (let i=0;i<Number(name.slice(4))/30;i++) world = sandboxRest(world);
    return world;
  }
  if (name === 'half') return advance(startCraft(initial,'shelf'),30);
  const shelf = advance(startCraft(initial,'shelf'),60);
  if (name === 'shelf') return shelf;
  const finds = advance(shelf,120);
  if (name === 'finds') return finds;
  const cloth = advance({...finds,destination:'workshop'},90);
  const bed = advance(startCraft(cloth,'hammock'),90);
  const full = advance(startCraft(bed,'garden'),120);
  if (name === 'full') return full;
  const wear = ({faded:25,damaged:50,empty:75} as Record<string,number>)[name];
  if (wear === undefined) throw new Error('確認する状態が見つかりません');
  return {...full,homeCare:{wear,day:new Date().toISOString().slice(0,10),dailyWear:25}};
}
