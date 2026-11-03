import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { FOOD_CATEGORIES, type FoodEntry } from '@/lib/foodDatabase';
import { getFoodFamily } from '@/lib/foodFamilies';
import { categoryIcon, familyIcon } from '@/lib/foodIcons';

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

export function FoodCatalogTree<T extends FoodEntry>({ foods, renderFood }: {
  foods: T[];
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
    <div className="space-y-3">
      {tree.map((category) => {
        const categoryOpen = openCategory === category.name;
        const CategoryIcon = categoryIcon(category.name);
        return (
          <div key={category.name} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category.name)}
              aria-expanded={categoryOpen}
              className={`group tap-press w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-primary-500/5 ${categoryOpen ? 'bg-primary-500/10' : ''}`}
            >
              <span className="flex items-center gap-3.5 min-w-0">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 ring-1 ring-inset ring-primary-500/20 transition-transform duration-300 group-hover:scale-105 dark:text-primary-300 dark:ring-primary-400/25"
                  aria-hidden="true"
                >
                  <CategoryIcon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</span>
              </span>
              <span className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                {category.total}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${categoryOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {categoryOpen && (
              <div className="border-t border-gray-900/5 dark:border-white/[0.06] p-2 space-y-1 animate-slide-down">
                {category.families.map((family) => {
                  const key = `${category.name}::${family.name}`;
                  const familyOpen = openFamily === key;
                  const FamilyIcon = familyIcon(family.name, category.name);
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggleFamily(key)}
                        aria-expanded={familyOpen}
                        className={`group tap-press w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-primary-500/5 ${familyOpen ? 'bg-primary-500/10' : ''}`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${familyOpen ? 'bg-primary-500/15 text-primary-600 dark:text-primary-300' : 'bg-gray-900/5 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'}`}
                            aria-hidden="true"
                          >
                            <FamilyIcon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{family.name}</span>
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                          {family.foods.length}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${familyOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </span>
                      </button>

                      {familyOpen && (
                        <div className="pl-2 pb-2 pt-1 space-y-2 animate-slide-down">
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
