import { MAX_WEEKS, EVERY_DAY, readMealType } from '@/lib/dietBuilder';

interface RawFood { name: string; grams: number }
interface RawMeal { type: string; name: string; foods: RawFood[] }
interface RawDay { day: number | typeof EVERY_DAY; meals: RawMeal[] }
export interface RawDietPlan { title: string; durationWeeks: number; weeks: { days: RawDay[] }[] }

const ORDINALS = ['prima', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima', 'ottava'];
const WEEK_RE = new RegExp(`^(?:(?:settimana|sett\\.?|week)\\s*(\\d+)|(${ORDINALS.join('|')})\\s+settimana)\\b`, 'i');
const DAY_RE = /^(luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica|lun|mar|mer|gio|ven|sab|dom)(?![a-zà-ù])\.?|^giorno\s*(\d+)\b/i;
const MEAL_RE = /^(colazione|prima colazione|spuntino(?:\s+(?:di\s+)?(?:met[aà]\s+mattina|mattutino|pomeridiano|serale))?|snack|pranzo|merenda|cena|dopo\s*cena)\b/i;
const NUTRIENT_RE = /^(?:totale|tot\.?|kcal|calorie|proteine|carboidrati|grassi|lipidi|fibre)\b|\b\d+\s*kcal\b/i;
const SKIP_RE = /^(?:oppure|in alternativa|alternativa|note?|n\.?b\.?|consigli)\b/i;
const DURATION_RE = /\b(?:per|durata(?: di)?)\s+(\d+)\s+settimane\b|\b(\d+)\s+settimane\b/i;
const DAY_PREFIX = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
// Breaks a continuous block (no line breaks) before every week, day and meal keyword.
const INLINE_BREAK = new RegExp(
  '\\s*(?=\\b(?:settimana\\s*\\d+|sett\\.\\s*\\d+|week\\s*\\d+|(?:' + ORDINALS.join('|') + ')\\s+settimana'
  + '|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica|giorno\\s*\\d+'
  + '|oppure|in\\s+alternativa|prima\\s+colazione|(?<!prima\\s)colazione|spuntino|snack|pranzo|merenda|dopo\\s*cena|(?<!dopo\\s?)cena)(?![a-zà-ù]))',
  'gi',
);

const UNIT_GRAMS: [RegExp, number][] = [
  [/^cucchiain[oi]$/, 5],
  [/^cucchia(?:io|i)$/, 10],
  [/^fett[ae]$/, 30],
  [/^vasett[oi]$/, 125],
  [/^tazz[ae]$/, 200],
  [/^bicchier[ei]$/, 200],
  [/^scatolett[ae]$/, 80],
  [/^manciat[ae]$/, 30],
];
const PIECE_GRAMS: [RegExp, number][] = [
  [/uov/, 60], [/mela|pera|arancia|pesca/, 150], [/banana/, 120], [/kiwi|mandarin/, 80],
  [/fett[ae] biscottat|biscott/, 10], [/gallett/, 8], [/yogurt/, 125], [/panin|rosetta/, 70],
];

function cleanLine(line: string): string {
  return line.replace(/^[\s\-–•·*>▪◦●○]+/, '').replace(/^\d+[.)]\s+/, '').trim();
}

function afterHeader(line: string, match: RegExpMatchArray): string {
  return line
    .slice(match[0].length)
    .replace(/^\s*\([^)]*\)/, '')
    .replace(/^[\s:\-–.]+/, '')
    .replace(/^(?:ore\s*)?\d{1,2}[:.]\d{2}\s*/i, '')
    .replace(/^[\s:\-–.]+/, '')
    .trim();
}

export function parseFood(raw: string): RawFood | null {
  let text = raw
    .replace(/\((\d+(?:[.,]\d+)?\s*(?:kg|g|gr|grammi|ml|cl|l))\)/gi, ' $1 ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bq\.?\s?b\.?\b/gi, ' ')
    .trim();
  if (!text || !/[a-zà-ù]/i.test(text)) return null;
  let grams = 0;

  const gramMatch = /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grammi|ml|cl|l)\b/i.exec(text) ?? /\b(g|gr|ml)\s*(\d+(?:[.,]\d+)?)/i.exec(text);
  if (gramMatch) {
    const [value, unit] = /^\d/.test(gramMatch[1]) ? [gramMatch[1], gramMatch[2]] : [gramMatch[2], gramMatch[1]];
    const n = parseFloat(value.replace(',', '.'));
    const factor = /^kg$|^l$/i.test(unit) ? 1000 : /^cl$/i.test(unit) ? 10 : 1;
    grams = Math.round(n * factor);
    text = text.replace(gramMatch[0], ' ');
  } else {
    const countMatch = /(?:^|\s)(\d+(?:[.,]\d+)?|mezz[oa]|un[oa']?)\s+([a-zà-ù]+)?/i.exec(text);
    if (countMatch) {
      const word = countMatch[1].toLowerCase();
      const count = /^mezz/.test(word) ? 0.5 : /^un/.test(word) ? 1 : parseFloat(word.replace(',', '.'));
      const unit = (countMatch[2] ?? '').toLowerCase();
      const unitGrams = /^fett/.test(unit) && /biscott/i.test(text) ? 10 : UNIT_GRAMS.find(([re]) => re.test(unit))?.[1];
      if (unitGrams) {
        grams = Math.round(count * unitGrams);
        text = text.replace(countMatch[0], ' ');
      } else if (/^\d/.test(word) || /^mezz/.test(word)) {
        const lower = text.toLowerCase();
        grams = Math.round(count * (PIECE_GRAMS.find(([re]) => re.test(lower))?.[1] ?? 100));
        text = text.replace(countMatch[1], ' ');
      }
    }
  }

  const name = text
    .replace(/\b(?:pz|pezz[oi]|circa|a piacere)\b\.?/gi, ' ')
    .replace(/[:\-–•·*.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:di|d')\s*/i, '');
  return name.length >= 2 ? { name: name.charAt(0).toUpperCase() + name.slice(1), grams } : null;
}

function splitFoods(text: string): RawFood[] {
  return text
    .split(/[;,](?!\d)|\s\+\s|\s\/\s|\s+e\s+(?=\d)/)
    .map((part) => parseFood(part))
    .filter((f): f is RawFood => !!f);
}

function dayFromMatch(m: RegExpMatchArray): number {
  if (m[2]) return (Math.max(1, parseInt(m[2], 10)) - 1) % 7;
  return DAY_PREFIX.indexOf(m[1].toLowerCase().slice(0, 3));
}

/** Reads a diet written as free text (pasted from PDF, Word, notes) into the structure accepted by buildDietWeeks. */
export function parseDietText(text: string): RawDietPlan {
  const lines = text.replace(/\r/g, '').replace(INLINE_BREAK, '\n').split('\n').map(cleanLine).filter(Boolean);
  const weeks: { days: RawDay[] }[] = [{ days: [] }];
  let durationWeeks = 0;
  let title = '';
  let weekIdx = 0;
  let day: RawDay | null = null;
  let meal: RawMeal | null = null;
  let skipping = false;

  const currentDay = (): RawDay => {
    if (!day) {
      day = { day: EVERY_DAY, meals: [] };
      weeks[weekIdx].days.push(day);
    }
    return day;
  };

  for (let line of lines) {
    const duration = DURATION_RE.exec(line);
    if (duration) durationWeeks = Math.max(durationWeeks, parseInt(duration[1] ?? duration[2], 10));

    const week = WEEK_RE.exec(line);
    if (week) {
      const n = week[1] ? parseInt(week[1], 10) : ORDINALS.indexOf(week[2].toLowerCase()) + 1;
      weekIdx = Math.min(Math.max(n, 1), MAX_WEEKS) - 1;
      while (weeks.length <= weekIdx) weeks.push({ days: [] });
      day = null;
      meal = null;
      line = afterHeader(line, week);
      if (!line) continue;
    }

    const dayMatch = DAY_RE.exec(line);
    if (dayMatch) {
      const idx = dayFromMatch(dayMatch);
      day = weeks[weekIdx].days.find((d) => d.day === idx) ?? null;
      if (!day) {
        day = { day: idx, meals: [] };
        weeks[weekIdx].days.push(day);
      }
      meal = null;
      skipping = false;
      line = afterHeader(line, dayMatch);
      if (!line) continue;
    }

    const mealMatch = MEAL_RE.exec(line);
    if (mealMatch) {
      const type = readMealType(mealMatch[1]);
      if (type && skipping && (meal as RawMeal | null)?.type === type) continue;
      if (type) {
        meal = { type, name: type, foods: [] };
        currentDay().meals.push(meal);
        skipping = false;
        const rest = afterHeader(line, mealMatch);
        if (rest) meal.foods.push(...splitFoods(rest));
        continue;
      }
    }

    if (SKIP_RE.test(line)) { skipping = true; continue; }
    if (NUTRIENT_RE.test(line)) continue;
    if (!meal) {
      if (!title && !week && !dayMatch && line.length <= 60 && weeks.every((w) => w.days.length === 0)) title = line;
      continue;
    }
    if (skipping) continue;
    meal.foods.push(...splitFoods(line));
  }

  return { title, durationWeeks, weeks: weeks.filter((w) => w.days.length > 0) };
}
