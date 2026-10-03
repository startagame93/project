export type ScannedProduct = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  sugar: number;
  fiber: number;
  sodium: number;
};

export function isValidBarcode(code: string): boolean {
  return /^\d{6,14}$/.test(code);
}

function num(v: unknown, scale = 1): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? Math.round(n * scale * 10) / 10 : 0;
}

export async function lookupBarcode(code: string): Promise<ScannedProduct | null> {
  if (!isValidBarcode(code)) return null;
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_it,brands,nutriments`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  const json: unknown = await res.json();
  if (!json || typeof json !== 'object') return null;
  const { status, product } = json as { status?: number; product?: Record<string, unknown> };
  if (status !== 1 || !product) return null;

  const n = (product.nutriments ?? {}) as Record<string, unknown>;
  const rawName = String(product.product_name_it || product.product_name || '').trim();
  const brand = String(product.brands || '').split(',')[0].trim();
  const kcal = n['energy-kcal_100g'] ?? (typeof n['energy_100g'] === 'number' ? (n['energy_100g'] as number) / 4.184 : 0);

  return {
    name: [rawName || 'Prodotto scansionato', brand].filter(Boolean).join(' - ').slice(0, 80),
    calories: Math.round(num(kcal)),
    protein: num(n['proteins_100g']),
    carbs: num(n['carbohydrates_100g']),
    fat: num(n['fat_100g']),
    saturatedFat: num(n['saturated-fat_100g']),
    sugar: num(n['sugars_100g']),
    fiber: num(n['fiber_100g']),
    sodium: Math.round(num(n['sodium_100g'], 1000)),
  };
}
