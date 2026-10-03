const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const RAMPS = {
  emerald: 'ecfdf5 d1fae5 a7f3d0 6ee7b7 34d399 10b981 059669 047857 065f46 064e3b 022c22',
  teal: 'f0fdfa ccfbf1 99f6e4 5eead4 2dd4bf 14b8a6 0d9488 0f766e 115e59 134e4a 042f2e',
  blue: 'eff6ff dbeafe bfdbfe 93c5fd 60a5fa 3b82f6 2563eb 1d4ed8 1e40af 1e3a8a 172554',
  sky: 'f0f9ff e0f2fe bae6fd 7dd3fc 38bdf8 0ea5e9 0284c7 0369a1 075985 0c4a6e 082f49',
  green: 'f0fdf4 dcfce7 bbf7d0 86efac 4ade80 22c55e 16a34a 15803d 166534 14532d 052e16',
  lime: 'f7fee7 ecfccb d9f99d bef264 a3e635 84cc16 65a30d 4d7c0f 3f6212 365314 1a2e05',
  orange: 'fff7ed ffedd5 fed7aa fdba74 fb923c f97316 ea580c c2410c 9a3412 7c2d12 431407',
  amber: 'fffbeb fef3c7 fde68a fcd34d fbbf24 f59e0b d97706 b45309 92400e 78350f 451a03',
  rose: 'fff1f2 ffe4e6 fecdd3 fda4af fb7185 f43f5e e11d48 be123c 9f1239 881337 4c0519',
  red: 'fef2f2 fee2e2 fecaca fca5a5 f87171 ef4444 dc2626 b91c1c 991b1b 7f1d1d 450a0a',
  cyan: 'ecfeff cffafe a5f3fc 67e8f9 22d3ee 06b6d4 0891b2 0e7490 155e75 164e63 083344',
  slate: 'f8fafc f1f5f9 e2e8f0 cbd5e1 94a3b8 64748b 475569 334155 1e293b 0f172a 020617',
  zinc: 'fafafa f4f4f5 e4e4e7 d4d4d8 a1a1aa 71717a 52525b 3f3f46 27272a 18181b 09090b',
  pink: 'fdf2f8 fce7f3 fbcfe8 f9a8d4 f472b6 ec4899 db2777 be185d 9d174d 831843 500724',
  yellow: 'fefce8 fef9c3 fef08a fde047 facc15 eab308 ca8a04 a16207 854d0e 713f12 422006',
  stone: 'fafaf9 f5f5f4 e7e5e4 d6d3d1 a8a29e 78716c 57534e 44403c 292524 1c1917 0c0a09',
};

type Ramp = keyof typeof RAMPS;

/** Neutral ramp tint: hue in degrees, saturation in % for the light and dark ends. */
interface NeutralTint {
  hue: number;
  satLight: number;
  satDark: number;
  black?: boolean;
}

export interface Palette {
  id: string;
  name: string;
  primary: Ramp;
  secondary: Ramp;
  accent: Ramp;
  neutral: NeutralTint;
  amoled?: boolean;
}

export const PALETTES: Palette[] = [
  { id: 'smeraldo', name: 'Smeraldo', primary: 'emerald', secondary: 'teal', accent: 'amber', neutral: { hue: 220, satLight: 14, satDark: 18 } },
  { id: 'oceano', name: 'Oceano', primary: 'blue', secondary: 'sky', accent: 'orange', neutral: { hue: 215, satLight: 30, satDark: 42 } },
  { id: 'petrolio', name: 'Petrolio', primary: 'cyan', secondary: 'teal', accent: 'rose', neutral: { hue: 195, satLight: 28, satDark: 45 } },
  { id: 'foresta', name: 'Foresta', primary: 'green', secondary: 'lime', accent: 'amber', neutral: { hue: 150, satLight: 16, satDark: 28 } },
  { id: 'tramonto', name: 'Tramonto', primary: 'orange', secondary: 'amber', accent: 'sky', neutral: { hue: 20, satLight: 22, satDark: 22 } },
  { id: 'rubino', name: 'Rubino', primary: 'rose', secondary: 'pink', accent: 'amber', neutral: { hue: 345, satLight: 18, satDark: 24 } },
  { id: 'corallo', name: 'Corallo', primary: 'red', secondary: 'orange', accent: 'teal', neutral: { hue: 10, satLight: 16, satDark: 18 } },
  { id: 'oro', name: 'Oro', primary: 'amber', secondary: 'yellow', accent: 'cyan', neutral: { hue: 35, satLight: 18, satDark: 16 } },
  { id: 'menta', name: 'Menta', primary: 'teal', secondary: 'emerald', accent: 'pink', neutral: { hue: 170, satLight: 20, satDark: 30 } },
  { id: 'minimal', name: 'Minimal', primary: 'zinc', secondary: 'slate', accent: 'zinc', neutral: { hue: 0, satLight: 0, satDark: 0 } },
  { id: 'amoled', name: 'AMOLED', primary: 'sky', secondary: 'cyan', accent: 'lime', neutral: { hue: 210, satLight: 8, satDark: 10, black: true }, amoled: true },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: 'pink', secondary: 'cyan', accent: 'yellow', neutral: { hue: 265, satLight: 12, satDark: 30, black: true }, amoled: true },
];

export const DEFAULT_PALETTE = 'smeraldo';

const NEUTRAL_LIGHTNESS = [98, 96, 91, 84, 65, 46, 34, 26, 17, 11, 6];

export function getPalette(id: string | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function hslToRgb(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => Math.round(255 * (lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `${f(0)} ${f(8)} ${f(4)}`;
}

function neutralRamp(t: NeutralTint): string[] {
  return NEUTRAL_LIGHTNESS.map((l, i) => {
    const sat = i < 5 ? t.satLight : t.satDark;
    let light = l;
    if (t.black && i >= 8) light = [7, 3, 0][i - 8];
    return hslToRgb(t.hue, sat, light);
  });
}

export function paletteSwatch(p: Palette): { bg: string; ui: string; primary: string; accent: string } {
  const n = neutralRamp(p.neutral);
  const rgb = (v: string) => `rgb(${v.replace(/ /g, ',')})`;
  return {
    bg: rgb(n[10]),
    ui: rgb(n[8]),
    primary: `#${RAMPS[p.primary].split(' ')[5]}`,
    accent: `#${RAMPS[p.accent].split(' ')[4]}`,
  };
}

export function applyPalette(palette: Palette) {
  const root = document.documentElement;
  const set = (role: string, values: string[]) => values.forEach((v, i) => root.style.setProperty(`--c-${role}-${SHADES[i]}`, v));
  set('primary', RAMPS[palette.primary].split(' ').map(hexToRgb));
  set('secondary', RAMPS[palette.secondary].split(' ').map(hexToRgb));
  set('accent', RAMPS[palette.accent].split(' ').map(hexToRgb));
  set('gray', neutralRamp(palette.neutral));
}
