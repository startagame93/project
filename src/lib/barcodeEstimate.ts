import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ScannedProduct } from '@/lib/openFoodFacts';

export class BarcodeEstimateError extends Error {}

const num = (v: unknown, max: number): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max) return null;
  return Math.round(v * 10) / 10;
};

function parseEstimate(text: string): ScannedProduct | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BarcodeEstimateError('La stima IA non e leggibile.');
  }
  if (!parsed || typeof parsed !== 'object') throw new BarcodeEstimateError('La stima IA non e leggibile.');
  const o = parsed as Record<string, unknown>;
  if (o.found !== true) return null;

  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : '';
  const calories = num(o.calories, 900);
  const protein = num(o.protein, 100);
  const carbs = num(o.carbs, 100);
  const fat = num(o.fat, 100);
  const saturatedFat = num(o.saturatedFat, 100);
  const sugar = num(o.sugar, 100);
  const fiber = num(o.fiber, 100);
  const sodium = num(o.sodium, 40000);
  const values = [calories, protein, carbs, fat, saturatedFat, sugar, fiber, sodium];

  if (!name || values.some((v) => v === null)) throw new BarcodeEstimateError('La stima IA non contiene valori validi.');
  if ((protein ?? 0) + (carbs ?? 0) + (fat ?? 0) > 105) throw new BarcodeEstimateError('La stima IA non e coerente.');

  return {
    name,
    calories: calories ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
    saturatedFat: saturatedFat ?? 0,
    sugar: sugar ?? 0,
    fiber: fiber ?? 0,
    sodium: sodium ?? 0,
  };
}

export async function estimateBarcodeNutrition(code: string): Promise<ScannedProduct | null> {
  const { data, error } = await supabase.functions.invoke('estimate-barcode-nutrition', { body: { barcode: code } });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      if (status === 401) throw new BarcodeEstimateError('Accedi di nuovo per usare la stima IA.');
      if (status === 429) throw new BarcodeEstimateError('Troppe richieste IA. Riprova più tardi.');
      if (status === 503) throw new BarcodeEstimateError('Il servizio IA non è disponibile al momento.');
      throw new BarcodeEstimateError('Il servizio IA non ha potuto stimare questo prodotto.');
    }
    if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
      throw new BarcodeEstimateError('Impossibile contattare il servizio IA. Controlla la connessione.');
    }
    throw new BarcodeEstimateError('Il servizio IA non ha potuto stimare questo prodotto.');
  }

  const text = data && typeof data === 'object' && typeof (data as { text?: unknown }).text === 'string'
    ? (data as { text: string }).text
    : null;
  if (text === null) throw new BarcodeEstimateError('Il servizio IA ha restituito una risposta non valida.');
  return parseEstimate(text);
}
