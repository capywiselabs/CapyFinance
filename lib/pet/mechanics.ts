export const HP_DECAY_PER_HOUR = 1;
export const HAPPINESS_DECAY_PER_HOUR = 2;
export const HUNGER_INCREASE_PER_HOUR = 3;

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(50 * Math.pow(level - 1, 1.5));
}

export type PetState = {
  hp: number;
  happiness: number;
  hunger: number;
};

export function applyDecay(state: PetState, hoursElapsed: number): PetState {
  if (hoursElapsed <= 0) return state;
  return {
    hp: clamp(state.hp - Math.floor(hoursElapsed * HP_DECAY_PER_HOUR)),
    happiness: clamp(state.happiness - Math.floor(hoursElapsed * HAPPINESS_DECAY_PER_HOUR)),
    hunger: clamp(state.hunger + Math.floor(hoursElapsed * HUNGER_INCREASE_PER_HOUR)),
  };
}
