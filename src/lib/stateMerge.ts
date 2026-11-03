type Plain = Record<string, unknown>;
type Identified = Plain & { id: string };

const isPlain = (value: unknown): value is Plain => !!value && typeof value === 'object' && !Array.isArray(value);
const isIdentified = (value: unknown): value is Identified => isPlain(value) && typeof value.id === 'string';

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isPlain(a) && isPlain(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Combines two independent edits of the same value. A side that did not change
 * from the common ancestor yields to the other side, so edits are kept, not overwritten.
 * Without an ancestor, nothing is deleted: entries are unioned and scalar clashes keep local.
 */
export function mergeThreeWay<T>(base: T | undefined, local: T, remote: T): T {
  if (deepEqual(local, remote)) return local;
  if (base !== undefined) {
    if (deepEqual(base, local)) return remote;
    if (deepEqual(base, remote)) return local;
  }
  if (local === undefined) return remote;
  if (remote === undefined) return local;
  if (Array.isArray(local) && Array.isArray(remote)) {
    return mergeArrays(base, local, remote) as T;
  }
  if (isPlain(local) && isPlain(remote)) {
    return mergeObjects(isPlain(base) ? base : undefined, local, remote) as T;
  }
  return local;
}

function mergeObjects(base: Plain | undefined, local: Plain, remote: Plain): Plain {
  const out: Plain = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const value = mergeThreeWay(base?.[key], local[key], remote[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function mergeArrays(base: unknown, local: unknown[], remote: unknown[]): unknown[] {
  const baseItems: unknown[] = Array.isArray(base) ? base : [];
  if ([...baseItems, ...local, ...remote].every(isIdentified)) {
    return mergeById(baseItems as Identified[], local as Identified[], remote as Identified[]);
  }
  if (local.length === remote.length && local.every(isPlain) && remote.every(isPlain)) {
    return local.map((item, i) => mergeThreeWay(baseItems[i], item, remote[i]));
  }
  return local;
}

function mergeById(base: Identified[], local: Identified[], remote: Identified[]): Identified[] {
  const baseById = new Map(base.map((item) => [item.id, item]));
  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteById = new Map(remote.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const out: Identified[] = [];

  for (const item of [...local, ...remote]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const b = baseById.get(item.id);
    const l = localById.get(item.id);
    const r = remoteById.get(item.id);

    if (l && r) {
      out.push(mergeThreeWay(b, l, r));
    } else if (l) {
      const deletedRemotely = b !== undefined && deepEqual(b, l);
      if (!deletedRemotely) out.push(l);
    } else if (r) {
      const deletedLocally = b !== undefined && deepEqual(b, r);
      if (!deletedLocally) out.push(r);
    }
  }
  return out;
}
