const primitiveSpacing = (number: number) => number * 4;

export const radius = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
  full: 9999,
} as const;

export const spacing = Object.assign((value: number) => primitiveSpacing(value), {
  xxs: primitiveSpacing(0.125),
  xs: primitiveSpacing(0.25),
  sm: primitiveSpacing(0.375),
  md: primitiveSpacing(0.5),
  lg: primitiveSpacing(0.625),
  xl: primitiveSpacing(0.75),
  '2xl': primitiveSpacing(1),
  '3xl': primitiveSpacing(1.5),
  '4xl': primitiveSpacing(2),
  '5xl': primitiveSpacing(2.5),
  '6xl': primitiveSpacing(3),
  '7xl': primitiveSpacing(4),
  '8xl': primitiveSpacing(5),
  '9xl': primitiveSpacing(6),
  '10xl': primitiveSpacing(8),
  '11xl': primitiveSpacing(10),
} as const);
