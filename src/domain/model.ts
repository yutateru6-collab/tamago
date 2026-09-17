export type Condition = 'weary' | 'recovering' | 'thriving';
export type Material = 'wood' | 'cloth' | 'glass' | 'seed';
export type ActivityKind = 'away' | 'usage' | 'unknown';
export type Evidence = 'demo' | 'os';
export interface ActivityWindow { id: string; start: number; end: number; kind: ActivityKind; evidence: Evidence }
export interface Memory { id: string; at: number; title: string; detail: string; kind: 'discovery' | 'craft' | 'growth' }
export interface World {
  version: 1; revision: number; mode: 'demo'; vitality: number; habitat: number;
  growthMinutes: number; processedUntil: number; inventory: Record<Material, number>;
  destination: string; expeditionMinutes: number; expeditionCount: number;
  crafting: { recipeId: string; minutes: number } | null;
  built: string[]; memories: Memory[]; seenMemoryIds: string[];
}
export interface Recipe { id: string; name: string; description: string; minutes: number; cost: Partial<Record<Material, number>> }
