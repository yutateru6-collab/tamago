import { useCallback, useEffect, useState } from 'react';
import { applyActivity, beginQuiet, completeQuiet, chooseDestination, initialWorld, startCraft } from '../domain/engine';
import type { ActivityKind, World } from '../domain/model';
import { DemoActivityProvider } from '../platform/activity';
import { STORAGE_KEY, SANDBOX_KEY, WorldRepository } from '../platform/storage';
import { arrangeDecor } from '../domain/decor';
import { sandboxPreset, sandboxRest } from '../domain/sandbox';
import { enjoyRestEvent } from '../domain/restEvents';

export function useWorld(sandbox = false) {
  const key = sandbox ? SANDBOX_KEY : STORAGE_KEY;
  const repository = useCallback(() => new WorldRepository(sandbox ? window.sessionStorage : window.localStorage, key),[sandbox,key]);
  const [world, setWorld] = useState<World>(() => initialWorld());
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const reload = useCallback(() => {
    try { const repo = repository(); setWorld(repo.load() ?? initialWorld()); setError(''); setReady(true); }
    catch (e) { setError(e instanceof Error ? e.message : '保存領域を利用できません'); setReady(false); }
  }, [repository]);
  useEffect(() => { reload(); const listener = (e: StorageEvent) => { if (e.key === key) reload(); }; window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener); }, [reload,key]);
  const transact = async (change: (state: World) => World) => {
    if (!ready) return false;
    try {
      const commit = () => {
        const repo = repository();
        const latest = repo.load() ?? world;
        const next = repo.save(change(latest), latest.revision);
        setWorld(next); setError('');
      };
      // Same-origin tabs serialize writes. Native storage will use actual transactions.
      if (navigator.locks) await navigator.locks.request(sandbox ? 'tamago-sandbox-write' : 'tamago-world-write', commit);
      else commit();
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした。容量や設定をご確認ください。'); return false; }
  };
  return { world, ready, error, reload,
    enjoy: (id: string, expectedEnjoyed: number) => transact(w => enjoyRestEvent(w,id,expectedEnjoyed)),
    arrange: (id: string, slot: string | null) => transact(w => arrangeDecor(w,id,slot)),
    preset: (name: string) => sandbox ? transact(() => {const w=sandboxPreset(name);return {...w,seenMemoryIds:w.memories.map(m=>m.id)};}) : Promise.resolve(false),
    restNow: () => sandbox ? transact(sandboxRest) : Promise.resolve(false),
    simulate: (kind: ActivityKind, minutes: number) => transact(w => applyActivity(w, [new DemoActivityProvider().simulate(w, kind, minutes)])),
    beginQuiet: () => transact(w => beginQuiet(w)),
    completeQuiet: () => transact(w => completeQuiet(w)),
    cancelQuiet: () => transact(w => ({ ...w, quietSession: null })),
    reportUsage: () => transact(w => applyActivity(w, [{ id: `usage:${Date.now()}`, start: w.processedUntil, end: w.processedUntil + 30 * 60000, kind: 'usage', evidence: 'self-report', recordedAt: Date.now() }])),
    craft: (id: string) => transact(w => startCraft(w, id)),
    travel: (id: string) => transact(w => chooseDestination(w, id)),
    restore: (backup: World) => transact(() => ({ ...structuredClone(backup), quietSession: null })),
    acknowledge: () => transact(w => ({ ...w, seenMemoryIds: w.memories.map(m => m.id) })),
  };
}
