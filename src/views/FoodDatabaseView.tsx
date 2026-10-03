import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { FOOD_DATABASE, FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { uid } from '@/lib/data';
import { Sheet } from '@/components/Sheet';
import { FOOD_FAMILIES, getFoodFamily } from '@/lib/foodFamilies';
import { FoodPicker } from '@/components/food/FoodPicker';
import { BarcodeScanner } from '@/components/food/BarcodeScanner';
import { Search, Plus, Pencil, Trash2, BookOpen, Check, ChevronDown, ChevronUp, Calendar, Utensils, Repeat, ArrowRight, ScanBarcode } from 'lucide-react';
import type { CustomFoodEntry, MealType, Meal } from '@/types';
import { MEAL_TYPES, DAYS_OF_WEEK } from '@/types';

type CombinedFood = FoodEntry | CustomFoodEntry;

function isCustom(food: CombinedFood): boolean {
  return !FOOD_DATABASE.some((f) => f.id === food.id);
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Cereali': '🌾', 'Legumi': '🫘', 'Carni Bianche': '🍗', 'Carni Rosse': '🥩',
  'Pesce': '🐟', 'Verdure': '🥬', 'Frutta': '🍎', 'Condimenti': '🫒',
  'Latticini': '🧀', 'Uova': '🥚', 'Sushi / Piatti Misti': '🍣',
  'Snack / Dolci': '🍫', 'Bevande': '🥤', 'Frutta Secca': '🥜',
  'Pasta': '🍝', 'Pane e Pizza': '🍕', 'Salumi': '🍖', 'Vini e Alcolici': '🍷',
};

const KEYWORD_EMOJI: { kw: string; emoji: string }[] = [
  { kw: 'riso', emoji: '🍚' }, { kw: 'pasta', emoji: '🍝' }, { kw: 'pane', emoji: '🍞' },
  { kw: 'pizza', emoji: '🍕' }, { kw: 'pollo', emoji: '🍗' }, { kw: 'tacchino', emoji: '🦃' },
  { kw: 'manzo', emoji: '🥩' }, { kw: 'salmone', emoji: '🐟' }, { kw: 'tonno', emoji: '🐟' },
  { kw: 'merluzzo', emoji: '🐟' }, { kw: 'gamberi', emoji: '🦐' }, { kw: 'calamari', emoji: '🦑' },
  { kw: 'cozze', emoji: '🦪' }, { kw: 'uovo', emoji: '🥚' }, { kw: 'albume', emoji: '🥚' },
  { kw: 'latte', emoji: '🥛' }, { kw: 'yogurt', emoji: '🥛' }, { kw: 'mozzarella', emoji: '🧀' },
  { kw: 'parmigiano', emoji: '🧀' }, { kw: 'formaggio', emoji: '🧀' }, { kw: 'ricotta', emoji: '🧀' },
  { kw: 'mela', emoji: '🍎' }, { kw: 'banana', emoji: '🍌' }, { kw: 'arancia', emoji: '🍊' },
  { kw: 'limone', emoji: '🍋' }, { kw: 'uva', emoji: '🍇' }, { kw: 'fragole', emoji: '🍓' },
  { kw: 'kiwi', emoji: '🥝' }, { kw: 'ananas', emoji: '🍍' }, { kw: 'anguria', emoji: '🍉' },
  { kw: 'melone', emoji: '🍈' }, { kw: 'avocado', emoji: '🥑' }, { kw: 'pomodoro', emoji: '🍅' },
  { kw: 'patate', emoji: '🥔' }, { kw: 'carote', emoji: '🥕' }, { kw: 'broccoli', emoji: '🥦' },
  { kw: 'insalata', emoji: '🥗' }, { kw: 'spinaci', emoji: '🥬' }, { kw: 'cipolle', emoji: '🧅' },
  { kw: 'aglio', emoji: '🧄' }, { kw: 'peperoni', emoji: '🫑' }, { kw: 'zucchine', emoji: '🥒' },
  { kw: 'melanzane', emoji: '🍆' }, { kw: 'funghi', emoji: '🍄' }, { kw: 'zucca', emoji: '🎃' },
  { kw: 'mandorle', emoji: '🌰' }, { kw: 'noci', emoji: '🌰' }, { kw: 'nocciole', emoji: '🌰' },
  { kw: 'pistacchi', emoji: '🌰' }, { kw: 'arachidi', emoji: '🥜' }, { kw: 'datteri', emoji: '🌴' },
  { kw: 'olio', emoji: '🫒' }, { kw: 'burro', emoji: '🧈' }, { kw: 'miele', emoji: '🍯' },
  { kw: 'zucchero', emoji: '🧂' }, { kw: 'sale', emoji: '🧂' }, { kw: 'caffe', emoji: '☕' },
  { kw: 'the', emoji: '🍵' }, { kw: 'cappuccino', emoji: '☕' }, { kw: 'cioccolato', emoji: '🍫' },
  { kw: 'gelato', emoji: '🍦' }, { kw: 'biscotti', emoji: '🍪' }, { kw: 'croissant', emoji: '🥐' },
  { kw: 'patatine', emoji: '🍟' }, { kw: 'popcorn', emoji: '🍿' }, { kw: 'sushi', emoji: '🍣' },
  { kw: 'sashimi', emoji: '🍣' }, { kw: 'tempura', emoji: '🍤' }, { kw: 'ramen', emoji: '🍜' },
  { kw: 'udon', emoji: '🍜' }, { kw: 'gyoza', emoji: '🥟' }, { kw: 'tofu', emoji: '🧈' },
  { kw: 'edamame', emoji: '🫛' }, { kw: 'hummus', emoji: '🥙' }, { kw: 'pesto', emoji: '🌿' },
  { kw: 'soia', emoji: '🫘' }, { kw: 'lenticchie', emoji: '🫘' }, { kw: 'ceci', emoji: '🫘' },
  { kw: 'fagioli', emoji: '🫘' }, { kw: 'piselli', emoji: '🫛' }, { kw: 'fave', emoji: '🫛' },
  { kw: 'prosciutto', emoji: '🍖' }, { kw: 'bresaola', emoji: '🍖' }, { kw: 'salsiccia', emoji: '🌭' },
  { kw: 'pancetta', emoji: '🥓' }, { kw: 'wurstel', emoji: '🌭' }, { kw: 'acqua', emoji: '💧' },
  { kw: 'birra', emoji: '🍺' }, { kw: 'vino', emoji: '🍷' }, { kw: 'succo', emoji: '🧃' },
  { kw: 'smoothie', emoji: '🥤' }, { kw: 'frullato', emoji: '🥤' }, { kw: 'kefir', emoji: '🥛' },
  { kw: 'frittata', emoji: '🍳' }, { kw: 'tuorlo', emoji: '🥚' }, { kw: 'cous', emoji: '🍚' },
  { kw: 'quinoa', emoji: '🌾' }, { kw: 'avena', emoji: '🥣' }, { kw: 'farro', emoji: '🌾' },
  { kw: 'grano', emoji: '🌾' }, { kw: 'crackers', emoji: '🍘' }, { kw: 'tortilla', emoji: '🫓' },
  { kw: 'polenta', emoji: '🌽' }, { kw: 'muesli', emoji: '🥣' }, { kw: 'cornflakes', emoji: '🥣' },
  { kw: 'nutella', emoji: '🍫' }, { kw: 'marmellata', emoji: '🍯' }, { kw: 'ketchup', emoji: '🥫' },
  { kw: 'maionese', emoji: '🥚' }, { kw: 'salsa', emoji: '🥫' }, { kw: 'aceto', emoji: '🫗' },
  { kw: 'passata', emoji: '🍅' }, { kw: 'olive', emoji: '🫒' }, { kw: 'barretta', emoji: '🍫' },
  { kw: 'pudding', emoji: '🍮' }, { kw: 'tisana', emoji: '🍵' }, { kw: 'chinotto', emoji: '🥤' },
  { kw: 'cocco', emoji: '🥥' }, { kw: 'mandarino', emoji: '🍊' }, { kw: 'pompelmo', emoji: '🍊' },
  { kw: 'mango', emoji: '🥭' }, { kw: 'pesca', emoji: '🍑' }, { kw: 'ciliegie', emoji: '🍒' },
  { kw: 'fichi', emoji: '🍂' }, { kw: 'albicocca', emoji: '🍑' }, { kw: 'pera', emoji: '🍐' },
  { kw: 'sedano', emoji: '🌱' }, { kw: 'asparagi', emoji: '🌱' }, { kw: 'finocchi', emoji: '🌱' },
  { kw: 'radicchio', emoji: '🥬' }, { kw: 'cavolo', emoji: '🥬' }, { kw: 'verze', emoji: '🥬' },
  { kw: 'rape', emoji: '🥬' }, { kw: 'cetrioli', emoji: '🥒' }, { kw: 'rucola', emoji: '🌿' },
  { kw: 'cicoria', emoji: '🌿' }, { kw: 'lattuga', emoji: '🥬' }, { kw: 'fagiolini', emoji: '🫛' },
  { kw: 'surgelati', emoji: '🧊' }, { kw: 'scatola', emoji: '🥫' }, { kw: 'affumicato', emoji: '💨' },
  { kw: 'arrosto', emoji: '🍗' }, { kw: 'cantonese', emoji: '🍚' }, { kw: 'noodles', emoji: '🍜' },
  { kw: 'jolly', emoji: '🍽️' }, { kw: 'misto', emoji: '🍽️' }, { kw: 'caciotta', emoji: '🧀' },
  { kw: 'feta', emoji: '🧀' }, { kw: 'gorgonzola', emoji: '🧀' }, { kw: 'stracchino', emoji: '🧀' },
  { kw: 'fontina', emoji: '🧀' }, { kw: 'asiago', emoji: '🧀' }, { kw: 'philadelphia', emoji: '🧀' },
  { kw: 'robiola', emoji: '🧀' }, { kw: 'cottage', emoji: '🧀' }, { kw: 'grana', emoji: '🧀' },
  { kw: 'pecorino', emoji: '🧀' }, { kw: 'uvetta', emoji: '🍇' }, { kw: 'prugne', emoji: '🌑' },
  { kw: 'semi', emoji: '🌱' }, { kw: 'tahina', emoji: '🥜' }, { kw: 'harissa', emoji: '🌶️' },
  { kw: 'senape', emoji: '🌶️' }, { kw: 'worchester', emoji: '🥫' }, { kw: 'tartara', emoji: '🥽' },
  { kw: 'vinaigrette', emoji: '🫗' }, { kw: 'panna', emoji: '🥛' }, { kw: 'margarina', emoji: '🧈' },
  { kw: 'sorbetto', emoji: '🍧' }, { kw: 'tiramisu', emoji: '🍰' }, { kw: 'ciambella', emoji: '🍩' },
];

function getFoodEmoji(name: string, category: string): string {
  const lower = name.toLowerCase();
  for (const { kw, emoji } of KEYWORD_EMOJI) {
    if (lower.includes(kw)) return emoji;
  }
  return CATEGORY_EMOJI[category] ?? '🍽️';
}

export function FoodDatabaseView() {
  const { state, setState } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingFood, setEditingFood] = useState<CustomFoodEntry | null>(null);
  const [addingFood, setAddingFood] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addToDietFood, setAddToDietFood] = useState<CombinedFood | null>(null);
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [scanning, setScanning] = useState(false);

  const allFoods: CombinedFood[] = useMemo(() => {
    return [...FOOD_DATABASE, ...state.customFoods];
  }, [state.customFoods]);

  const filtered = useMemo(() => {
    let result = allFoods;
    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
      if (selectedFamily !== 'all') {
        result = result.filter((f) => getFoodFamily(f) === selectedFamily);
      }
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allFoods, query, selectedCategory, selectedFamily]);

  function pickCategory(cat: string) {
    setSelectedCategory(cat);
    setSelectedFamily('all');
  }

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

  function saveScanned(food: CustomFoodEntry) {
    setState((prev) => ({ ...prev, customFoods: [...prev.customFoods, food] }));
    setScanning(false);
    setAddToDietFood(food);
  }

  function startEdit(food: CombinedFood) {
    if (!isCustom(food)) return;
    setEditingFood(food as CustomFoodEntry);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setScanning(true)}
        className="w-full card p-4 flex items-center gap-3 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <span className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
          <ScanBarcode className="w-5 h-5" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-gray-900 dark:text-white">Scannerizza Prodotto</span>
          <span className="block text-xs text-gray-500">Leggi il codice a barre e importa i valori nutrizionali</span>
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
      </button>

      <FoodPicker onAdd={setAddToDietFood} />

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

      {/* Collapsible category filter */}
      <div className="card p-3">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
          aria-expanded={showFilters}
          aria-label="Mostra o nascondi i filtri per categoria"
        >
          <span>
            Filtra per categoria
            {selectedCategory !== 'all' && (
              <span className="chip bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ml-2">{selectedCategory}</span>
            )}
          </span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 animate-fade-in" role="group" aria-label="Categorie alimentari">
            <button
              onClick={() => pickCategory('all')}
              className={`chip ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              aria-pressed={selectedCategory === 'all'}
            >
              Tutti
            </button>
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => pickCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                aria-pressed={selectedCategory === cat}
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>
        )}

        {selectedCategory !== 'all' && (FOOD_FAMILIES.get(selectedCategory)?.length ?? 0) > 1 && (
          <select
            className="input mt-3"
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            aria-label="Filtra per tipologia"
          >
            <option value="all">Tutte le tipologie</option>
            {FOOD_FAMILIES.get(selectedCategory)?.map((fam) => (
              <option key={fam.name} value={fam.name}>{fam.name} ({fam.foods.length})</option>
            ))}
          </select>
        )}
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
            onAddToDiet={() => setAddToDietFood(food)}
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

      {scanning && <BarcodeScanner onClose={() => setScanning(false)} onSave={saveScanned} />}

      {/* Add to diet sheet */}
      {addToDietFood && (
        <AddToDietSheet
          food={addToDietFood}
          onClose={() => setAddToDietFood(null)}
        />
      )}
    </div>
  );
}

function FoodCard({ food, custom, onEdit, onDelete, onAddToDiet }: {
  food: CombinedFood;
  custom: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddToDiet: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between text-left gap-3"
        aria-expanded={expanded}
        aria-label={`Valori nutrizionali di ${food.name}, ${food.calories} calorie per 100 grammi. Tocca per dettagli.`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0"
            aria-hidden="true"
          >
            {getFoodEmoji(food.name, food.category)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white">{food.name}</span>
              {custom && (
                <span className="chip bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300 text-[10px]">
                  Personalizzato
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{food.category} · {getFoodFamily(food as FoodEntry)}</span>
          </div>
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

          <button onClick={onAddToDiet} className="btn-primary w-full text-sm mt-2">
            <Plus className="w-4 h-4" /> Aggiungi alla Dieta
          </button>

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

function AddToDietSheet({ food, onClose }: { food: CombinedFood; onClose: () => void }) {
  const { state, setState } = useApp();
  const [targetDay, setTargetDay] = useState((new Date().getDay() + 6) % 7);
  const [targetMeal, setTargetMeal] = useState<MealType>('Pranzo');
  const [asIngredient, setAsIngredient] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [grams, setGrams] = useState(100);

  const factor = grams / 100;

  function toggleRecurringDay(day: string) {
    setRecurringDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day]);
  }

  function addToDiet() {
    const scaledCalories = Math.round(food.calories * factor);
    const scaledProtein = Math.round(food.protein * factor * 10) / 10;
    const scaledCarbs = Math.round(food.carbs * factor * 10) / 10;
    const scaledFat = Math.round(food.fat * factor * 10) / 10;
    const scaledSatFat = Math.round(food.saturatedFat * factor * 10) / 10;
    const scaledSugar = Math.round(food.sugar * factor * 10) / 10;
    const scaledFiber = Math.round(food.fiber * factor * 10) / 10;
    const scaledSodium = Math.round(food.sodium * factor);
    const scaledPotassium = Math.round(food.potassium * factor);
    const scaledCalcium = Math.round(food.calcium * factor);
    const scaledIron = Math.round(food.iron * factor * 100) / 100;

    setState((prev) => {
      const weeks = [...prev.weeks];
      if (weeks.length === 0) return prev;

      const applyToDays = recurring && recurringDays.length > 0
        ? recurringDays.map((d) => DAYS_OF_WEEK.indexOf(d)).filter((i) => i >= 0)
        : [targetDay];

      const activeIdx = Math.max(0, weeks.findIndex((w) => w.id === prev.activeWeekId));
      const updatedWeeks = weeks.map((w, wi) => {
        if (wi !== activeIdx) return w;
        return {
          ...w,
          days: w.days.map((d, di) => {
            if (!applyToDays.includes(di)) return d;
            if (asIngredient) {
              const existingMeal = d.meals.find((m) => m.type === targetMeal);
              if (existingMeal) {
                return {
                  ...d,
                  meals: d.meals.map((m) => {
                    if (m.id !== existingMeal.id) return m;
                    return {
                      ...m,
                      foods: [...m.foods, `${food.name} (${grams}g)`],
                      calories: m.calories + scaledCalories,
                      protein: Math.round((m.protein + scaledProtein) * 10) / 10,
                      carbs: Math.round((m.carbs + scaledCarbs) * 10) / 10,
                      fat: Math.round((m.fat + scaledFat) * 10) / 10,
                      saturatedFat: Math.round((m.saturatedFat + scaledSatFat) * 10) / 10,
                      sugar: Math.round((m.sugar + scaledSugar) * 10) / 10,
                      fiber: Math.round((m.fiber + scaledFiber) * 10) / 10,
                      sodium: m.sodium + scaledSodium,
                      potassium: m.potassium + scaledPotassium,
                      calcium: m.calcium + scaledCalcium,
                      iron: Math.round((m.iron + scaledIron) * 100) / 100,
                    };
                  }),
                };
              }
            }
            const newMeal: Meal = {
              id: uid(),
              type: targetMeal,
              name: asIngredient ? `${food.name} (${grams}g)` : food.name,
              foods: [`${food.name} (${grams}g)`],
              calories: scaledCalories,
              protein: scaledProtein,
              carbs: scaledCarbs,
              fat: scaledFat,
              saturatedFat: scaledSatFat,
              sugar: scaledSugar,
              fiber: scaledFiber,
              sodium: scaledSodium,
              potassium: scaledPotassium,
              calcium: scaledCalcium,
              iron: scaledIron,
              completed: false,
              recurring,
              recurringDays: recurring ? recurringDays : [],
            };
            return { ...d, meals: [...d.meals, newMeal] };
          }),
        };
      });

      return { ...prev, weeks: updatedWeeks };
    });

    onClose();
  }

  return (
    <Sheet open onClose={onClose} title={`Aggiungi: ${food.name}`}>
      <div className="space-y-4">
        {/* Grams */}
        <div>
          <label className="label">Quantita (grammi)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="input flex-1"
              value={grams}
              min="1"
              onChange={(e) => setGrams(Math.max(1, +e.target.value))}
              aria-label="Quantita in grammi"
            />
            <span className="text-sm text-gray-500">g</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Calorie: {Math.round(food.calories * factor)} kcal - P: {Math.round(food.protein * factor * 10) / 10}g - C: {Math.round(food.carbs * factor * 10) / 10}g - G: {Math.round(food.fat * factor * 10) / 10}g
          </p>
        </div>

        {/* Day selector */}
        <div>
          <label className="label flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Giorno</label>
          <select
            className="input"
            value={targetDay}
            onChange={(e) => setTargetDay(+e.target.value)}
            aria-label="Seleziona il giorno della settimana"
          >
            {DAYS_OF_WEEK.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </div>

        {/* Meal selector */}
        <div>
          <label className="label flex items-center gap-1.5"><Utensils className="w-4 h-4" /> Pasto</label>
          <select
            className="input"
            value={targetMeal}
            onChange={(e) => setTargetMeal(e.target.value as MealType)}
            aria-label="Seleziona il pasto"
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Main vs ingredient */}
        <div>
          <label className="label">Tipo di aggiunta</label>
          <div className="flex gap-2">
            <button
              onClick={() => setAsIngredient(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${asIngredient ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              aria-pressed={asIngredient}
            >
              Ingrediente
            </button>
            <button
              onClick={() => setAsIngredient(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!asIngredient ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              aria-pressed={!asIngredient}
            >
              Pasto principale
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {asIngredient ? "Aggiunge i valori nutrizionali al pasto selezionato" : "Crea un nuovo pasto separato"}
          </p>
        </div>

        {/* Recurrence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label flex items-center gap-1.5 mb-0"><Repeat className="w-4 h-4" /> Ricorrenza</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                aria-label="Imposta come ricorrente"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-600 transition-colors">
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${recurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          {recurring && (
            <div className="flex flex-wrap gap-2 animate-fade-in" role="group" aria-label="Giorni di ricorrenza">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleRecurringDay(d)}
                  className={`chip ${recurringDays.includes(d) ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  aria-pressed={recurringDays.includes(d)}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={addToDiet} className="btn-primary w-full">
          <Check className="w-4 h-4" /> Conferma aggiunta
        </button>
      </div>
    </Sheet>
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
