import { useState } from 'react';
import { CalendarPlus, ChefHat, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RecipeEditor } from '@/components/recipes/RecipeEditor';
import { RecipeToDietSheet } from '@/components/recipes/RecipeToDietSheet';
import { perServing, recipeTotalGrams } from '@/lib/recipeMath';
import type { Recipe } from '@/types';

type Editing = { mode: 'new' } | { mode: 'edit'; recipe: Recipe } | null;

export function RecipesPanel() {
  const { state, setState } = useApp();
  const [editing, setEditing] = useState<Editing>(null);
  const [dietRecipe, setDietRecipe] = useState<Recipe | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function saveRecipe(draft: Omit<Recipe, 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    setState((prev) => {
      const exists = prev.recipes.some((r) => r.id === draft.id);
      const recipes = exists
        ? prev.recipes.map((r) => (r.id === draft.id ? { ...draft, createdAt: r.createdAt, updatedAt: now } : r))
        : [...prev.recipes, { ...draft, createdAt: now, updatedAt: now }];
      return { ...prev, recipes };
    });
    setEditing(null);
  }

  function deleteRecipe(id: string) {
    setState((prev) => ({ ...prev, recipes: prev.recipes.filter((r) => r.id !== id) }));
    setConfirmDeleteId(null);
  }

  const recipes = state.recipes;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setEditing({ mode: 'new' })} className="btn-primary w-full">
        <Plus className="w-4 h-4" /> Aggiungi nuova ricetta
      </button>

      {recipes.length === 0 && (
        <div className="card p-6 text-center">
          <ChefHat className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Non hai ancora creato nessun piatto.</p>
          <p className="text-xs text-gray-500 mt-1">Scegli gli alimenti, indica le quantita e scrivi come si prepara.</p>
        </div>
      )}

      <ul className="space-y-3" aria-label="I tuoi piatti">
        {recipes.map((recipe) => {
          const portion = perServing(recipe);
          const confirming = confirmDeleteId === recipe.id;
          return (
            <li key={recipe.id} className="card p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{recipe.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {recipe.ingredients.length} alimenti - {recipeTotalGrams(recipe)} g totali - {recipe.servings} {recipe.servings === 1 ? 'porzione' : 'porzioni'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Per porzione: {Math.round(portion.calories)} kcal - P {portion.protein}g - C {portion.carbs}g - G {portion.fat}g
                </p>
              </div>

              {confirming ? (
                <div className="flex gap-2 animate-fade-in" role="group" aria-label={`Conferma eliminazione di ${recipe.name}`}>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1 text-sm">Annulla</button>
                  <button type="button" onClick={() => deleteRecipe(recipe.id)} className="btn-primary flex-1 text-sm bg-error-600 hover:bg-error-700">
                    Elimina definitivamente
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDietRecipe(recipe)} className="btn-primary flex-1 text-xs" aria-label={`Aggiungi ${recipe.name} alla dieta`}>
                    <CalendarPlus className="w-3.5 h-3.5" /> Alla dieta
                  </button>
                  <button type="button" onClick={() => setEditing({ mode: 'edit', recipe })} className="btn-secondary text-xs" aria-label={`Modifica ${recipe.name}`}>
                    <Pencil className="w-3.5 h-3.5" /> Modifica
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteId(recipe.id)} className="btn-secondary text-xs text-error-600" aria-label={`Elimina ${recipe.name}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {editing && (
        <RecipeEditor
          recipe={editing.mode === 'edit' ? editing.recipe : null}
          customFoods={state.customFoods}
          onSave={saveRecipe}
          onClose={() => setEditing(null)}
        />
      )}

      {dietRecipe && <RecipeToDietSheet recipe={dietRecipe} onClose={() => setDietRecipe(null)} />}
    </div>
  );
}
