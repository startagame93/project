const REGISTRY_KEY = 'missing_foods_registry';

export interface MissingFood {
  missingFoodId: string;
  name: string;
  status: 'pending';
  count: number;
  firstSeen: string;
  lastSeen: string;
}

/** Stable identifier derived from the normalized name, so the same food always maps to the same id. */
export function missingFoodIdFor(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `mf-${(hash >>> 0).toString(36)}`;
}

export function readMissingFoods(): MissingFood[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is { name: string; count: number; firstSeen: string; lastSeen: string } =>
        !!f && typeof f.name === 'string' && typeof f.count === 'number')
      .map((f) => ({
        missingFoodId: missingFoodIdFor(f.name),
        name: f.name,
        status: 'pending' as const,
        count: f.count,
        firstSeen: f.firstSeen,
        lastSeen: f.lastSeen,
      }));
  } catch {
    return [];
  }
}

/** Silently remembers foods the database lacks, so they can be added in bulk to a future release. */
export function recordMissingFoods(names: string[]) {
  if (names.length === 0) return;
  const now = new Date().toISOString();
  const registry = new Map(readMissingFoods().map((f) => [f.missingFoodId, f]));
  for (const raw of names) {
    const name = raw.trim().slice(0, 80);
    if (name.length < 2) continue;
    const missingFoodId = missingFoodIdFor(name);
    const existing = registry.get(missingFoodId);
    registry.set(missingFoodId, existing
      ? { ...existing, count: existing.count + 1, lastSeen: now }
      : { missingFoodId, name, status: 'pending', count: 1, firstSeen: now, lastSeen: now });
  }
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify([...registry.values()].slice(-500)));
  } catch {
    // storage full or unavailable
  }
}

export function clearMissingFoods() {
  try {
    localStorage.removeItem(REGISTRY_KEY);
  } catch {
    // storage unavailable
  }
}

export function formatMissingFoods(foods: MissingFood[]): string {
  const sorted = [...foods].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'it'));
  const lines = sorted.map((f) => `${f.missingFoodId}\t${f.name}\t${f.count}\t${f.status}\t${f.lastSeen.slice(0, 10)}`);
  return [`Alimenti sconosciuti NutriPlan (${sorted.length})`, 'id\tnome\tvolte\tstato\tultima volta', ...lines].join('\n');
}
