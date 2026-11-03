import type { FoodEntry } from '@/lib/foodDatabase';

function NutrientRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white" aria-label={`${label}: ${value} ${unit}`}>
        {value} {unit}
      </span>
    </div>
  );
}

export function NutritionTable({ food, name }: { food: FoodEntry; name: string }) {
  return (
    <div className="space-y-2" role="region" aria-label={`Valori nutrizionali di ${name} per 100 grammi`}>
      <p className="text-xs text-gray-500">Valori per 100 g</p>
      <NutrientRow label="Calorie" value={food.calories} unit="kcal" />
      <NutrientRow label="Proteine" value={food.protein} unit="g" />
      <NutrientRow label="Carboidrati" value={food.carbs} unit="g" />
      <NutrientRow label="Grassi" value={food.fat} unit="g" />
      <NutrientRow label="Grassi Saturi" value={food.saturatedFat} unit="g" />
      <NutrientRow label="Zuccheri" value={food.sugar} unit="g" />
      <NutrientRow label="Fibre" value={food.fiber} unit="g" />
      <NutrientRow label="Sodio" value={food.sodium} unit="mg" />
      <NutrientRow label="Potassio" value={food.potassium} unit="mg" />
      <NutrientRow label="Calcio" value={food.calcium} unit="mg" />
      <NutrientRow label="Ferro" value={food.iron} unit="mg" />
    </div>
  );
}
