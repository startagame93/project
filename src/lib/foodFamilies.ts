import { FOOD_DATABASE, type FoodEntry } from '@/lib/foodDatabase';

type Rule = [family: string, keywords: string[]];

const RULES: Record<string, { rules: Rule[]; fallback: string }> = {
  Cereali: {
    fallback: 'Cereali in chicco',
    rules: [
      ['Riso', ['riso']],
      ['Pasta', ['pasta', 'spaghett', 'penne', 'fusilli', 'noodle', 'gnocch', 'lasagn', 'tagliatell']],
      ['Pane e sostituti', ['pane', 'fette', 'cracker', 'grissin', 'tortilla', 'piadina', 'gallette', 'focaccia', 'pizza', 'bagel', 'friselle', 'crostin']],
      ['Cereali da colazione', ['avena', 'muesli', 'corn flakes', 'cornflakes', 'fiocchi', 'granola', 'cereali', 'porridge']],
    ],
  },
  Legumi: {
    fallback: 'Altri legumi',
    rules: [
      ['Fagioli', ['fagiol']],
      ['Lenticchie', ['lenticch']],
      ['Ceci', ['ceci', 'hummus', 'farinata', 'panelle']],
      ['Piselli e fave', ['pisell', 'fave', 'taccole']],
      ['Soia e derivati', ['soia', 'tofu', 'tempeh', 'edamame', 'seitan']],
    ],
  },
  'Carni Bianche': {
    fallback: 'Altre carni bianche',
    rules: [
      ['Pollo', ['pollo']],
      ['Tacchino', ['tacchino']],
      ['Coniglio', ['coniglio']],
    ],
  },
  'Carni Rosse': {
    fallback: 'Altre carni',
    rules: [
      ['Salumi', ['prosciutto', 'bresaola', 'salame', 'mortadella', 'speck', 'pancetta', 'wurstel', 'coppa', 'lardo', 'cotechino', 'nduja', 'guanciale', 'bacon', 'salsiccia', 'salamella']],
      ['Vitello', ['vitello']],
      ['Maiale', ['maiale', 'suino', 'lonza', 'porchetta', 'arista', 'costine']],
      ['Agnello e altre carni', ['agnello', 'capretto', 'cavallo', 'cervo', 'cinghiale', 'fegato', 'trippa']],
      ['Manzo', ['manzo', 'bovino', 'bistecca', 'filetto', 'hamburger', 'roast', 'fiorentina', 'tagliata', 'macinat', 'carpaccio', 'tartare', 'polpett', 'bollito']],
    ],
  },
  Pesce: {
    fallback: 'Pesce bianco',
    rules: [
      ['Molluschi e crostacei', ['cozz', 'vongol', 'ostric', 'polpo', 'calamar', 'seppi', 'totan', 'capesant', 'gamber', 'scampi', 'aragost', 'astice', 'granch', 'mazzancoll', 'canocch', 'ricci', 'fasolari', 'cannolicch', 'granceola', 'lumachine']],
      ['Salmone e trota', ['salmone', 'trota']],
      ['Tonno', ['tonno']],
      ['Pesce azzurro', ['alici', 'acciugh', 'sgombro', 'sardin', 'sarde', 'aringa', 'ricciola', 'palamita', 'lampuga', 'aguglia', 'suro', 'spatola']],
    ],
  },
  Verdure: {
    fallback: 'Altre verdure',
    rules: [
      ['Funghi', ['fungh', 'porcin', 'champignon', 'tartufo']],
      ['Verdure a foglia', ['insalata', 'lattuga', 'spinac', 'rucola', 'radicchio', 'cicoria', 'bieta', 'bietol', 'valeriana', 'scarola', 'indivia', 'cime', 'puntarelle', 'friarielli', 'borragine', 'agretti', 'songino', 'misticanza', 'crescione']],
      ['Cavoli', ['cavol', 'broccol', 'verza', 'pak choi']],
      ['Radici e tuberi', ['patat', 'carot', 'rape', 'barbabietol', 'sedano rapa', 'topinambur', 'ravanell', 'manioca', 'zenzero']],
      ['Bulbi e aromatiche', ['cipoll', 'aglio', 'porr', 'scalogn', 'finocch', 'basilico', 'prezzemolo', 'sedano']],
      ['Ortaggi da frutto', ['pomodor', 'peperon', 'melanzan', 'zucchin', 'cetriol', 'zucca', 'fiori di zucca', 'olive']],
    ],
  },
  Frutta: {
    fallback: 'Altra frutta',
    rules: [
      ['Frutta disidratata', ['secc', 'essiccat', 'disidratat', 'uvetta', 'dattero', 'datteri', 'candit']],
      ['Agrumi', ['arancia', 'limon', 'mandarin', 'pompelmo', 'clementin', 'cedro', 'lime', 'bergamott']],
      ['Frutti di bosco', ['fragol', 'mirtill', 'lampon', 'more', 'ribes', 'uva spina', 'goji']],
      ['Frutta tropicale', ['banana', 'ananas', 'mango', 'papaya', 'avocado', 'cocco', 'kiwi', 'maracuja', 'litchi', 'passion', 'guava', 'pitaya', 'carambola']],
      ['Meloni', ['melone', 'anguria', 'cocomero']],
      ['Mele, pere e frutti a nocciolo', ['mela', 'mele', 'pera', 'pere', 'pesca', 'pesche', 'albicocc', 'cilieg', 'prugn', 'susin', 'nettarin', 'nespol']],
    ],
  },
  Condimenti: {
    fallback: 'Altri condimenti',
    rules: [
      ['Oli e grassi', ['olio', 'burro', 'strutto', 'margarina', 'ghee']],
      ['Aceti', ['aceto']],
      ['Dolcificanti e confetture', ['zucchero', 'miele', 'sciroppo', 'stevia', 'marmellat', 'confettur', 'eritritolo', 'dolcificant']],
      ['Salse e sughi', ['salsa', 'ketchup', 'maionese', 'senape', 'pesto', 'sugo', 'passata', 'ragu', 'ragù', 'besciamella', 'guacamole', 'tzatziki', 'concentrato', 'pelati']],
      ['Spezie e sale', ['sale', 'pepe', 'spezie', 'curry', 'paprika', 'cannella', 'curcuma', 'origano', 'dado']],
    ],
  },
  Latticini: {
    fallback: 'Altri latticini',
    rules: [
      ['Yogurt e fermentati', ['yogurt', 'kefir', 'skyr', 'quark']],
      ['Latte e bevande', ['latte']],
      ['Panna e burro', ['panna', 'burro']],
      ['Formaggi freschi', ['mozzarella', 'ricotta', 'stracchino', 'robiola', 'philadelphia', 'spalmabile', 'cottage', 'burrata', 'fiocchi di latte', 'primo sale', 'squacquerone', 'crescenza', 'feta', 'mascarpone', 'fiordilatte', 'stracciatella', 'caprino']],
      ['Formaggi stagionati', ['parmigiano', 'grana', 'pecorino', 'asiago', 'fontina', 'gorgonzola', 'provolone', 'emmental', 'gouda', 'cheddar', 'taleggio', 'caciocavallo', 'scamorza', 'montasio', 'brie', 'camembert', 'caciotta', 'gruviera', 'bitto', 'formaggio', 'edamer', 'groviera', 'provola']],
    ],
  },
  Uova: {
    fallback: 'Piatti con uova',
    rules: [['Uova', ['uovo', 'uova', 'albume', 'tuorlo']]],
  },
  'Sushi / Piatti Misti': {
    fallback: 'Altri piatti',
    rules: [
      ['Sushi', ['sushi', 'nigiri', 'maki', 'sashimi', 'temaki', 'onigiri', 'california', 'gunkan', 'chirashi']],
      ['Poke e bowl', ['poke', 'bowl']],
      ['Cucina asiatica', ['ramen', 'udon', 'gyoza', 'tempura', 'noodles', 'cantonese', 'pad thai', 'curry', 'involtin', 'dim sum', 'wok', 'teriyaki', 'edamame', 'miso']],
      ['Piatti italiani', ['lasagn', 'parmigiana', 'risotto', 'carbonara', 'amatriciana', 'minestrone', 'polenta', 'arancin', 'suppl', 'frittata', 'pizza', 'piadina', 'insalata']],
    ],
  },
  'Snack / Dolci': {
    fallback: 'Altri dolci e snack',
    rules: [
      ['Cioccolato e creme', ['cioccolat', 'nutella', 'crema spalmabile', 'cacao']],
      ['Biscotti', ['biscott', 'frollin', 'wafer', 'cookie', 'cantucci', 'amaretti', 'savoiardi']],
      ['Gelati', ['gelato', 'sorbetto', 'ghiacciolo', 'semifreddo', 'granita']],
      ['Snack salati', ['patatine', 'popcorn', 'cracker', 'salatin', 'taralli', 'nachos', 'chips', 'pretzel']],
      ['Barrette', ['barrett']],
      ['Merendine e brioche', ['merendin', 'croissant', 'cornetto', 'brioche', 'muffin', 'krapfen', 'bombolon', 'plumcake', 'pancake', 'waffle', 'donut', 'ciambell']],
      ['Pasticceria italiana', ['torta', 'tiramis', 'crostata', 'cheesecake', 'pandoro', 'panettone', 'cannolo', 'baba', 'sfogliatell', 'pastiera', 'cassata', 'panna cotta', 'colomba', 'torrone', 'zeppol', 'maritozz', 'bign']],
    ],
  },
  Bevande: {
    fallback: 'Altre bevande',
    rules: [
      ['Acqua', ['acqua']],
      ['Birre', ['birra']],
      ['Vini', ['vino', 'prosecco', 'spumante', 'champagne']],
      ['Alcolici', ['vodka', 'gin', 'rum', 'whisky', 'grappa', 'limoncello', 'amaro', 'spritz', 'mojito', 'cocktail', 'negroni', 'liquore', 'sake']],
      ['Caffe, te e tisane', ['caff', 'cappuccino', 'espresso', 'the ', 'tè', 'te verde', 'tisana', 'macchiato', 'ginseng', 'orzo', 'matcha', 'infuso']],
      ['Succhi e frullati', ['succo', 'spremuta', 'frullato', 'smoothie', 'centrifugat', 'estratto', 'nettare']],
      ['Bibite e energy drink', ['cola', 'aranciata', 'chinotto', 'gassosa', 'tonica', 'energy', 'gatorade', 'sprite', 'fanta', 'ginger', 'limonata', 'the freddo', 'tè freddo', 'bibita', 'isotonic', 'red bull']],
      ['Bevande vegetali e proteiche', ['bevanda', 'latte di', 'shake', 'proteic']],
    ],
  },
  'Frutta Secca': {
    fallback: 'Altra frutta secca',
    rules: [
      ['Semi', ['semi']],
      ['Creme e burri', ['burro di', 'crema di', 'tahin']],
      ['Arachidi', ['arachid']],
      ['Noci e mandorle', ['mandorl', 'noci', 'noce', 'nocciol', 'pistacch', 'anacardi', 'pinoli', 'macadamia', 'pecan', 'castagn']],
    ],
  },
};

export function getFoodFamily(food: FoodEntry): string {
  if (food.family) return food.family;
  const cfg = RULES[food.category];
  if (!cfg) return food.category;
  const name = food.name.toLowerCase();
  const match = cfg.rules.find(([, words]) => words.some((w) => name.includes(w)));
  return match ? match[0] : cfg.fallback;
}

export type FoodFamily = { name: string; foods: FoodEntry[] };

export function buildFamilies(foods: FoodEntry[]): Map<string, FoodFamily[]> {
  const byCategory = new Map<string, Map<string, FoodEntry[]>>();
  for (const food of foods) {
    const fam = getFoodFamily(food);
    let cat = byCategory.get(food.category);
    if (!cat) byCategory.set(food.category, (cat = new Map()));
    const list = cat.get(fam);
    if (list) list.push(food);
    else cat.set(fam, [food]);
  }
  const result = new Map<string, FoodFamily[]>();
  for (const [category, fams] of byCategory) {
    result.set(
      category,
      [...fams.entries()]
        .map(([name, list]) => ({ name, foods: list.sort((a, b) => a.name.localeCompare(b.name, 'it')) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'it')),
    );
  }
  return result;
}

export const FOOD_FAMILIES = buildFamilies(FOOD_DATABASE);
