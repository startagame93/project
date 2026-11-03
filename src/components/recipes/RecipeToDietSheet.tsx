import { useState } from 'react';
import { Calendar, Check, Utensils } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { useApp } from '@/context/AppContext';
import { perServing, scaleNutrients } from '@/lib/recipeMath';
import { uid } from '@/lib/data';
import { DAYS_OF_WEEK, MEAL_TYPES, type Meal, type MealType, type Recipe } from '@/types';

export function RecipeToDietSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { setState } = useApp();
  const [targetDay, setTargetDay] = useState((new Date().getDay() + 6) % 7);
  const [targetMeal, setTargetMeal] = useState<MealType>('Pranzo');
  const [portionsInput, setPortionsInput] = useState('1');
  const portions = parseFloat(portionsInput.replace(',', '.'));
  const validPortions = Number.isFinite(portions) && portions > 0 && portions <= 20;

  const nutrients = scaleNutrients(perServing(recipe), validPortions ? portions * 100 : 0);

  function addToDiet() {
    if (!validPortions) return;
    const meal: Meal = {
      id: uid(),
      type: targetMeal,
      name: `${recipe.name} (${portions} ${portions === 1 ? 'porzione' : 'porzioni'})`,
      foods: recipe.ingredients.map((i) => `${i.name} (${Math.round(i.grams * portions / recipe.servings)}g)`),
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fat: nutrients.fat,
      saturatedFat: nutrients.saturatedFat,
      sugar: nutrients.sugar,
      fiber: nutrients.fiber,
      sodium: nutrients.sodium,
      potassium: nutrients.potassium,
      calcium: nutrients.calcium,
      iron: nutrients.iron,
      completed: false,
      recurring: false,
      recurringDays: [],
    };

    setState((prev) => {
      if (prev.weeks.length === 0) return prev;
      const activeIdx = Math.max(0, prev.weeks.findIndex((w) => w.id === prev.activeWeekId));
      const weeks = prev.weeks.map((w, wi) => {
        if (wi !== activeIdx) return w;
        return {
          ...w,
          days: w.days.map((d, di) => (di === targetDay ? { ...d, meals: [...d.meals, { ...meal, id: uid() }] } : d)),
        };
      });
      return { ...prev, weeks };
    });
    onClose();
  }

  return (
    <Sheet open onClose={onClose} title={`Aggiungi alla dieta: ${recipe.name}`}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="diet-portions">Quante porzioni mangi</label>
          <input
            id="diet-portions"
            type="number"
            min="0.5"
            step="0.5"
            inputMode="decimal"
            className="input"
            value={portionsInput}
            onChange={(e) => setPortionsInput(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1" aria-live="polite">
            {validPortions
              ? `Per queste porzioni: ${Math.round(nutrients.calories)} kcal - P ${nutrients.protein}g - C ${nutrients.carbs}g - G ${nutrients.fat}g`
              : 'Inserisci un numero tra 0,5 e 20.'}
          </p>
        </div>

        <div>
          <label className="label flex items-center gap-1.5" htmlFor="diet-day"><Calendar className="w-4 h-4" /> Giorno</label>
          <select id="diet-day" className="input" value={targetDay} onChange={(e) => setTargetDay(+e.target.value)}>
            {DAYS_OF_WEEK.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="label flex items-center gap-1.5" htmlFor="diet-meal"><Utensils className="w-4 h-4" /> Pasto</label>
          <select id="diet-meal" className="input" value={targetMeal} onChange={(e) => setTargetMeal(e.target.value as MealType)}>
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <button type="button" onClick={addToDiet} disabled={!validPortions} className="btn-primary w-full">
          <Check className="w-4 h-4" /> Conferma aggiunta
        </button>
      </div>
    </Sheet>
  );
}
