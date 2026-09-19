import type { Material, World } from '../domain/model.js';
import { DESTINATIONS, RECIPES } from '../domain/catalog.js';
import { DECOR } from '../domain/decor.js';
import { REST_EVENTS } from '../domain/restEvents.js';
import { MAX_MEMORIES } from '../domain/memories.js';
export const STORAGE_KEY = 'tamago.world.v1';
export const SANDBOX_KEY = 'tamago.sandbox.v1';
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function isWorld(v: unknown): v is World {
  if (!v || typeof v !== 'object') return false;
  const w = v as World;
  return w.version === 1 && w.mode === 'demo' && Number.isSafeInteger(w.revision) && w.revision >= 0
    && (w.restEvents === undefined || (!!w.restEvents && Number.isSafeInteger(w.restEvents.minutes) && w.restEvents.minutes >= 0 && w.restEvents.minutes % 30 === 0 && !!w.restEvents.enjoyed && typeof w.restEvents.enjoyed === 'object' && !Array.isArray(w.restEvents.enjoyed) && Object.entries(w.restEvents.enjoyed).every(([id,count]) => REST_EVENTS.some(e=>e.id===id && Number.isSafeInteger(count) && count >= 0 && count <= Math.floor(w.restEvents!.minutes/e.minutes)))))
    && (w.decor === undefined || (!!w.decor && Array.isArray(w.decor.hidden) && w.decor.hidden.every(id => DECOR.some(item => item.id === id)) && !!w.decor.placements && typeof w.decor.placements === 'object' && !Array.isArray(w.decor.placements) && Object.entries(w.decor.placements).every(([id,slot]) => DECOR.some(item => item.id === id && Object.hasOwn(item.slots,slot)))))
    && (w.homeCare === undefined || (!!w.homeCare && finite(w.homeCare.wear) && w.homeCare.wear <= 100 && finite(w.homeCare.dailyWear) && w.homeCare.dailyWear <= 25 && typeof w.homeCare.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.homeCare.day)))
    && finite(w.vitality) && w.vitality <= 100 && finite(w.habitat) && w.habitat <= 100
    && finite(w.growthMinutes) && Number.isSafeInteger(w.processedUntil) && w.processedUntil >= 0
    && !!w.inventory && (['wood','cloth','glass','seed'] as Material[]).every(k => Number.isSafeInteger(w.inventory[k]) && w.inventory[k] >= 0)
    && DESTINATIONS.some(d => d.id === w.destination) && finite(w.expeditionMinutes)
    && w.expeditionMinutes < DESTINATIONS.find(d => d.id === w.destination)!.minutes
    && Number.isSafeInteger(w.expeditionCount) && w.expeditionCount >= 0
    && Array.isArray(w.built) && new Set(w.built).size === w.built.length && w.built.every(id => RECIPES.some(r => r.id === id))
    && (w.crafting === null || (!!w.crafting && RECIPES.some(r => r.id === w.crafting!.recipeId && finite(w.crafting!.minutes) && w.crafting!.minutes < r.minutes) && !w.built.includes(w.crafting.recipeId)))
    && (w.quietSession == null || (typeof w.quietSession.id === 'string' && typeof w.quietSession.purpose === 'string' && Number.isSafeInteger(w.quietSession.startedAt) && w.quietSession.startedAt >= 0 && w.quietSession.endsAt === w.quietSession.startedAt + 1800000))
    && Array.isArray(w.memories) && w.memories.length <= MAX_MEMORIES && w.memories.every(m => !!m && typeof m.id === 'string' && typeof m.title === 'string' && typeof m.detail === 'string' && finite(m.at) && ['craft','discovery','growth','event'].includes(m.kind))
    && Array.isArray(w.seenMemoryIds) && w.seenMemoryIds.every(id => typeof id === 'string');
}
export const MAX_BACKUP_BYTES = 1_000_000;
type WorldBackup = { format: 'tamago-backup'; version: 1; exportedAt: number; world: World };

export function createBackup(world: World, now = Date.now()): string {
  const backup: WorldBackup = { format: 'tamago-backup', version: 1, exportedAt: now, world };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(raw: string): World {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error('バックアップが大きすぎます。1MB未満のファイルを選んでください。');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('バックアップを読めません。JSONファイルを確認してください。'); }
  if (!value || typeof value !== 'object') throw new Error('tamagoのバックアップではありません。');
  const backup = value as Partial<WorldBackup> & { version?: unknown };
  if (backup.format !== 'tamago-backup') throw new Error('tamagoのバックアップではありません。');
  if (backup.version !== 1) throw new Error('このバックアップの版にはまだ対応していません。現在の記録は変更していません。');
  if (!Number.isSafeInteger(backup.exportedAt) || (backup.exportedAt as number) < 0 || !isWorld(backup.world)) throw new Error('バックアップの内容を確認できません。現在の記録は変更していません。');
  return structuredClone(backup.world);
}

export class WorldRepository {
  constructor(private readonly storage: StorageLike, private readonly key = STORAGE_KEY) {}
  load(): World | null {
    const raw = this.storage.getItem(this.key);
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
    this.storage.setItem(this.key, JSON.stringify(saved));
    return saved;
  }
}
