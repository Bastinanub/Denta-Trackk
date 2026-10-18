import type { ToothSurface } from './types';

// FDI two-digit notation. Each quadrant + position produces a tooth number.
// Data-driven: generate the full permanent dentition from quadrant definitions.

export interface ToothMeta {
  number: number;
  quadrant: 1 | 2 | 3 | 4;
  arch: 'upper' | 'lower';
  side: 'right' | 'left';
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
}

const QUADRANTS = [
  { q: 1 as const, arch: 'upper' as const, side: 'right' as const },
  { q: 2 as const, arch: 'upper' as const, side: 'left' as const },
  { q: 3 as const, arch: 'lower' as const, side: 'left' as const },
  { q: 4 as const, arch: 'lower' as const, side: 'right' as const },
];

function toothType(pos: number): ToothMeta['type'] {
  if (pos <= 2) return 'incisor';
  if (pos === 3) return 'canine';
  if (pos <= 5) return 'premolar';
  return 'molar';
}

function buildFdiTeeth(): ToothMeta[] {
  const teeth: ToothMeta[] = [];
  for (const { q, arch, side } of QUADRANTS) {
    for (let pos = 1; pos <= 8; pos++) {
      teeth.push({ number: q * 10 + pos, quadrant: q, arch, side, type: toothType(pos) });
    }
  }
  return teeth;
}

const ALL = buildFdiTeeth();

export const UPPER_TEETH: ToothMeta[] = [
  ...ALL.filter((t) => t.arch === 'upper' && t.side === 'left').sort((a, b) => b.number - a.number),
  ...ALL.filter((t) => t.arch === 'upper' && t.side === 'right').sort((a, b) => a.number - b.number),
];

export const LOWER_TEETH: ToothMeta[] = [
  ...ALL.filter((t) => t.arch === 'lower' && t.side === 'left').sort((a, b) => a.number - b.number),
  ...ALL.filter((t) => t.arch === 'lower' && t.side === 'right').sort((a, b) => b.number - a.number),
];

export const TOOTH_SURFACES: { value: ToothSurface; label: string }[] = [
  { value: 'mesial', label: 'Mesial' },
  { value: 'distal', label: 'Distal' },
  { value: 'occlusal', label: 'Occlusal' },
  { value: 'buccal', label: 'Buccal' },
  { value: 'lingual', label: 'Lingual' },
];
