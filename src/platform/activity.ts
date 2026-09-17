import type { ActivityKind, ActivityWindow, World } from '../domain/model.js';
export interface ActivityProvider {
  readonly capability: 'demo' | 'native';
  getWindows(since: number): Promise<ActivityWindow[]>;
}
/** No visibilitychange inference. Native iOS/Android providers are a later milestone. */
export class DemoActivityProvider implements ActivityProvider {
  readonly capability = 'demo' as const;
  async getWindows(): Promise<ActivityWindow[]> { return []; }
  simulate(world: World, kind: ActivityKind, minutes: number): ActivityWindow {
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) throw new Error('試す時間が範囲外です');
    return { id: `demo:${world.processedUntil}:${kind}`, start: world.processedUntil, end: world.processedUntil + minutes * 60000, kind, evidence: 'demo' };
  }
}
