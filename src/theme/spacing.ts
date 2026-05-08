// base unit 4px. multiply scale value by 4 for px.
const BASE = 4;

const scale = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 56, 72] as const;

export type SpacingScale = (typeof scale)[number];

export const spacing: Record<SpacingScale, number> = scale.reduce(
  (acc, n) => {
    acc[n as SpacingScale] = n * BASE;
    return acc;
  },
  {} as Record<SpacingScale, number>,
);

export const spacingScale = scale;
