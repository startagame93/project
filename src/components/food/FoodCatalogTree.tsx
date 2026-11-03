import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { getFoodFamily } from '@/lib/foodFamilies';

interface FamilyNode<T> {
  name: string;
  foods: T[];
}

interface CategoryNode<T> {
  name: string;
  total: number;
  families: FamilyNode<T>[];
}

function categoryRank(category: string): number {
  const index = (FOOD_CATEGORIES as readonly string[]).indexOf(category);
  return index === -1 ? FOOD_CATEGORIES.length : index;
}

const FAMILY_EMOJI_RULES: [RegExp, string][] = [
  [/acqua/i, '💧'], [/succ/i, '🧃'], [/caff|tè|the\b|tisan/i, '☕'], [/birra/i, '🍺'],
  [/vin/i, '🍷'], [/liquor|amari|alcol/i, '🥃'], [/bibite|gassat|cola/i, '🥤'],
  [/pesce|tonno|salmone|gamber|frutti di mare/i, '🐟'], [/sushi|maki|nigiri/i, '🍣'],
  [/pollo|tacchino|coniglio|vitello|maiale/i, '🍗'], [/manzo|agnello|carni rosse|bovin/i, '🥩'],
  [/salumi|prosciutt|salame|wurstel/i, '🍖'], [/formagg/i, '🧀'], [/latte|yogurt|latticin/i, '🥛'],
  [/uova|uovo/i, '🥚'], [/pasta|spaghett|maccheron|lasagn|gnocch/i, '🍝'], [/pizza|pane|focacc/i, '🍕'],
  [/riso|cereal|farro|orzo|avena/i, '🌾'], [/legum|fagiol|lentic|ceci|piselli/i, '🫘'],
  [/burger|hamburger|panin/i, '🍔'], [/patat/i, '🍟'], [/taco|burrito|nachos|messic/i, '🌮'],
  [/dolc|dessert|biscott|cioccolat|gelat/i, '🍰'], [/frutta secca|noci|mandorl|nocciol/i, '🥜'],
  [/verdur|insalat|ortagg/i, '🥬'], [/frutta/i, '🍎'], [/olio|aceto|sal[ei]|spezie|salse?|condiment/i, '🫒'],
];

function familyEmoji(family: string, fallback: string | undefined): string {
  return FAMILY_EMOJI_RULES.find(([pattern]) => pattern.test(family))?.[1] ?? fallback ?? '🍽️';
}

function buildTree<T extends FoodEntry>(foods: T[]): CategoryNode<T>[] {
  const byCategory = new Map<string, Map<string, T[]>>();
  for (const food of foods) {
    const family = getFoodFamily(food);
    let families = byCategory.get(food.category);
    if (!families) byCategory.set(food.category, (families = new Map()));
    const list = families.get(family);
    if (list) list.push(food);
    else families.set(family, [food]);
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'it'))
    .map(([name, families]) => {
      const familyNodes = [...families.entries()]
        .map(([familyName, list]) => ({
          name: familyName,
          foods: list.sort((a, b) => a.name.localeCompare(b.name, 'it')),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'it'));
      return {
        name,
        total: familyNodes.reduce((sum, family) => sum + family.foods.length, 0),
        families: familyNodes,
      };
    });
}

export function FoodCatalogTree<T extends FoodEntry>({ foods, categoryEmoji, renderFood }: {
  foods: T[];
  categoryEmoji: Record<string, string>;
  renderFood: (food: T) => ReactNode;
}) {
  const tree = useMemo(() => buildTree(foods), [foods]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openFamily, setOpenFamily] = useState<string | null>(null);

  function toggleCategory(name: string) {
    setOpenCategory((current) => (current === name ? null : name));
    setOpenFamily(null);
  }

  function toggleFamily(key: string) {
    setOpenFamily((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-2">
      {tree.map((category) => {
        const categoryOpen = openCategory === category.name;
        return (
          <div key={category.name} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category.name)}
              aria-expanded={categoryOpen}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-xl" aria-hidden="true">{categoryEmoji[category.name] ?? '🍽️'}</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                {category.total}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {categoryOpen && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-2 space-y-1 animate-fade-in">
                {category.families.map((family) => {
                  const key = `${category.name}::${family.name}`;
                  const familyOpen = openFamily === key;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggleFamily(key)}
                        aria-expanded={familyOpen}
                        className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="text-base" aria-hidden="true">{familyEmoji(family.name, categoryEmoji[category.name])}</span>
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{family.name}</span>
                        </span>
                        <span className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                          {family.foods.length}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${familyOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </span>
                      </button>

                      {familyOpen && (
                        <div className="pl-2 pb-2 pt-1 space-y-2 animate-fade-in">
                          {family.foods.map((food) => (
                            <Fragment key={food.id}>{renderFood(food)}</Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
