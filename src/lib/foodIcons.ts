import {
  Apple, Bean as Legumes, Beef, Beer, Cookie, CupSoda, Croissant, Drumstick, Egg, Fish, Droplets,
  Ham, Leaf, Milk, Nut, Pizza, Salad, Sandwich, Soup, UtensilsCrossed, Utensils, Wheat, Wine, Coffee,
  GlassWater, Citrus, CakeSlice, Carrot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FoodCategory } from '@/lib/foodDatabase';

const CATEGORY_ICONS: Record<FoodCategory, LucideIcon> = {
  'Cereali': Wheat,
  'Legumi': Legumes,
  'Carni Bianche': Drumstick,
  'Carni Rosse': Beef,
  'Pesce': Fish,
  'Verdure': Salad,
  'Frutta': Apple,
  'Condimenti': Droplets,
  'Latticini': Milk,
  'Uova': Egg,
  'Sushi / Piatti Misti': UtensilsCrossed,
  'Snack / Dolci': Cookie,
  'Bevande': CupSoda,
  'Frutta Secca': Nut,
  'Pasta': Soup,
  'Pane e Pizza': Croissant,
  'Salumi': Ham,
  'Vini e Alcolici': Wine,
  'Fast Food': Sandwich,
};

const FAMILY_ICON_RULES: [RegExp, LucideIcon][] = [
  [/acqua/i, GlassWater], [/succ/i, Citrus], [/caff|tè|the\b|tisan/i, Coffee], [/birra/i, Beer],
  [/vin/i, Wine], [/liquor|amari|alcol/i, Wine], [/bibite|gassat|cola/i, CupSoda],
  [/pesce|tonno|salmone|gamber|frutti di mare/i, Fish], [/sushi|maki|nigiri/i, UtensilsCrossed],
  [/pollo|tacchino|coniglio|vitello|maiale/i, Drumstick], [/manzo|agnello|carni rosse|bovin/i, Beef],
  [/salumi|prosciutt|salame|wurstel/i, Ham], [/formagg|latte|yogurt|latticin/i, Milk],
  [/uova|uovo/i, Egg], [/pasta|spaghett|maccheron|lasagn|gnocch/i, Soup],
  [/pizza|pane|focacc/i, Pizza], [/riso|cereal|farro|orzo|avena/i, Wheat],
  [/legum|fagiol|lentic|ceci|piselli/i, Legumes], [/burger|hamburger|panin|taco|burrito|nachos|messic|patat/i, Sandwich],
  [/dolc|dessert|biscott|cioccolat|gelat/i, CakeSlice], [/frutta secca|noci|mandorl|nocciol/i, Nut],
  [/verdur|insalat|ortagg/i, Carrot], [/frutta/i, Apple],
  [/olio|aceto|sal[ei]|spezie|salse?|condiment/i, Leaf],
];

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category as FoodCategory] ?? Utensils;
}

export function familyIcon(family: string, category: string): LucideIcon {
  return FAMILY_ICON_RULES.find(([pattern]) => pattern.test(family))?.[1] ?? categoryIcon(category);
}
