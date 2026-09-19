import type { Memory } from './model.js';

export const MAX_MEMORIES = 160;
const RECENT_LIMIT = 120;
const milestone = (memory: Memory) =>
  memory.kind === 'craft'
  || memory.id === 'growth:first-thriving'
  || memory.id === 'keepsake:field-notes';

export function retainMemories(memories: Memory[]): Memory[] {
  const recent = memories.slice(0, RECENT_LIMIT);
  const recentIds = new Set(recent.map(memory => memory.id));
  const olderMilestones = memories
    .slice(RECENT_LIMIT)
    .filter(memory => milestone(memory) && !recentIds.has(memory.id));
  return [...recent, ...olderMilestones].slice(0, MAX_MEMORIES);
}

export function prependMemory(memories: Memory[], memory: Memory): Memory[] {
  if (memories.some(item => item.id === memory.id)) return memories;
  return retainMemories([memory, ...memories]);
}
