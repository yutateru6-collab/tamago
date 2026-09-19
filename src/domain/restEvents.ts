import type { World } from './model.js';
import { prependMemory } from './memories.js';

// Each confirmed minute contributes to every event. Unused invitations never expire.
export const REST_EVENTS = [
  { id: 'snack', name: '木の実のおやつ', minutes: 30, action: 'おやつを分ける', invitation: '甘い木の実を、小さな器に。ふたりで半分こしよう。', result: '木の実を半分こ。小さな器は空っぽになり、この子は満足そうにひと息。' },
  { id: 'tea', name: 'こもれびのお茶', minutes: 60, action: 'お茶を淹れる', invitation: '葉っぱのお茶を淹れて、水音を聞きながらひと息。', result: 'ふたつのカップに、あたたかいお茶。湯気の向こうで、ゆっくり同じ時間を過ごしました。' },
  { id: 'picnic', name: '水辺のピクニック', minutes: 120, action: 'お弁当をひらく', invitation: 'いつもの水辺に、小さなお弁当。パンと木の実を広げよう。', result: '水音を聞きながら、お弁当を半分こ。いつもの住処が、今日は小さなピクニックの場所になりました。' },
] as const;
export type RestEventId = typeof REST_EVENTS[number]['id'];
export function restEventState(world: World, id: RestEventId) {
  const event = REST_EVENTS.find(e => e.id === id)!;
  const minutes = world.restEvents?.minutes ?? 0;
  const enjoyed = world.restEvents?.enjoyed[id] ?? 0;
  return { event, minutes, enjoyed, available: Math.floor(minutes / event.minutes) - enjoyed,
    progress: minutes % event.minutes, remaining: event.minutes - minutes % event.minutes };
}
export function creditRestEvents(world: World, minutes: number): World {
  return { ...world, restEvents: { minutes: (world.restEvents?.minutes ?? 0) + minutes, enjoyed: { ...world.restEvents?.enjoyed } } };
}
export function newlyAvailableEvents(before: World, after: World) {
  return REST_EVENTS.filter(e => restEventState(after,e.id).available > restEventState(before,e.id).available);
}
export function enjoyRestEvent(original: World, id: string, expectedEnjoyed: number, now = Date.now()): World {
  const event = REST_EVENTS.find(e => e.id === id);
  if (!event) throw new Error('このお楽しみは見つかりません');
  const state = restEventState(original,event.id);
  if (state.available < 1) throw new Error('休息を重ねると、一緒に楽しめます');
  if (state.enjoyed !== expectedEnjoyed) throw new Error('このお楽しみは記録済みです。一度閉じて、確認してください');
  const world = structuredClone(original);
  world.restEvents = { minutes: state.minutes, enjoyed: { ...world.restEvents?.enjoyed, [id]: state.enjoyed + 1 } };
  const memory = { id: `event:${id}:${state.enjoyed+1}`, at: now, kind: 'event' as const, title: `${event.name}を、一緒に。`, detail: event.result };
  world.memories = prependMemory(world.memories, memory);
  // The event sheet is the receipt; do not also open a competing return sheet.
  world.seenMemoryIds = [...world.seenMemoryIds, memory.id].filter(key => world.memories.some(m => m.id === key));
  return world;
}
