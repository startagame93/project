import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { createEmptyWeek, createEmptyMeal, uid, todayISO } from '@/lib/data';
import { extractPdfText, parsePdfToWeek } from '@/lib/pdfParser';
import { DAYS_OF_WEEK, MEAL_TYPES, MEAL_ICONS, type Meal, type MealType, type WeekPlan } from '@/types';
import { Modal } from '@/components/Modal';
import { Sheet } from '@/components/Sheet';
import {
  ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, Upload, FileText,
  Sunrise, Apple, Utensils, Cookie, Moon, ShoppingCart, X, Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  sunrise: Sunrise, apple: Apple, utensils: Utensils, cookie: Cookie, moon: Moon,
};

export function DietView() {
  const { state, setState } = useApp();
  const [weekIdx, setWeekIdx] = useState(() => {
    const idx = state.weeks.findIndex((w) => w.id === state.activeWeekId);
    return idx >= 0 ? idx : 0;
  });
  const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);
  const [editingMeal, setEditingMeal] = useState<{ dayIdx: number; meal: Meal } | null>(null);
  const [showWeekManager, setShowWeekManager] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const week = state.weeks[weekIdx];

  function updateWeeks(updater: (weeks: WeekPlan[]) => WeekPlan[]) {
    setState((prev) => ({ ...prev, weeks: updater(prev.weeks) }));
  }

  function updateDay(dayIdx: number, updater: (meals: Meal[]) => Meal[]) {
    updateWeeks((weeks) => weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      return {
        ...w,
        days: w.days.map((d, di) => di === dayIdx ? { ...d, meals: updater(d.meals) } : d),
      };
    }));
  }

  function toggleMealComplete(dayIdx: number, mealId: string) {
    updateDay(dayIdx, (meals) => meals.map((m) => m.id === mealId ? { ...m, completed: !m.completed } : m));
  }

  function deleteMeal(dayIdx: number, mealId: string) {
    updateDay(dayIdx, (meals) => meals.filter((m) => m.id !== mealId));
  }

  function saveMeal(dayIdx: number, meal: Meal) {
    updateDay(dayIdx, (meals) => {
      const exists = meals.find((m) => m.id === meal.id);
      if (exists) return meals.map((m) => m.id === meal.id ? meal : m);
      return [...meals, meal];
    });
    setEditingMeal(null);
  }

  function addMeal(dayIdx: number, type: MealType) {
    setEditingMeal({ dayIdx, meal: createEmptyMeal(type) });
  }

  function addWeek() {
    const newWeek = createEmptyWeek(`Settimana ${state.weeks.length + 1}`);
    updateWeeks((weeks) => [...weeks, newWeek]);
    setWeekIdx(state.weeks.length);
    setShowWeekManager(false);
  }

  function deleteWeek(idx: number) {
    if (state.weeks.length <= 1) return;
    updateWeeks((weeks) => weeks.filter((_, i) => i !== idx));
    setWeekIdx(Math.max(0, idx - 1));
    setShowWeekManager(false);
  }

  function switchWeek(idx: number) {
    setWeekIdx(idx);
    setState((prev) => ({ ...prev, activeWeekId: state.weeks[idx].id }));
    setShowWeekManager(false);
  }

  function generateShoppingList() {
    const items: Record<string, { name: string; category: string; quantity: string }> = {};
    week.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          if (!items[food]) items[food] = { name: food, category: 'Generale', quantity: '1 pz' };
        });
      });
    });
    const list = Object.values(items).map((item) => ({
      id: uid(),
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      checked: false,
    }));
    setState((prev) => ({ ...prev, shoppingList: list }));
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        setPdfError('Impossibile estrarre testo dal PDF. Il file potrebbe essere un\'immagine scansita.');
        setPdfLoading(false);
        return;
      }
      const newWeek = parsePdfToWeek(text, `Dieta: ${file.name.replace(/\.pdf$/i, '')}`);
      const totalMeals = newWeek.days.reduce((s, d) => s + d.meals.filter((m) => m.name !== m.type || m.foods.length > 0 || m.calories > 0).length, 0);
      if (totalMeals === 0) {
        setState((prev) => ({ ...prev, pdfText: `PDF caricato: ${file.name} (nessun pasto rilevato, testo salvato per consultazione)` }));
        setPdfError('Il PDF e stato caricato ma non e stato possibile riconoscere la struttura dei pasti. Puoi aggiungerli manualmente.');
        setPdfLoading(false);
        return;
      }
      setState((prev) => ({
        ...prev,
        weeks: [...prev.weeks, newWeek],
        activeWeekId: newWeek.id,
        pdfText: `PDF caricato: ${file.name} (${totalMeals} pasti)`,
      }));
      setWeekIdx(state.weeks.length);
      setShowPdfModal(false);
    } catch (err) {
      setPdfError(`Errore durante la lettura del PDF: ${err instanceof Error ? err.message : 'errore sconosciuto'}`);
    } finally {
      setPdfLoading(false);
    }
  }

  const dayPlan = week.days[selectedDay];
  const today = todayISO();
  const isToday = (new Date().getDay() + 6) % 7 === selectedDay;

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setWeekIdx((i) => (i - 1 + state.weeks.length) % state.weeks.length)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowWeekManager(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-semibold text-gray-900 dark:text-white"
        >
          {week.label}
        </button>
        <button
          onClick={() => setWeekIdx((i) => (i + 1) % state.weeks.length)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => setShowPdfModal(true)} className="btn-secondary flex-1 text-xs">
          <Upload className="w-4 h-4" /> PDF Dieta
        </button>
        <button onClick={generateShoppingList} className="btn-secondary flex-1 text-xs">
          <ShoppingCart className="w-4 h-4" /> Lista Spesa
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS_OF_WEEK.map((day, idx) => {
          const isActive = idx === selectedDay;
          const dayMeals = week.days[idx].meals;
          const completedCount = dayMeals.filter((m) => m.completed).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xs font-medium">{day.slice(0, 3)}</span>
              <span className="text-lg font-bold">{completedCount}/{dayMeals.length}</span>
            </button>
          );
        })}
      </div>

      {isToday && (
        <div className="chip bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 w-fit">
          Oggi
        </div>
      )}

      {/* Meals */}
      <div className="space-y-3">
        {dayPlan.meals.map((meal) => {
          const Icon = ICON_MAP[MEAL_ICONS[meal.type]] ?? Utensils;
          return (
            <div
              key={meal.id}
              className={`card p-4 ${meal.completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  meal.completed ? 'bg-success-100 dark:bg-success-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                }`}>
                  <Icon className={`w-5 h-5 ${meal.completed ? 'text-success-600' : 'text-primary-600 dark:text-primary-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">{meal.type}</span>
                    {meal.calories > 0 && <span className="chip bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{meal.calories} kcal</span>}
                  </div>
                  <h3 className={`font-semibold text-gray-900 dark:text-white ${meal.completed ? 'line-through' : ''}`}>
                    {meal.name || 'Pasto non definito'}
                  </h3>
                  {meal.foods.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{meal.foods.join(', ')}</p>
                  )}
                  {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-blue-600 dark:text-blue-400">P {meal.protein}g</span>
                      <span className="text-accent-600 dark:text-accent-400">C {meal.carbs}g</span>
                      <span className="text-secondary-600 dark:text-secondary-400">G {meal.fat}g</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleMealComplete(selectedDay, meal.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      meal.completed
                        ? 'bg-success-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-success-100 hover:text-success-600'
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => setEditingMeal({ dayIdx: selectedDay, meal })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeal(selectedDay, meal.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-error-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add meal */}
      <div className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => addMeal(selectedDay, type)}
            className="chip bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {type}
          </button>
        ))}
      </div>

      {/* Week Manager Modal */}
      <Modal
        open={showWeekManager}
        onClose={() => setShowWeekManager(false)}
        title="Gestione Settimane"
        footer={
          <button onClick={addWeek} className="btn-primary w-full">
            <Plus className="w-4 h-4" /> Aggiungi Settimana
          </button>
        }
      >
        <div className="space-y-2">
          {state.weeks.map((w, idx) => (
            <div
              key={w.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                idx === weekIdx
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <button onClick={() => switchWeek(idx)} className="flex-1 text-left">
                <span className="font-medium text-gray-900 dark:text-white">{w.label}</span>
                <span className="text-xs text-gray-500 ml-2">{w.days.reduce((s, d) => s + d.meals.length, 0)} pasti</span>
              </button>
              {state.weeks.length > 1 && (
                <button onClick={() => deleteWeek(idx)} className="p-2 text-gray-400 hover:text-error-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* PDF Modal */}
      <Modal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title="PDF della Dieta"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Importa il file PDF della tua dieta per consultarla facilmente.
          </p>
          {pdfLoading ? (
            <div className="flex items-center justify-center py-4 text-primary-600 dark:text-primary-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="ml-2 text-sm font-medium">Lettura del PDF in corso...</span>
            </div>
          ) : (
            <label className="btn-primary w-full cursor-pointer">
              <Upload className="w-4 h-4" /> Carica PDF
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
            </label>
          )}
          {pdfError && (
            <div className="p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
              <span className="text-sm text-error-700 dark:text-error-300">{pdfError}</span>
            </div>
          )}
          {state.pdfText && (
            <div className="p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-success-600" />
              <span className="text-sm text-success-700 dark:text-success-300">{state.pdfText}</span>
              <button
                onClick={() => setState((prev) => ({ ...prev, pdfText: null }))}
                className="ml-auto p-1 text-gray-400 hover:text-error-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Meal Editor Sheet */}
      {editingMeal && (
        <MealEditor
          meal={editingMeal.meal}
          onSave={(m) => saveMeal(editingMeal.dayIdx, m)}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  );
}

function MealEditor({ meal, onSave, onClose }: { meal: Meal; onSave: (m: Meal) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Meal>(meal);
  const [foodInput, setFoodInput] = useState('');

  function addFood() {
    if (!foodInput.trim()) return;
    setDraft({ ...draft, foods: [...draft.foods, foodInput.trim()] });
    setFoodInput('');
  }

  return (
    <Sheet open onClose={onClose} title="Modifica Pasto">
      <div className="space-y-4">
        <div>
          <label className="label">Tipo Pasto</label>
          <select
            className="input"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as MealType })}
          >
            {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Nome Pasto</label>
          <input
            className="input"
            value={draft.name}
            placeholder="es. Colazione proteica"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Alimenti</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input"
              value={foodInput}
              placeholder="Aggiungi alimento..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFood())}
              onChange={(e) => setFoodInput(e.target.value)}
            />
            <button onClick={addFood} className="btn-primary shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.foods.map((f, i) => (
              <span key={i} className="chip bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {f}
                <button onClick={() => setDraft({ ...draft, foods: draft.foods.filter((_, idx) => idx !== i) })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Calorie (kcal)</label>
            <input type="number" className="input" value={draft.calories || ''} onChange={(e) => setDraft({ ...draft, calories: +e.target.value })} />
          </div>
          <div>
            <label className="label">Proteine (g)</label>
            <input type="number" className="input" value={draft.protein || ''} onChange={(e) => setDraft({ ...draft, protein: +e.target.value })} />
          </div>
          <div>
            <label className="label">Carbo (g)</label>
            <input type="number" className="input" value={draft.carbs || ''} onChange={(e) => setDraft({ ...draft, carbs: +e.target.value })} />
          </div>
          <div>
            <label className="label">Grassi (g)</label>
            <input type="number" className="input" value={draft.fat || ''} onChange={(e) => setDraft({ ...draft, fat: +e.target.value })} />
          </div>
        </div>

        <button onClick={() => onSave(draft)} className="btn-primary w-full">
          <Check className="w-4 h-4" /> Salva Pasto
        </button>
      </div>
    </Sheet>
  );
}
