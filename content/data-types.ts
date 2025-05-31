const defenseLevels = ['easy', 'medium', 'hard', 'impossible'] as const;
const sizes = ['small', 'medium', 'large', 'huge'] as const;

export type DefenseLevel = (typeof defenseLevels)[number];
export type Size = (typeof sizes)[number];
