import type { World } from './model.js';

export const HOME_RULES = { dailyLimit: 25, wearPerMinute: .15, repairPerMinute: .75 } as const;
// Fixed Japanese calendar boundaries keep replay independent of the host timezone.
export function homeDay(at: number): string {
  return new Date(at + 9 * 60 * 60000).toISOString().slice(0, 10);
}
export function homeState(world: World) {
  const wear = world.homeCare?.wear ?? 0;
  return {
    wear,
    stage: wear >= 75 ? 'empty' : wear >= 45 ? 'damaged' : wear >= 20 ? 'faded' : 'warm',
    repairMinutes: Math.ceil(wear / HOME_RULES.repairPerMinute),
    treasureCount: Math.max(0, Math.min(3, world.expeditionCount) - Math.floor(wear / 25)),
    dailyLimitReached: (world.homeCare?.dailyWear ?? 0) >= HOME_RULES.dailyLimit,
  };
}

export function wearHome(world: World, minutes: number, at: number): number {
  const day = homeDay(at);
  const previous = world.homeCare ?? { wear: 0, day, dailyWear: 0 };
  // An older clock cannot reopen an already consumed allowance.
  const dailyWear = day > previous.day ? 0 : previous.dailyWear;
  const added = Math.min(minutes * HOME_RULES.wearPerMinute, HOME_RULES.dailyLimit - dailyWear, 100 - previous.wear);
  world.homeCare = { wear: previous.wear + added, day: day > previous.day ? day : previous.day, dailyWear: dailyWear + added };
  return added;
}
export function repairHome(world: World, minutes: number): number {
  if (!world.homeCare) return 0;
  const spent = Math.min(minutes, world.homeCare.wear / HOME_RULES.repairPerMinute);
  world.homeCare.wear = Math.max(0, world.homeCare.wear - spent * HOME_RULES.repairPerMinute);
  return spent;
}
