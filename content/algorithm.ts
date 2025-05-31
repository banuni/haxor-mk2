import { DefenseLevel, Size } from '../../types';

const algorithmNames = ['alpha', 'beta', 'gamma', 'delta'] as const;

const baseMapping: Record<(typeof algorithmNames)[number], { secondsToComplete: number; probability: number }> = {
  alpha: { secondsToComplete: 5, probability: 0.5 },
  beta: { secondsToComplete: 8, probability: 0.8 },
  gamma: { secondsToComplete: 9, probability: 0.1 },
  delta: { secondsToComplete: 12, probability: 0.9 },
};

const getTargetBonuses = (targetName: string): [number, number] => {
  if (targetName.toLowerCase().startsWith('budner')) {
    return [5, -0.1];
  }
  if (targetName.toLowerCase().startsWith('nuni')) {
    return [-2, 0.05];
  }
  return [0, 0];
};

const getAlgorithmResult = (algorithmName: string, distance: number, defLevel: DefenseLevel, size: Size) => {
  const difficultyMultiplier = defLevel === 'easy' ? 1 : defLevel === 'medium' ? 2 : defLevel === 'hard' ? 3 : 4;
  const sizeMultiplier = size === 'small' ? 1 : size === 'medium' ? 2 : size === 'large' ? 3 : 4;
  const distanceMultiplier = Math.min(10, Math.max(1, distance / 1000));

  const { secondsToComplete: baseSecondsToComplete, probability: baseProbability } = baseMapping[algorithmName as (typeof algorithmNames)[number]];

  const secondsToComplete = baseSecondsToComplete * difficultyMultiplier * sizeMultiplier * distanceMultiplier;
  const successPower = baseProbability * difficultyMultiplier * sizeMultiplier * distanceMultiplier;
  const probability = Math.min(1, Math.max(0, 1 / successPower));
  return { secondsToComplete, probability };
};

export { getAlgorithmResult };

export const randomProbability = (level: 'easy' | 'medium' | 'hard'): number => {
  const randomNumber = Math.random();
  const multiplier = level === 'easy' ? 0.8 : level === 'medium' ? 0.5 : level === 'hard' ? 0.1 : 1;
  return Number(Math.min(1, Math.max(0, randomNumber * multiplier)).toFixed(3));
};

export const randomSecondsToComplete = (level: 'easy' | 'medium' | 'hard'): number => {
  // randomize a base time between 30 and 120
  const baseTime = Math.floor(Math.random() * 90) + 30;
  // multiply by difficulty multiplier (1, 2, 5, 20)
  const difficultyMultiplier = level === 'easy' ? 1 : level === 'medium' ? 2 : level === 'hard' ? 5 : 20;
  return baseTime * difficultyMultiplier;
};
