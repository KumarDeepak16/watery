export type GradientStops = readonly [string, string, ...string[]];

export const gradientPresets: Record<
  | 'oceanDawn'
  | 'deepSea'
  | 'midnightWater'
  | 'sunriseHydration'
  | 'neonAqua',
  GradientStops
> = {
  // soft cyan -> sky blue dawn
  oceanDawn: ['#A5F3FC', '#67E8F9', '#0EA5E9'],
  // teal -> deep ocean
  deepSea: ['#0E7490', '#075985', '#082F49'],
  // dark blue with cyan accent
  midnightWater: ['#0A0E1A', '#10141F', '#0E7490'],
  // peach -> aqua morning hydration
  sunriseHydration: ['#FED7AA', '#FDBA74', '#22D3EE', '#0EA5E9'],
  // electric neon
  neonAqua: ['#22D3EE', '#06B6D4', '#0891B2'],
};

export type GradientName = keyof typeof gradientPresets;
