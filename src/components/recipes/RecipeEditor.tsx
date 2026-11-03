import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { IngredientPicker } from '@/components/recipes/IngredientPicker';
import { perServing } from '@/lib/recipeMath';
import { uid } from '@/lib/data';
import type { CustomFoodEntry, NutrientValues, Recipe, RecipeIngredient } from '@/types';
import type { FoodEntry } from '@/lib/foodDatabase';

type Draft = Omit<Recipe, 'createdAt' | 'updatedAt'> & Partial<Pick<Recipe, 'createdAt' | 'updatedAt'>>;

function toIngredient(food: FoodEntry | CustomFoodEntry): RecipeIngredient {
  const per100: NutrientValues = {
    calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
    saturatedFat: food.saturatedFat, sugar: food.sugar, fiber: food.fiber,
    sodium: food.sodium, potassium: food.potassium, calcium: food.calcium, iron: food.iron,
  };
  return { id: uid(), foodId: food.id, name: food.name, grams: 100, per100 };
}

function emptyDraft(): Draft {
  return { id: uid(), name: '', description: '', servings: 1, prepMinutes: null, ingredients: [], steps: [''] };
}

export function RecipeEditor({ recipe, customFoods, onSave, onClose }: {
  recipe: Recipe | null;
  customFoods: CustomFoodEntry[];
  onSave: (recipe: Draft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => recipe ?? emptyDraft());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [triedSave, setTriedSave] = useState(false);

  const portion = useMemo(() => perServing(draft), [draft]);
  const nameError = triedSave && !draft.name.trim() ? 'Dai un nome al piatto.' : '';
  const ingredientError = triedSave && draft.ingredients.length === 0 ? 'Aggiungi almeno un alimento.' : '';
  const gramsError = triedSave && draft.ingredients.some((i) => !(i.grams > 0)) ? 'Ogni alimento deve avere una quantita maggiore di zero.' : '';

  function patch(changes: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...changes }));
  }

  function addIngredients(foods: (FoodEntry | CustomFoodEntry)[]) {
    patch({ ingredients: [...draft.ingredients, ...foods.map(toIngredient)] });
    setPickerOpen(false);
  }

  function updateGrams(id: string, value: string) {
    const parsed = parseFloat(value.replace(',', '.'));
    patch({ ingredients: draft.ingredients.map((i) => (i.id === id ? { ...i, grams: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 } : i)) });
  }

  function removeIngredient(id: string) {
    patch({ ingredients: draft.ingredients.filter((i) => i.id !== id) });
  }

  function updateStep(index: number, text: string) {
    patch({ steps: draft.steps.map((s, i) => (i === index ? text : s)) });
  }

  function moveStep(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= draft.steps.length) return;
    const next = [...draft.steps];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ steps: next });
  }

  function removeStep(index: number) {
    const next = draft.steps.filter((_, i) => i !== index);
    patch({ steps: next.length > 0 ? next : [''] });
  }

  function save() {
    setTriedSave(true);
    if (!draft.name.trim() || draft.ingredients.length === 0 || draft.ingredients.some((i) => !(i.grams > 0))) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      steps: draft.steps.map((s) => s.trim()).filter(Boolean),
    });
  }

  return (
    <Sheet open onClose={onClose} title={recipe ? 'Modifica piatto' : 'Crea il tuo piatto'}>
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="recipe-name">Nome del piatto</label>
          <input
            id="recipe-name"
            className="input"
            value={draft.name}
            placeholder="es. Pasta al pesto con pollo"
            onChange={(e) => patch({ name: e.target.value })}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'recipe-name-error' : undefined}
          />
          {nameError && <p id="recipe-name-error" className="text-xs text-error-600 mt-1">{nameError}</p>}
        </div>

        <div>
          <label className="label" htmlFor="recipe-description">Note (facoltative)</label>
          <textarea
            id="recipe-description"
            className="input min-h-[60px]"
            value={draft.description}
            placeholder="Es. Ideale per il pranzo di lavoro"
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="recipe-servings">Porzioni</label>
            <input
              id="recipe-servings"
              type="number"
              min="1"
              inputMode="numeric"
              className="input"
              value={draft.servings}
              onChange={(e) => patch({ servings: Math.max(1, Math.round(parseFloat(e.target.value) || 1)) })}
            />
          </div>
          <div>
            <label className="label" htmlFor="recipe-prep">Preparazione (min)</label>
            <input
              id="recipe-prep"
              type="number"
              min="0"
              inputMode="numeric"
              className="input"
              value={draft.prepMinutes ?? ''}
              placeholder="facoltativo"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                patch({ prepMinutes: Number.isFinite(v) && v >= 0 ? Math.round(v) : null });
              }}
            />
          </div>
        </div>

        <section aria-labelledby="recipe-ingredients-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 id="recipe-ingredients-title" className="text-sm font-semibold text-gray-900 dark:text-white">Ingredienti</h3>
            <button type="button" onClick={() => setPickerOpen(true)} className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" /> Dall'alimentario
            </button>
          </div>

          {draft.ingredients.length === 0 && (
            <p className="text-xs text-gray-500 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
              Nessun alimento. Apri l'alimentario e spunta quelli che ti servono.
            </p>
          )}

          <ul className="space-y-2">
            {draft.ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-2">
                <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{ing.name}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  className="input w-20 py-1.5"
                  value={ing.grams}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateGrams(ing.id, e.target.value)}
                  aria-label={`Grammi di ${ing.name}`}
                />
                <span className="text-xs text-gray-500">g</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(ing.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  aria-label={`Rimuovi ${ing.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          {ingredientError && <p className="text-xs text-error-600">{ingredientError}</p>}
          {gramsError && <p className="text-xs text-error-600">{gramsError}</p>}
        </section>

        <section aria-labelledby="recipe-steps-title" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 id="recipe-steps-title" className="text-sm font-semibold text-gray-900 dark:text-white">Come si prepara</h3>
            <button type="button" onClick={() => patch({ steps: [...draft.steps, ''] })} className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" /> Passo
            </button>
          </div>
          <ol className="space-y-2">
            {draft.steps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center mt-1" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <textarea
                    className="input min-h-[56px]"
                    value={step}
                    placeholder={`Passo ${index + 1}, es. Lessa la pasta per 10 minuti`}
                    onChange={(e) => updateStep(index, e.target.value)}
                    aria-label={`Testo del passo ${index + 1}`}
                  />
                  <div className="flex gap-1 justify-end">
                    <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg text-gray-500 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={`Sposta il passo ${index + 1} in alto`}>
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveStep(index, 1)} disabled={index === draft.steps.length - 1} className="p-1.5 rounded-lg text-gray-500 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={`Sposta il passo ${index + 1} in basso`}>
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => removeStep(index)} className="p-1.5 rounded-lg text-gray-500 hover:text-error-600 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={`Elimina il passo ${index + 1}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3" aria-live="polite">
          <p className="text-xs text-gray-500 mb-1">Per porzione ({draft.servings} {draft.servings === 1 ? 'porzione' : 'porzioni'})</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.round(portion.calories)} kcal - P {portion.protein}g - C {portion.carbs}g - G {portion.fat}g
          </p>
          <p className="text-xs text-gray-400 mt-1">Valori stimati dagli alimenti scelti, da controllare sull'etichetta se necessario.</p>
        </div>

        <button type="button" onClick={save} className="btn-primary w-full">
          <Check className="w-4 h-4" /> Salva piatto
        </button>
      </div>

      {pickerOpen && (
        <IngredientPicker customFoods={customFoods} onConfirm={addIngredients} onClose={() => setPickerOpen(false)} />
      )}
    </Sheet>
  );
}
