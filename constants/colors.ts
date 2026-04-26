// BarberQ design tokens — premium barbershop, dark first.
// Aesop × Soho House × old-school barber: warm near-black + ivory + gold
// restraint, hairlines instead of shadows.

export const palette = {
  // ── Dark — default ────────────────────────────────────────────────
  bg: '#0E0B08',
  surface: '#1A1410',
  elevated: '#221A14',
  ivory: '#F5EFE6',
  muted: '#A8998A',
  mutedLow: 'rgba(168,153,138,0.55)',
  gold: '#D4AF7A',
  goldDim: 'rgba(212,175,122,0.12)',
  goldBorder: 'rgba(212,175,122,0.18)',
  goldHair: 'rgba(212,175,122,0.10)',
  sage: '#7FB069',
  terra: '#C85450',
  line: 'rgba(212,175,122,0.12)',
  lineSoft: 'rgba(245,239,230,0.08)',

  // ── Light — cream + ink mirror ────────────────────────────────────
  bgLight: '#F8F3EA',
  surfaceLight: '#F2EBDD',
  elevatedLight: '#EFE6D2',
  ink: '#1A1410',
  mutedLight: '#6B5D4E',
  mutedLowLight: 'rgba(107,93,78,0.55)',
  goldLight: '#A88345',
  goldDimLight: 'rgba(168,131,69,0.10)',
  goldBorderLight: 'rgba(168,131,69,0.30)',
  goldHairLight: 'rgba(168,131,69,0.18)',
  sageLight: '#5E8A4C',
  terraLight: '#A03E3A',
  lineLight: 'rgba(26,20,16,0.10)',
  lineSoftLight: 'rgba(26,20,16,0.06)',
} as const;

// `colors` retained as the broad tone bag consumers reach into. Keys mirror
// `palette` so existing imports keep working; the named slate/indigo tokens
// from the old theme are gone.
export const colors = palette;

const dark = {
  // Pre-existing keys (kept so screens compile without churn)
  accent: palette.gold,
  accentMuted: palette.goldDim,
  background: palette.bg,
  border: palette.goldHair,
  card: palette.surface,
  chip: palette.elevated,
  chipBorder: palette.goldBorder,
  color: palette.ivory,
  colorMuted: palette.muted,
  danger: palette.terra,
  info: palette.gold,
  inverseColor: palette.bg,
  primary: palette.gold,
  primaryPress: palette.goldDim,
  statusCancelled: palette.terra,
  statusCompleted: palette.muted,
  statusConfirmed: palette.sage,
  statusPending: palette.gold,
  success: palette.sage,
  surface: palette.surface,
  surfaceMuted: palette.elevated,
  tabBar: palette.bg,
  toastShadow: 'rgba(0, 0, 0, 0.36)',
  warningSurface: '#3A2A1A',

  // BarberQ-native names (preferred from now on)
  bg: palette.bg,
  elevated: palette.elevated,
  ivory: palette.ivory,
  muted: palette.muted,
  mutedLow: palette.mutedLow,
  gold: palette.gold,
  goldDim: palette.goldDim,
  goldBorder: palette.goldBorder,
  goldHair: palette.goldHair,
  sage: palette.sage,
  terra: palette.terra,
  line: palette.line,
  lineSoft: palette.lineSoft,
} as const;

const light = {
  accent: palette.goldLight,
  accentMuted: palette.goldDimLight,
  background: palette.bgLight,
  border: palette.goldHairLight,
  card: palette.surfaceLight,
  chip: palette.elevatedLight,
  chipBorder: palette.goldBorderLight,
  color: palette.ink,
  colorMuted: palette.mutedLight,
  danger: palette.terraLight,
  info: palette.goldLight,
  inverseColor: palette.bgLight,
  primary: palette.goldLight,
  primaryPress: palette.goldDimLight,
  statusCancelled: palette.terraLight,
  statusCompleted: palette.mutedLight,
  statusConfirmed: palette.sageLight,
  statusPending: palette.goldLight,
  success: palette.sageLight,
  surface: palette.surfaceLight,
  surfaceMuted: palette.elevatedLight,
  tabBar: palette.bgLight,
  toastShadow: 'rgba(26, 20, 16, 0.20)',
  warningSurface: palette.elevatedLight,

  bg: palette.bgLight,
  elevated: palette.elevatedLight,
  ivory: palette.ink,
  muted: palette.mutedLight,
  mutedLow: palette.mutedLowLight,
  gold: palette.goldLight,
  goldDim: palette.goldDimLight,
  goldBorder: palette.goldBorderLight,
  goldHair: palette.goldHairLight,
  sage: palette.sageLight,
  terra: palette.terraLight,
  line: palette.lineLight,
  lineSoft: palette.lineSoftLight,
} as const;

export const appThemeColors = { dark, light } as const;
