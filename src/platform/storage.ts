import type { Material, World } from '../domain/model.js';
import { DESTINATIONS, RECIPES } from '../domain/catalog.js';
export const STORAGE_KEY = 'tamago.world.v1';
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function isWorld(v: unknown): v is World {
  if (!v || typeof v !== 'object') return false;
  const w = v as World;
  return w.version === 1 && w.mode === 'demo' && Number.isSafeInteger(w.revision) && w.revision >= 0
    && finite(w.vitality) && w.vitality <= 100 && finite(w.habitat) && w.habitat <= 100
    && finite(w.growthMinutes) && Number.isSafeInteger(w.processedUntil) && w.processedUntil >= 0
    && !!w.inventory && (['wood','cloth','glass','seed'] as Material[]).every(k => Number.isSafeInteger(w.inventory[k]) && w.inventory[k] >= 0)
    && DESTINATIONS.some(d => d.id === w.destination) && finite(w.expeditionMinutes)
    && w.expeditionMinutes < DESTINATIONS.find(d => d.id === w.destination)!.minutes
    && Number.isSafeInteger(w.expeditionCount) && w.expeditionCount >= 0
    && Array.isArray(w.built) && new Set(w.built).size === w.built.length && w.built.every(id => RECIPES.some(r => r.id === id))
    && (w.crafting === null || (!!w.crafting && RECIPES.some(r => r.id === w.crafting!.recipeId && finite(w.crafting!.minutes) && w.crafting!.minutes < r.minutes) && !w.built.includes(w.crafting.recipeId)))
    && (w.quietSession == null || (typeof w.quietSession.id === 'string' && typeof w.quietSession.purpose === 'string' && Number.isSafeInteger(w.quietSession.startedAt) && w.quietSession.startedAt >= 0 && w.quietSession.endsAt === w.quietSession.startedAt + 1800000))
    && Array.isArray(w.memories) && w.memories.length <= 100 && w.memories.every(m => !!m && typeof m.id === 'string' && typeof m.title === 'string' && typeof m.detail === 'string' && finite(m.at) && ['craft','discovery','growth'].includes(m.kind))
    && Array.isArray(w.seenMemoryIds) && w.seenMemoryIds.every(id => typeof id === 'string');
}
export class WorldRepository {
  constructor(private readonly storage: StorageLike) {}
  load(): World | null {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new Error('保存データを読めません。上書きせず停止しました。'); }
    if (!isWorld(value)) throw new Error('保存データの形式が異なります。上書きせず停止しました。');
    return value;
  }
  save(next: World, expectedRevision: number): World {
    const current = this.load();
    if (current && current.revision !== expectedRevision) throw new Error('別の画面で更新されています。読み直してください。');
    const saved = { ...next, revision: expectedRevision + 1 };
    if (!isWorld(saved)) throw new Error('保存する内容を確認できません');
    // Write failure must reach the UI: never pretend progress has been saved.
    this.storage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return saved;
  }
}
