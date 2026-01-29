export const LANGUAGE = {
  VI: 'vi',
  EN: 'en',
  JP: 'jp',
} as const satisfies Record<string, string>;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];
