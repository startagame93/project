import type { NutrientValues, Recipe, RecipeIngredient } from '@/types';

export const ZERO_NUTRIENTS: NutrientValues = {
  calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: 0, sugar: 0,
  fiber: 0, sodium: 0, potassium: 0, calcium: 0, iron: 0,
};

const ROUND_KEYS: (keyof NutrientValues)[] = ['calories', 'sodium', 'potassium', 'calcium'];

function round(key: keyof NutrientValues, value: number): number {
  if (ROUND_KEYS.includes(key)) return Math.round(value);
  if (key === 'iron') return Math.round(value * 100) / 100;
  return Math.round(value * 10) / 10;
}

export function scaleNutrients(per100: NutrientValues, grams: number): NutrientValues {
  const factor = grams / 100;
  const out = { ...ZERO_NUTRIENTS };
  (Object.keys(out) as (keyof NutrientValues)[]).forEach((k) => {
    out[k] = round(k, per100[k] * factor);
  });
  return out;
}

export function sumIngredients(ingredients: RecipeIngredient[]): NutrientValues {
  const total = { ...ZERO_NUTRIENTS };
  for (const ing of ingredients) {
    const part = scaleNutrients(ing.per100, ing.grams);
    (Object.keys(total) as (keyof NutrientValues)[]).forEach((k) => {
      total[k] = round(k, total[k] + part[k]);
    });
  }
  return total;
}

export function recipeTotalGrams(recipe: Pick<Recipe, 'ingredients'>): number {
  return recipe.ingredients.reduce((sum, ing) => sum + ing.grams, 0);
}

export function perServing(recipe: Pick<Recipe, 'ingredients' | 'servings'>): NutrientValues {
  const total = sumIngredients(recipe.ingredients);
  const servings = Math.max(1, recipe.servings);
  const out = { ...ZERO_NUTRIENTS };
  (Object.keys(total) as (keyof NutrientValues)[]).forEach((k) => {
    out[k] = round(k, total[k] / servings);
  });
  return out;
}
