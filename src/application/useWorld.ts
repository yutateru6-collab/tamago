import { useCallback, useEffect, useState } from 'react';
import { applyActivity, chooseDestination, initialWorld, startCraft } from '../domain/engine';
import type { ActivityKind, World } from '../domain/model';
import { DemoActivityProvider } from '../platform/activity';
import { STORAGE_KEY, WorldRepository } from '../platform/storage';

export function useWorld() {
  const [world, setWorld] = useState<World>(() => initialWorld());
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const reload = useCallback(() => {
    try { const repo = new WorldRepository(window.localStorage); setWorld(repo.load() ?? initialWorld()); setError(''); setReady(true); }
    catch (e) { setError(e instanceof Error ? e.message : '保存領域を利用できません'); setReady(false); }
  }, []);
  useEffect(() => { reload(); const listener = (e: StorageEvent) => { if (e.key === STORAGE_KEY) reload(); }; window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener); }, [reload]);
  const transact = async (change: (state: World) => World) => {
    if (!ready) return;
    try {
      const commit = () => {
        const repo = new WorldRepository(window.localStorage);
        const latest = repo.load() ?? world;
        const next = repo.save(change(latest), latest.revision);
        setWorld(next); setError('');
      };
      // Same-origin tabs serialize writes. Native storage will use actual transactions.
      if (navigator.locks) await navigator.locks.request('tamago-world-write', commit);
      else commit();
    } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした。容量や設定をご確認ください。'); }
  };
  return { world, ready, error, reload,
    simulate: (kind: ActivityKind, minutes: number) => transact(w => applyActivity(w, [new DemoActivityProvider().simulate(w, kind, minutes)])),
    craft: (id: string) => transact(w => startCraft(w, id)),
    travel: (id: string) => transact(w => chooseDestination(w, id)),
    acknowledge: () => transact(w => ({ ...w, seenMemoryIds: w.memories.map(m => m.id) })),
  };
}
