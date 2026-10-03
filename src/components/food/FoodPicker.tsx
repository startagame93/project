import { useEffect, useMemo, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { FOOD_FAMILIES } from '@/lib/foodFamilies';

const MACROS: [string, string, number][] = [
  ['kcal', 'Calorie', 0],
  ['g', 'Proteine', 1],
  ['g', 'Carboidrati', 2],
  ['g', 'Grassi', 3],
];

export function FoodPicker({ onAdd }: { onAdd: (food: FoodEntry) => void }) {
  const [category, setCategory] = useState<string>(FOOD_CATEGORIES[0]);
  const families = useMemo(() => FOOD_FAMILIES.get(category) ?? [], [category]);
  const [familyName, setFamilyName] = useState('');
  const family = families.find((f) => f.name === familyName) ?? families[0];
  const [foodId, setFoodId] = useState('');
  const food = family?.foods.find((f) => f.id === foodId) ?? family?.foods[0];

  useEffect(() => { setFamilyName(''); setFoodId(''); }, [category]);
  useEffect(() => { setFoodId(''); }, [familyName]);

  const values = food ? [food.calories, food.protein, food.carbs, food.fat] : [];

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <Layers className="w-4 h-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Scegli per categoria</p>
          <p className="text-xs text-gray-500">Categoria, tipologia e prodotto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria principale">
          {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input"
          value={family?.name ?? ''}
          onChange={(e) => setFamilyName(e.target.value)}
          aria-label="Tipologia"
          disabled={families.length === 0}
        >
          {families.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.foods.length})</option>)}
        </select>
        <select
          className="input"
          value={food?.id ?? ''}
          onChange={(e) => setFoodId(e.target.value)}
          aria-label="Prodotto"
          disabled={!family}
        >
          {family?.foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {food && (
        <div key={food.id} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 animate-fade-in">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {food.name} <span className="text-xs font-normal text-gray-500">· per 100 g</span>
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {MACROS.map(([unit, label, i]) => (
              <div key={label} className="rounded-lg bg-white dark:bg-gray-900 py-2">
                <p className="text-base font-bold text-primary-600 dark:text-primary-400">{values[i]}</p>
                <p className="text-[10px] text-gray-500">{label} ({unit})</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Zuccheri {food.sugar} g</span>
            <span>Fibre {food.fiber} g</span>
            <span>Sodio {food.sodium} mg</span>
          </div>
          <button onClick={() => onAdd(food)} className="btn-primary w-full text-sm mt-3">
            <Plus className="w-4 h-4" /> Scegli i grammi e aggiungi
          </button>
        </div>
      )}
    </div>
  );
}
