const REGISTRY_KEY = 'missing_foods_registry';

export interface MissingFood {
  name: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export function readMissingFoods(): MissingFood[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((f): f is MissingFood => !!f && typeof f.name === 'string' && typeof f.count === 'number')
      : [];
  } catch {
    return [];
  }
}

/** Silently remembers foods the database lacks, so they can be added in bulk to a future release. */
export function recordMissingFoods(names: string[]) {
  if (names.length === 0) return;
  const now = new Date().toISOString();
  const registry = new Map(readMissingFoods().map((f) => [f.name.toLowerCase(), f]));
  for (const raw of names) {
    const name = raw.trim().slice(0, 80);
    if (name.length < 2) continue;
    const key = name.toLowerCase();
    const existing = registry.get(key);
    registry.set(key, existing ? { ...existing, count: existing.count + 1, lastSeen: now } : { name, count: 1, firstSeen: now, lastSeen: now });
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
  const lines = sorted.map((f) => `${f.name}\t${f.count}\t${f.lastSeen.slice(0, 10)}`);
  return [`Alimenti sconosciuti NutriPlan (${sorted.length})`, 'nome\tvolte\tultima volta', ...lines].join('\n');
}
