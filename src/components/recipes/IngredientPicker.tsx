import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { FOOD_DATABASE, type FoodEntry } from '@/lib/foodDatabase';
import type { CustomFoodEntry } from '@/types';

const MAX_RESULTS = 80;

export function IngredientPicker({ customFoods, onConfirm, onClose }: {
  customFoods: CustomFoodEntry[];
  onConfirm: (foods: (FoodEntry | CustomFoodEntry)[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, FoodEntry | CustomFoodEntry>>({});

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all: (FoodEntry | CustomFoodEntry)[] = [...FOOD_DATABASE, ...customFoods];
    const filtered = q ? all.filter((f) => f.name.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [query, customFoods]);

  const visible = results.slice(0, MAX_RESULTS);
  const count = Object.keys(selected).length;

  function toggle(food: FoodEntry | CustomFoodEntry) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[food.id]) delete next[food.id];
      else next[food.id] = food;
      return next;
    });
  }

  return (
    <Sheet open onClose={onClose} title="Scegli gli alimenti">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Cerca nell'alimentario..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cerca alimento nell'alimentario"
          />
        </div>

        <p className="text-xs text-gray-500" aria-live="polite">
          {results.length > MAX_RESULTS
            ? `Mostro i primi ${MAX_RESULTS} di ${results.length}. Scrivi un nome per restringere la ricerca.`
            : `${results.length} alimenti`}
        </p>

        <ul className="max-h-[50vh] overflow-y-auto space-y-1 pr-1" role="group" aria-label="Alimenti disponibili">
          {visible.map((food) => {
            const checked = !!selected[food.id];
            return (
              <li key={food.id}>
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    checked ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input type="checkbox" className="sr-only peer" checked={checked} onChange={() => toggle(food)} aria-label={food.name} />
                  <span
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    aria-hidden="true"
                  >
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{food.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">{Math.round(food.calories)} kcal/100g</span>
                </label>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onConfirm(Object.values(selected))}
          disabled={count === 0}
          className="btn-primary w-full"
        >
          <Check className="w-4 h-4" /> Aggiungi {count > 0 ? `${count} ${count === 1 ? 'alimento' : 'alimenti'}` : 'alimenti'}
        </button>
      </div>
    </Sheet>
  );
}
