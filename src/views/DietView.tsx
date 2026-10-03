import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { createEmptyWeek, createEmptyMeal, uid, todayISO, dateForWeekday } from '@/lib/data';
import { PlanImportPanel } from '@/components/PlanImportPanel';
import { isUnknownFood, stripUnknown, resolveFood, foodLabel, NUTRIENT_KEYS } from '@/lib/dietBuilder';
import { parseFood } from '@/lib/dietText';
import { DAYS_OF_WEEK, MEAL_TYPES, MEAL_ICONS, type Meal, type MealType, type WeekPlan } from '@/types';
import { Modal } from '@/components/Modal';
import { Sheet } from '@/components/Sheet';
import {
  ChevronLeft, ChevronRight, Plus, Check, Trash2, Pencil, ClipboardPaste,
  Sunrise, Apple, Utensils, Cookie, Moon, ShoppingCart, X, AlertTriangle,
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
  const [renaming, setRenaming] = useState<{ id: string; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const week = state.weeks[weekIdx] ?? state.weeks[0];

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
    const meal = week?.days[dayIdx]?.meals.find((m) => m.id === mealId);
    if (!meal) return;
    const date = dateForWeekday(dayIdx);
    setState((prev) => {
      const history = { ...(prev.mealHistory ?? {}) };
      const dayLog = (history[date] ?? []).filter((h) => h.id !== mealId);
      if (!meal.completed) dayLog.push({ id: meal.id, type: meal.type, name: meal.name || meal.type, calories: meal.calories });
      history[date] = dayLog;
      return {
        ...prev,
        mealHistory: history,
        weeks: prev.weeks.map((w, wi) => wi !== weekIdx ? w : {
          ...w,
          days: w.days.map((d, di) => di !== dayIdx ? d : {
            ...d,
            meals: d.meals.map((m) => m.id === mealId ? { ...m, completed: !m.completed } : m),
          }),
        }),
      };
    });
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

  function saveRename() {
    if (!renaming) return;
    const label = renaming.text.trim().slice(0, 40);
    if (label) updateWeeks((weeks) => weeks.map((w) => (w.id === renaming.id ? { ...w, label } : w)));
    setRenaming(null);
  }

  function clearDiet() {
    const fresh = createEmptyWeek('Settimana 1');
    setState((prev) => ({ ...prev, weeks: [fresh], activeWeekId: fresh.id, pdfText: null }));
    setWeekIdx(0);
    setConfirmClear(false);
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
          <Pencil className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
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
          <ClipboardPaste className="w-4 h-4" /> Incolla dieta
        </button>
        <button onClick={generateShoppingList} className="btn-secondary flex-1 text-xs">
          <ShoppingCart className="w-4 h-4" /> Lista Spesa
        </button>
        <button
          onClick={() => setConfirmClear(true)}
          className="btn-secondary !px-3 text-xs hover:!text-error-600 hover:!border-error-300 transition-colors"
          aria-label="Cancella dieta"
        >
          <X className="w-4 h-4" /> <span className="hidden sm:inline">Cancella dieta</span>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {meal.foods.map((f, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {isUnknownFood(f) ? (
                            <span className="text-warning-700 dark:text-warning-400 font-medium">{stripUnknown(f)} (sconosciuto)</span>
                          ) : f}
                        </span>
                      ))}
                    </p>
                  )}
                  {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      <span className="text-blue-600 dark:text-blue-400">P {meal.protein}g</span>
                      <span className="text-accent-600 dark:text-accent-400">C {meal.carbs}g</span>
                      <span className="text-secondary-600 dark:text-secondary-400">G {meal.fat}g</span>
                      {meal.saturatedFat > 0 && <span className="text-rose-600">Sat {meal.saturatedFat}g</span>}
                      {meal.sugar > 0 && <span className="text-pink-500">Zuc {meal.sugar}g</span>}
                      {meal.fiber > 0 && <span className="text-green-600">Fib {meal.fiber}g</span>}
                      {meal.sodium > 0 && <span className="text-orange-500">Na {meal.sodium}mg</span>}
                      {meal.potassium > 0 && <span className="text-teal-500">K {meal.potassium}mg</span>}
                      {meal.calcium > 0 && <span className="text-amber-600">Ca {meal.calcium}mg</span>}
                      {meal.iron > 0 && <span className="text-red-500">Fe {meal.iron}mg</span>}
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
          <div className="flex gap-2 w-full">
            <button onClick={() => setConfirmClear(true)} className="btn-secondary flex-1 hover:!text-error-600">
              <X className="w-4 h-4" /> Cancella dieta
            </button>
            <button onClick={addWeek} className="btn-primary flex-1">
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          </div>
        }
      >
        <p className="text-xs text-gray-500 mb-3">Tocca una settimana per aprirla, la matita per rinominarla.</p>
        <div className="space-y-2">
          {state.weeks.map((w, idx) => (
            <div
              key={w.id}
              className={`flex items-center gap-1 p-3 rounded-xl border transition-colors ${
                idx === weekIdx
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {renaming?.id === w.id ? (
                <input
                  autoFocus
                  className="input flex-1 !py-1.5"
                  value={renaming.text}
                  maxLength={40}
                  aria-label="Nome settimana"
                  onChange={(e) => setRenaming({ id: w.id, text: e.target.value })}
                  onBlur={saveRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); else if (e.key === 'Escape') setRenaming(null); }}
                />
              ) : (
                <button onClick={() => switchWeek(idx)} className="flex-1 min-w-0 text-left">
                  <span className="font-medium text-gray-900 dark:text-white">{w.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{w.days.reduce((s, d) => s + d.meals.filter((m) => m.foods.length > 0).length, 0)} pasti</span>
                </button>
              )}
              {renaming?.id === w.id ? (
                <button onMouseDown={(e) => e.preventDefault()} onClick={saveRename} className="p-2 text-primary-600" aria-label="Salva nome">
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setRenaming({ id: w.id, text: w.label })} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" aria-label={`Rinomina ${w.label}`}>
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {state.weeks.length > 1 && (
                <button onClick={() => deleteWeek(idx)} className="p-2 text-gray-400 hover:text-error-600 transition-colors" aria-label={`Elimina ${w.label}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Cancellare la dieta?">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Verranno eliminate tutte le settimane ({state.weeks.length}) con i relativi pasti e il piano ripartira da una settimana vuota. Lo storico dei pasti gia consumati resta salvato.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setConfirmClear(false)} className="btn-secondary flex-1">Annulla</button>
          <button onClick={clearDiet} className="btn-primary flex-1 !bg-error-600 hover:!bg-error-700">
            <Trash2 className="w-4 h-4" /> Cancella
          </button>
        </div>
      </Modal>

      <Modal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title="Importa dieta (copia e incolla)"
      >
        <PlanImportPanel
          onImported={(o) => {
            if (o?.kind === 'diet') {
              setWeekIdx(o.firstWeekIndex);
              setShowPdfModal(false);
            }
          }}
        />
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
  const { state } = useApp();
  const [draft, setDraft] = useState<Meal>(meal);
  const [foodInput, setFoodInput] = useState('');
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const unknownCount = draft.foods.filter(isUnknownFood).length;

  function lookUp(text: string, addValues: boolean, base: Meal): { label: string; meal: Meal } {
    const parsed = parseFood(text);
    if (!parsed) return { label: text, meal: base };
    const line = resolveFood(parsed.name, parsed.grams, state.customFoods);
    if (!line.matched) {
      setNote(`"${parsed.name}" non e nel database: inserisci i valori a mano qui sotto.`);
      return { label: foodLabel(parsed.name, parsed.grams), meal: base };
    }
    setNote(parsed.grams > 0 ? `Trovato: ${line.label}. Valori aggiunti al pasto.` : `Trovato: ${line.label}. Indica i grammi (es. 80 g) per calcolare i valori.`);
    if (!addValues || parsed.grams <= 0) return { label: line.label, meal: base };
    const next = { ...base };
    NUTRIENT_KEYS.forEach((k) => { next[k] = Math.round((base[k] + line.values[k]) * 10) / 10; });
    return { label: line.label, meal: next };
  }

  function addFood() {
    const text = foodInput.trim();
    if (!text) return;
    const { label, meal: next } = lookUp(text, true, draft);
    setDraft({ ...next, foods: [...next.foods, label] });
    setFoodInput('');
  }

  function confirmEdit() {
    if (!editing) return;
    const text = editing.text.trim();
    const original = draft.foods[editing.index];
    if (!text) return removeFood(editing.index);
    const { label, meal: next } = lookUp(text, isUnknownFood(original), draft);
    setDraft({ ...next, foods: next.foods.map((f, i) => (i === editing.index ? label : f)) });
    setEditing(null);
  }

  function removeFood(index: number) {
    setDraft({ ...draft, foods: draft.foods.filter((_, i) => i !== index) });
    setEditing(null);
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
          {unknownCount > 0 && (
            <div className="flex items-start gap-2 p-2.5 mb-2 rounded-xl bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs leading-relaxed">
                {unknownCount === 1 ? '1 alimento non riconosciuto' : `${unknownCount} alimenti non riconosciuti`}: toccalo per correggerlo (es. "riso basmati 80 g") o eliminalo.
              </p>
            </div>
          )}
          {editing && (
            <div className="flex gap-2 mb-2 animate-fade-in">
              <input
                autoFocus
                className="input"
                value={editing.text}
                aria-label="Correggi alimento"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); } else if (e.key === 'Escape') setEditing(null); }}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              />
              <button onClick={confirmEdit} className="btn-primary shrink-0" aria-label="Conferma correzione">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary shrink-0" aria-label="Annulla correzione">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {note && <p className="text-xs text-gray-500 mb-2">{note}</p>}
          <div className="flex flex-wrap gap-2">
            {draft.foods.map((f, i) => {
              const unknown = isUnknownFood(f);
              const active = editing?.index === i;
              return (
                <span
                  key={i}
                  className={`chip transition-all ${active ? 'ring-2 ring-primary-500' : ''} ${
                    unknown
                      ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200 border border-dashed border-warning-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <button
                    onClick={() => { setNote(null); setEditing({ index: i, text: stripUnknown(f) }); }}
                    className="flex items-center gap-1 hover:underline"
                    aria-label={`Correggi ${stripUnknown(f)}`}
                  >
                    {unknown && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
                    {stripUnknown(f)}
                    {unknown && <span className="font-semibold">- sconosciuto</span>}
                  </button>
                  <button onClick={() => removeFood(i)} aria-label={`Elimina ${stripUnknown(f)}`} className="hover:text-error-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
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
            <label className="label">Carboidrati (g)</label>
            <input type="number" className="input" value={draft.carbs || ''} onChange={(e) => setDraft({ ...draft, carbs: +e.target.value })} />
          </div>
          <div>
            <label className="label">Grassi (g)</label>
            <input type="number" className="input" value={draft.fat || ''} onChange={(e) => setDraft({ ...draft, fat: +e.target.value })} />
          </div>
          <div>
            <label className="label">Grassi Saturi (g)</label>
            <input type="number" className="input" value={draft.saturatedFat || ''} onChange={(e) => setDraft({ ...draft, saturatedFat: +e.target.value })} />
          </div>
          <div>
            <label className="label">Zuccheri (g)</label>
            <input type="number" className="input" value={draft.sugar || ''} onChange={(e) => setDraft({ ...draft, sugar: +e.target.value })} />
          </div>
          <div>
            <label className="label">Fibre (g)</label>
            <input type="number" className="input" value={draft.fiber || ''} onChange={(e) => setDraft({ ...draft, fiber: +e.target.value })} />
          </div>
          <div>
            <label className="label">Sodio (mg)</label>
            <input type="number" className="input" value={draft.sodium || ''} onChange={(e) => setDraft({ ...draft, sodium: +e.target.value })} />
          </div>
          <div>
            <label className="label">Potassio (mg)</label>
            <input type="number" className="input" value={draft.potassium || ''} onChange={(e) => setDraft({ ...draft, potassium: +e.target.value })} />
          </div>
          <div>
            <label className="label">Calcio (mg)</label>
            <input type="number" className="input" value={draft.calcium || ''} onChange={(e) => setDraft({ ...draft, calcium: +e.target.value })} />
          </div>
          <div>
            <label className="label">Ferro (mg)</label>
            <input type="number" className="input" value={draft.iron || ''} onChange={(e) => setDraft({ ...draft, iron: +e.target.value })} />
          </div>
        </div>

        <button onClick={() => onSave(draft)} className="btn-primary w-full">
          <Check className="w-4 h-4" /> Salva Pasto
        </button>
      </div>
    </Sheet>
  );
}
