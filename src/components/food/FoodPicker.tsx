import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Layers, Plus } from 'lucide-react';
import { FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { FOOD_FAMILIES } from '@/lib/foodFamilies';
import { NutritionTable } from '@/components/food/NutritionTable';

export function FoodPicker({ onAdd }: { onAdd: (food: FoodEntry) => void }) {
  const [category, setCategory] = useState<string>(FOOD_CATEGORIES[0]);
  const families = useMemo(() => FOOD_FAMILIES.get(category) ?? [], [category]);
  const [familyName, setFamilyName] = useState('');
  const family = families.find((f) => f.name === familyName) ?? families[0];
  const [foodId, setFoodId] = useState('');
  const food = family?.foods.find((f) => f.id === foodId) ?? family?.foods[0];

  useEffect(() => { setFamilyName(''); setFoodId(''); }, [category]);
  useEffect(() => { setFoodId(''); }, [familyName]);

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

      {food && <SelectedFood key={food.id} food={food} onAdd={onAdd} />}
    </div>
  );
}

function SelectedFood({ food, onAdd }: { food: FoodEntry; onAdd: (food: FoodEntry) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-3 animate-fade-in">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{food.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {expanded && <NutritionTable food={food} name={food.name} />}

      <button onClick={() => onAdd(food)} className="btn-primary w-full text-sm">
        <Plus className="w-4 h-4" /> Scegli i grammi e aggiungi
      </button>
    </div>
  );
}
