import type { Material, Recipe } from './model.js';
// All tuning values are provisional. Domain code must not read UI or OS state.
export const RULES = { recoveryPerMinute: .3, decayPerMinute: .5, habitatRecovery: .2, habitatDecay: .35, maxWindowMinutes: 480, workThreshold: 35 } as const;
export const MATERIAL_NAMES: Record<Material, string> = { wood: '木のかけら', cloth: '布きれ', glass: 'ガラス玉', seed: '小さな芽' };
export const DESTINATIONS = [
  { id: 'bridge', name: '苔むす橋', description: '水音のそばに、何かが光っている。', minutes: 60, rewards: { wood: 2, glass: 1 } },
  { id: 'workshop', name: '古い工房', description: '忘れられた道具に、もう一度いのちを。', minutes: 90, rewards: { cloth: 2, seed: 1 } },
] as const;
export const RECIPES: Recipe[] = [
  { id: 'shelf', name: '宝物の小さな棚', description: '拾った木片が、宝物の居場所になる。', minutes: 60, cost: { wood: 2 } },
  { id: 'hammock', name: 'やわらかな寝床', description: '布きれをつなぎ、安心できる場所に。', minutes: 90, cost: { wood: 1, cloth: 2 } },
  { id: 'garden', name: '窓辺の小さな庭', description: '住処のすみに、小さな緑を迎える。', minutes: 120, cost: { wood: 2, seed: 1 } },
];
