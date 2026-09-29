import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { FOOD_DATABASE, FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { uid } from '@/lib/data';
import { Sheet } from '@/components/Sheet';
import { Search, Plus, Pencil, Trash2, BookOpen, Check, X } from 'lucide-react';
import type { CustomFoodEntry } from '@/types';

type CombinedFood = FoodEntry | CustomFoodEntry;

function isCustom(food: CombinedFood): boolean {
  return !FOOD_DATABASE.some((f) => f.id === food.id);
}

export function FoodDatabaseView() {
  const { state, setState } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingFood, setEditingFood] = useState<CustomFoodEntry | null>(null);
  const [addingFood, setAddingFood] = useState(false);

  const allFoods: CombinedFood[] = useMemo(() => {
    return [...FOOD_DATABASE, ...state.customFoods];
  }, [state.customFoods]);

  const filtered = useMemo(() => {
    let result = allFoods;
    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allFoods, query, selectedCategory]);

  function deleteCustomFood(id: string) {
    setState((prev) => ({ ...prev, customFoods: prev.customFoods.filter((f) => f.id !== id) }));
  }

  function saveCustomFood(food: CustomFoodEntry) {
    setState((prev) => {
      const exists = prev.customFoods.find((f) => f.id === food.id);
      if (exists) {
        return { ...prev, customFoods: prev.customFoods.map((f) => f.id === food.id ? food : f) };
      }
      return { ...prev, customFoods: [...prev.customFoods, food] };
    });
    setEditingFood(null);
    setAddingFood(false);
  }

  function startEdit(food: CombinedFood) {
    if (!isCustom(food)) return;
    setEditingFood(food as CustomFoodEntry);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          className="input pl-10"
          placeholder="Cerca alimento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca alimento nel database nutrizionale"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Filtra per categoria">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
          role="tab"
          aria-selected={selectedCategory === 'all'}
        >
          Tutti
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            role="tab"
            aria-selected={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500" aria-live="polite">
        {filtered.length} alimenti trovati
      </p>

      {/* Food list */}
      <div className="space-y-2">
        {filtered.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            custom={isCustom(food)}
            onEdit={() => startEdit(food)}
            onDelete={() => deleteCustomFood(food.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" aria-hidden="true" />
            <p className="text-gray-500">Nessun alimento trovato per "{query}"</p>
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setAddingFood(true)}
        className="btn-primary w-full"
        aria-label="Aggiungi un nuovo alimento personalizzato al database"
      >
        <Plus className="w-4 h-4" /> Aggiungi Alimento Personalizzato
      </button>

      {/* Add/Edit sheet */}
      {(addingFood || editingFood) && (
        <FoodEditor
          food={editingFood}
          onSave={saveCustomFood}
          onClose={() => { setAddingFood(false); setEditingFood(null); }}
        />
      )}
    </div>
  );
}

function FoodCard({ food, custom, onEdit, onDelete }: {
  food: CombinedFood;
  custom: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
        aria-label={`Valori nutrizionali di ${food.name}, ${food.calories} calorie per 100 grammi. Tocca per dettagli.`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{food.name}</span>
            {custom && (
              <span className="chip bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300 text-[10px]">
                Personalizzato
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">{food.category}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{food.calories}</span>
          <span className="text-xs text-gray-500 ml-1">kcal/100g</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 animate-fade-in" role="region" aria-label={`Dettagli nutrizionali di ${food.name}`}>
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

          {custom && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onEdit}
                className="btn-secondary flex-1 text-xs"
                aria-label={`Modifica ${food.name}`}
              >
                <Pencil className="w-3.5 h-3.5" /> Modifica
              </button>
              <button
                onClick={onDelete}
                className="btn-secondary flex-1 text-xs text-error-600"
                aria-label={`Elimina ${food.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Elimina
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

function FoodEditor({ food, onSave, onClose }: {
  food: CustomFoodEntry | null;
  onSave: (food: CustomFoodEntry) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CustomFoodEntry>(() => food ?? {
    id: uid(),
    name: '',
    category: 'Verdure',
    calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: 0,
    sugar: 0, fiber: 0, sodium: 0, potassium: 0, calcium: 0, iron: 0,
  });

  function update<K extends keyof CustomFoodEntry>(key: K, value: CustomFoodEntry[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <Sheet open onClose={onClose} title={food ? 'Modifica Alimento' : 'Nuovo Alimento'}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="food-name">Nome Alimento</label>
          <input
            id="food-name"
            className="input"
            value={draft.name}
            placeholder="es. Pane di farro"
            onChange={(e) => update('name', e.target.value)}
            aria-label="Nome dell'alimento"
          />
        </div>

        <div>
          <label className="label" htmlFor="food-category">Categoria</label>
          <select
            id="food-category"
            className="input"
            value={draft.category}
            onChange={(e) => update('category', e.target.value)}
            aria-label="Categoria dell'alimento"
          >
            {FOOD_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="text-sm text-gray-500 font-medium">Valori per 100g</div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Calorie (kcal)" value={draft.calories} onChange={(v) => update('calories', v)} />
          <NumberField label="Proteine (g)" value={draft.protein} onChange={(v) => update('protein', v)} />
          <NumberField label="Carboidrati (g)" value={draft.carbs} onChange={(v) => update('carbs', v)} />
          <NumberField label="Grassi (g)" value={draft.fat} onChange={(v) => update('fat', v)} />
          <NumberField label="Grassi Saturi (g)" value={draft.saturatedFat} onChange={(v) => update('saturatedFat', v)} />
          <NumberField label="Zuccheri (g)" value={draft.sugar} onChange={(v) => update('sugar', v)} />
          <NumberField label="Fibre (g)" value={draft.fiber} onChange={(v) => update('fiber', v)} />
          <NumberField label="Sodio (mg)" value={draft.sodium} onChange={(v) => update('sodium', v)} />
          <NumberField label="Potassio (mg)" value={draft.potassium} onChange={(v) => update('potassium', v)} />
          <NumberField label="Calcio (mg)" value={draft.calcium} onChange={(v) => update('calcium', v)} />
          <NumberField label="Ferro (mg)" value={draft.iron} onChange={(v) => update('iron', v)} />
        </div>

        <button
          onClick={() => draft.name.trim() && onSave(draft)}
          className="btn-primary w-full"
          disabled={!draft.name.trim()}
          aria-label="Salva alimento nel database"
        >
          <Check className="w-4 h-4" /> Salva
        </button>
      </div>
    </Sheet>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        className="input"
        value={value || ''}
        onChange={(e) => onChange(+e.target.value)}
        aria-label={label}
      />
    </div>
  );
}
