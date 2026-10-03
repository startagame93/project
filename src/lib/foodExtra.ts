import type { FoodEntry } from '@/lib/foodDatabase';

// kcal, protein, carbs, fat, saturatedFat, sugar, fiber, sodium, potassium, calcium, iron (per 100 g)
type Values = [number, number, number, number, number, number, number, number, number, number, number];
type Row = [string, ...Values];

function slug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function entry(name: string, category: string, family: string, v: Values): FoodEntry {
  const [calories, protein, carbs, fat, saturatedFat, sugar, fiber, sodium, potassium, calcium, iron] = v;
  return {
    id: slug(name), name, category, family,
    calories, protein, carbs, fat, saturatedFat, sugar, fiber, sodium, potassium, calcium, iron,
  };
}

function group(category: string, family: string, rows: Row[]): FoodEntry[] {
  return rows.map(([name, ...v]) => entry(name, category, family, v as Values));
}

function variants(category: string, family: string, names: string[], types: [string, Values][]): FoodEntry[] {
  return names.flatMap((n) => types.map(([suffix, v]) => entry(`${n}${suffix}`, category, family, v)));
}

// === PASTA ===
const DRY: Values = [353, 12.5, 71, 1.5, 0.3, 3.0, 3.0, 5, 190, 20, 1.3];
const WHOLE: Values = [340, 13.5, 64, 2.5, 0.4, 2.5, 8.0, 5, 280, 35, 3.5];
const COOKED: Values = [158, 5.8, 31, 0.9, 0.2, 0.6, 1.8, 1, 45, 7, 0.5];
const EGG_RAW: Values = [368, 14.0, 68, 4.0, 1.2, 2.0, 2.5, 30, 190, 30, 2.0];
const EGG_COOKED: Values = [165, 6.0, 30, 1.8, 0.5, 0.8, 1.1, 12, 60, 12, 0.9];

const PASTA = [
  ...variants('Pasta', 'Pasta lunga', [
    'Spaghetti', 'Spaghettoni', 'Linguine', 'Bucatini', 'Vermicelli', 'Bavette', 'Capellini', 'Ziti',
  ], [[' (secca)', DRY], [' Integrali', WHOLE], [' (cotti)', COOKED]]),
  ...variants('Pasta', 'Pasta corta', [
    'Penne Rigate', 'Penne Lisce', 'Rigatoni', 'Fusilli', 'Farfalle', 'Maccheroni', 'Mezze Maniche',
    'Paccheri', 'Tortiglioni', 'Orecchiette', 'Conchiglie', 'Ditalini', 'Sedanini', 'Trofie',
    'Casarecce', 'Strozzapreti', 'Calamarata', 'Gramigna', 'Pipe Rigate', 'Gnocchetti Sardi',
  ], [[' (secca)', DRY], [' Integrali', WHOLE], [' (cotte)', COOKED]]),
  ...variants('Pasta', "Pasta all'uovo", [
    'Tagliatelle', 'Fettuccine', 'Pappardelle', 'Tagliolini', 'Lasagne (sfoglia)', 'Garganelli', 'Pizzoccheri',
  ], [[' crude', EGG_RAW], [' cotte', EGG_COOKED]]),
  ...group('Pasta', 'Pasta ripiena', [
    ['Tortellini Prosciutto', 300, 13, 42, 9, 3.5, 2, 2, 650, 200, 40, 1.5],
    ['Tortelloni Ricotta e Spinaci', 260, 10, 38, 7.5, 3.5, 2, 2.5, 450, 200, 90, 1.4],
    ['Ravioli di Magro', 250, 10, 36, 7, 3.2, 2, 2.2, 420, 190, 85, 1.3],
    ['Ravioli di Carne', 280, 12, 37, 9, 3.6, 2, 2, 520, 210, 40, 1.6],
    ['Agnolotti Piemontesi', 285, 12, 38, 9, 3.5, 2, 2, 540, 210, 45, 1.6],
    ['Cappelletti', 295, 12.5, 40, 9.5, 3.8, 2, 2, 600, 200, 50, 1.5],
    ['Mezzelune ai Funghi', 255, 9, 38, 7, 3.0, 2, 2.5, 430, 220, 60, 1.3],
    ['Culurgiones', 240, 8, 38, 6, 3.0, 1.5, 2.5, 380, 260, 70, 1.2],
    ['Tortelli di Zucca', 245, 7.5, 42, 5, 2.5, 6, 2.5, 380, 230, 60, 1.1],
    ['Fagottini Formaggio e Pere', 270, 10, 38, 8.5, 4.5, 6, 2, 420, 180, 110, 1.1],
  ]),
  ...group('Pasta', 'Gnocchi', [
    ['Gnocchi di Patate', 150, 3.5, 33, 0.4, 0.1, 1, 1.8, 330, 250, 15, 0.6],
    ['Gnocchi alla Romana', 210, 8, 25, 8.5, 5, 2, 1, 400, 120, 160, 0.8],
    ['Gnocchi di Ricotta', 190, 8, 22, 7.5, 4.5, 1.5, 1, 300, 120, 120, 0.7],
    ['Gnocchi alla Sorrentina', 165, 6, 24, 5, 3, 3, 2, 420, 300, 110, 0.8],
    ['Chicche Verdi', 160, 4.5, 32, 1.2, 0.3, 1, 2.5, 330, 300, 40, 1.2],
  ]),
  ...group('Pasta', 'Primi pronti', [
    ['Spaghetti alla Carbonara', 220, 9.5, 24, 9.5, 3.8, 1, 1.2, 420, 130, 60, 1.1],
    ["Bucatini all'Amatriciana", 190, 7, 26, 6.5, 2.5, 3, 1.8, 450, 220, 40, 1.1],
    ['Spaghetti Aglio Olio e Peperoncino', 200, 5.5, 29, 7, 1, 1, 1.6, 200, 70, 12, 0.6],
    ['Spaghetti alle Vongole', 160, 8, 25, 3.5, 0.5, 0.8, 1.5, 380, 170, 40, 4.0],
    ['Penne al Pomodoro', 145, 4.8, 27, 2.2, 0.4, 3, 2, 260, 220, 20, 0.8],
    ['Penne all\'Arrabbiata', 150, 4.8, 27, 2.8, 0.4, 3, 2, 280, 230, 20, 0.8],
    ['Tagliatelle al Ragu', 175, 8.5, 22, 6, 2.2, 2.5, 1.5, 320, 230, 30, 1.3],
    ['Lasagne alla Bolognese', 165, 8.5, 14, 8.5, 4, 3, 1.2, 380, 240, 120, 1.0],
    ['Trofie al Pesto', 230, 6.5, 28, 10.5, 2.5, 1, 1.8, 330, 120, 90, 0.9],
    ['Pasta alla Norma', 155, 5, 23, 5, 1.6, 3.5, 2.5, 300, 260, 70, 0.8],
    ['Cacio e Pepe', 260, 11, 30, 10.5, 6, 0.8, 1.4, 520, 100, 290, 0.8],
    ['Pasta alla Gricia', 250, 9.5, 28, 11, 4.5, 0.8, 1.3, 560, 120, 150, 0.8],
    ['Pasta e Fagioli', 105, 5, 16, 2.2, 0.4, 1.5, 3.5, 300, 320, 40, 1.4],
    ['Pasta e Ceci', 115, 5, 17, 3, 0.4, 1, 3.5, 290, 230, 40, 1.5],
    ['Orecchiette alle Cime di Rapa', 160, 5.5, 25, 4.5, 0.7, 1, 2.8, 280, 230, 60, 1.2],
    ['Pasta al Salmone', 210, 8.5, 24, 9, 4, 1.5, 1.2, 380, 190, 40, 0.7],
    ['Pasta al Tonno', 180, 9, 26, 4.5, 0.8, 2, 1.6, 340, 210, 20, 1.0],
    ['Pasta ai Funghi', 170, 5.5, 26, 5, 1.8, 1, 2, 260, 260, 20, 0.9],
    ['Pasta Panna e Prosciutto', 230, 8, 25, 11, 6, 1.5, 1.2, 450, 150, 50, 0.8],
    ['Pasta al Forno', 185, 9, 20, 7.5, 3.5, 2.5, 1.4, 400, 210, 130, 1.0],
    ['Pasta Fredda con Verdure', 150, 4.5, 24, 4, 0.6, 2.5, 2.2, 250, 200, 25, 0.8],
    ['Risotto ai Funghi', 145, 3.5, 24, 4, 2, 0.5, 0.8, 330, 140, 30, 0.5],
    ['Risotto alla Milanese', 165, 4, 24, 6, 3.5, 0.3, 0.4, 350, 70, 60, 0.4],
  ]),
];

// === PANE E PIZZA ===
const PANE_PIZZA = [
  ...group('Pane e Pizza', 'Pane', [
    ['Pane Comune', 270, 8.5, 56, 1.2, 0.3, 2, 3, 500, 120, 20, 1.5],
    ['Pane Integrale Tipo 1', 245, 9, 47, 2.2, 0.4, 3, 7, 480, 230, 30, 2.5],
    ['Pane di Segale', 259, 8.5, 48, 3.3, 0.6, 3.9, 5.8, 600, 170, 70, 2.8],
    ['Pane ai Cereali', 260, 10, 44, 4.5, 0.6, 3.5, 6.5, 470, 230, 60, 2.6],
    ['Pane di Altamura', 270, 9, 55, 1, 0.2, 1.5, 3, 450, 150, 22, 1.8],
    ['Pane Toscano Sciapo', 275, 8.5, 58, 1, 0.2, 1.5, 3, 10, 120, 20, 1.5],
    ['Pane Carasau', 380, 11, 76, 2, 0.4, 2, 4, 700, 160, 25, 2.0],
    ['Pane in Cassetta', 280, 8.5, 50, 4.5, 0.8, 5, 3, 480, 120, 60, 1.4],
    ['Pane in Cassetta Integrale', 255, 10, 43, 4, 0.7, 4.5, 6.5, 470, 220, 70, 2.2],
    ['Baguette', 274, 9, 56, 1.5, 0.3, 3, 2.8, 600, 120, 25, 1.6],
    ['Ciabatta', 271, 8.5, 54, 2.5, 0.4, 1.5, 2.5, 520, 120, 22, 1.6],
    ['Rosetta', 275, 8.6, 57, 1.3, 0.3, 1.8, 2.8, 520, 120, 20, 1.5],
    ['Panino al Latte', 310, 9, 54, 6, 2.5, 7, 2, 420, 140, 60, 1.2],
    ['Pane Arabo (Pita)', 275, 9, 55, 1.2, 0.2, 1.5, 2.2, 530, 120, 86, 2.6],
    ['Pane Senza Glutine', 250, 3, 48, 5.5, 0.8, 4, 6, 450, 150, 30, 1.0],
    ['Fette Biscottate Integrali', 400, 13, 67, 6, 1, 6, 11, 550, 280, 40, 3.0],
    ['Grissini', 410, 12, 68, 9, 1.5, 3, 3.5, 900, 150, 25, 2.0],
    ['Taralli', 450, 9, 64, 17, 2.5, 2, 3, 900, 140, 25, 1.8],
    ['Friselle', 385, 11, 76, 2.5, 0.4, 2, 6, 600, 180, 30, 2.4],
    ['Pane Bauletto al Kamut', 265, 10.5, 48, 3, 0.5, 3, 5, 450, 230, 30, 2.5],
  ]),
  ...group('Pane e Pizza', 'Pizza', [
    ['Pizza Margherita', 255, 11, 33, 8.5, 3.8, 3, 2, 600, 200, 180, 1.4],
    ['Pizza Marinara', 210, 6.5, 37, 4, 0.6, 3.5, 2.4, 520, 220, 20, 1.5],
    ['Pizza Diavola', 275, 12, 32, 11, 4.8, 3, 2, 750, 210, 170, 1.5],
    ['Pizza Capricciosa', 245, 11, 30, 9, 3.8, 2.5, 2.2, 680, 230, 150, 1.5],
    ['Pizza Quattro Formaggi', 300, 14, 30, 14, 7.5, 2, 1.6, 720, 160, 300, 1.2],
    ['Pizza Quattro Stagioni', 240, 10.5, 30, 8.5, 3.6, 2.5, 2.2, 660, 230, 150, 1.5],
    ['Pizza Prosciutto e Funghi', 240, 11.5, 30, 8.3, 3.5, 2.5, 2.1, 680, 230, 160, 1.4],
    ['Pizza Napoletana', 235, 10, 33, 7, 3, 3, 2, 800, 210, 150, 1.5],
    ['Pizza Tonno e Cipolla', 245, 12.5, 31, 8, 3, 3.5, 2.2, 620, 230, 150, 1.4],
    ['Pizza Vegetariana', 220, 9, 31, 7, 3, 3.5, 2.8, 540, 280, 150, 1.4],
    ['Pizza Bufala', 260, 11.5, 32, 9.5, 5, 3, 2, 580, 200, 170, 1.3],
    ['Pizza Wurstel e Patatine', 290, 10.5, 34, 12.5, 5, 2.5, 2.2, 780, 300, 140, 1.4],
    ['Pizza Salsiccia e Friarielli', 265, 11.5, 30, 11, 4.5, 2, 2.5, 700, 280, 170, 1.8],
    ['Pizza Bianca', 290, 8, 45, 8.5, 1.3, 1.5, 2.2, 650, 120, 20, 1.5],
    ['Pizza al Taglio Rossa', 245, 7, 39, 7, 1.1, 3.5, 2.4, 600, 200, 20, 1.5],
    ['Pizza Integrale Margherita', 240, 11.5, 29, 8.5, 3.8, 3, 4.5, 590, 260, 180, 2.0],
    ['Calzone al Forno', 265, 12, 31, 10, 4.5, 2.5, 1.8, 700, 200, 170, 1.4],
    ['Panzerotto Fritto', 300, 10, 32, 15, 5, 2.5, 1.8, 650, 180, 150, 1.3],
    ['Pinsa Romana Margherita', 240, 10.5, 32, 7.5, 3.4, 2.5, 2.3, 580, 200, 170, 1.3],
    ['Pizzetta Rossa da Buffet', 300, 7, 40, 12.5, 2.5, 3, 2.2, 700, 180, 30, 1.4],
  ]),
  ...group('Pane e Pizza', 'Focacce e piadine', [
    ['Focaccia Genovese', 320, 7, 45, 12.5, 1.9, 2, 2, 850, 120, 20, 1.5],
    ['Focaccia al Rosmarino', 310, 7.5, 46, 11, 1.7, 1.5, 2.2, 780, 130, 25, 1.6],
    ['Focaccia Barese', 270, 6.5, 40, 9, 1.4, 3, 2.5, 650, 250, 25, 1.5],
    ['Focaccia di Recco', 340, 11, 30, 19.5, 9, 1.5, 1.2, 600, 120, 220, 1.0],
    ['Piadina Romagnola', 330, 8.5, 52, 10, 4, 1.5, 2, 800, 120, 25, 1.6],
    ['Piadina Integrale', 300, 9.5, 46, 9, 1.5, 1.5, 6, 750, 220, 30, 2.4],
    ['Piadina Prosciutto e Squacquerone', 300, 13, 33, 13, 6, 2, 1.4, 900, 200, 120, 1.4],
    ['Crescia Sfogliata', 360, 8, 48, 15.5, 6, 1.5, 2, 760, 120, 25, 1.5],
    ['Tigelle', 300, 8.5, 54, 5.5, 2, 2, 2.2, 550, 120, 40, 1.4],
    ['Gnocco Fritto', 370, 7.5, 46, 17, 6, 1.5, 1.8, 600, 100, 20, 1.3],
    ['Schiacciata Toscana', 330, 7.5, 47, 12.5, 1.8, 1.5, 2.2, 900, 120, 20, 1.5],
    ['Tortilla di Grano', 310, 8.5, 51, 8, 3, 2.5, 3, 750, 140, 120, 3.0],
  ]),
  ...group('Pane e Pizza', 'Rosticceria', [
    ['Arancino al Ragu', 245, 7.5, 31, 10, 2.5, 1, 1.5, 450, 150, 50, 1.0],
    ['Arancino al Burro', 260, 8, 30, 12, 5, 1, 1.2, 480, 120, 110, 0.8],
    ['Supplì', 250, 8, 30, 11, 3.5, 2, 1.4, 480, 160, 90, 1.0],
    ['Crocchetta di Patate', 240, 4.5, 26, 13, 2.5, 1, 2, 420, 380, 40, 0.7],
    ['Mozzarella in Carrozza', 330, 14, 25, 19.5, 7.5, 2, 1.2, 600, 120, 250, 1.2],
    ['Tramezzino Tonno', 260, 11, 25, 13, 2.2, 2.5, 1.5, 480, 140, 30, 1.0],
    ['Toast Prosciutto e Formaggio', 280, 15, 28, 12, 6, 3, 1.6, 900, 170, 220, 1.3],
    ['Panino Porchetta', 285, 15, 28, 12.5, 4.2, 2, 1.8, 780, 240, 30, 1.6],
  ]),
];

// === VINI E ALCOLICI ===
const RED: Values = [85, 0.1, 2.6, 0, 0, 0.6, 0, 4, 127, 8, 0.5];
const WHITE: Values = [82, 0.1, 2.6, 0, 0, 1.0, 0, 5, 71, 9, 0.3];
const ROSE: Values = [80, 0.1, 3.0, 0, 0, 1.5, 0, 5, 90, 8, 0.4];
const BUBBLY: Values = [75, 0.2, 1.5, 0, 0, 1.4, 0, 6, 70, 9, 0.4];
const SWEET: Values = [160, 0.2, 14, 0, 0, 13, 0, 9, 90, 8, 0.2];

function wines(family: string, v: Values, names: string[]): FoodEntry[] {
  return names.map((n) => entry(n, 'Vini e Alcolici', family, v));
}

const VINI = [
  ...wines('Vini rossi', RED, [
    'Chianti Classico', 'Brunello di Montalcino', 'Barolo', 'Barbaresco', 'Amarone della Valpolicella',
    'Valpolicella', 'Montepulciano d\'Abruzzo', 'Nero d\'Avola', 'Primitivo di Manduria', 'Aglianico',
    'Sangiovese di Romagna', 'Barbera d\'Asti', 'Dolcetto d\'Alba', 'Cannonau di Sardegna', 'Lambrusco',
    'Merlot', 'Cabernet Sauvignon', 'Pinot Nero', 'Nebbiolo Langhe', 'Bardolino',
  ]),
  ...wines('Vini bianchi', WHITE, [
    'Pinot Grigio', 'Chardonnay', 'Sauvignon Blanc', 'Vermentino', 'Soave', 'Falanghina', 'Greco di Tufo',
    'Fiano di Avellino', 'Verdicchio', 'Gewurztraminer', 'Ribolla Gialla', 'Trebbiano d\'Abruzzo',
    'Gavi di Gavi', 'Lugana', 'Muller Thurgau', 'Grillo',
  ]),
  ...wines('Vini rosati', ROSE, ['Cerasuolo d\'Abruzzo', 'Chiaretto del Garda', 'Rosato del Salento', 'Rosé di Provenza']),
  ...wines('Bollicine', BUBBLY, [
    'Prosecco DOC', 'Prosecco Superiore Valdobbiadene', 'Franciacorta Brut', 'Trento DOC',
    'Champagne Brut', 'Spumante Brut', 'Asti Spumante', 'Cava',
  ]),
  ...wines('Vini dolci e passiti', SWEET, [
    'Moscato d\'Asti', 'Passito di Pantelleria', 'Vin Santo', 'Marsala', 'Porto', 'Recioto della Valpolicella', 'Sauternes',
  ]),
  ...group('Vini e Alcolici', 'Distillati e liquori', [
    ['Grappa', 280, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    ['Vodka', 231, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    ['Gin', 263, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0],
    ['Rum', 231, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0.1],
    ['Whisky', 250, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    ['Tequila', 231, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    ['Limoncello', 300, 0, 35, 0, 0, 35, 0, 2, 10, 2, 0],
    ['Amaro', 260, 0, 30, 0, 0, 29, 0, 4, 20, 3, 0.1],
    ['Sambuca', 330, 0, 37, 0, 0, 37, 0, 2, 2, 0, 0],
    ['Aperol', 110, 0, 16, 0, 0, 16, 0, 3, 10, 0, 0],
  ]),
  ...group('Vini e Alcolici', 'Cocktail', [
    ['Spritz Aperol', 95, 0.1, 9, 0, 0, 8.5, 0, 6, 40, 4, 0.2],
    ['Negroni', 230, 0, 13, 0, 0, 13, 0, 3, 20, 1, 0],
    ['Mojito', 110, 0.1, 13, 0, 0, 12, 0.2, 3, 30, 4, 0.1],
    ['Gin Tonic', 85, 0, 7, 0, 0, 7, 0, 5, 1, 1, 0],
    ['Hugo', 90, 0.1, 9, 0, 0, 9, 0, 5, 40, 4, 0.2],
    ['Moscow Mule', 95, 0, 10, 0, 0, 9.5, 0, 6, 5, 2, 0],
  ]),
];

// === SALUMI ===
const SALUMI = group('Salumi', 'Salumi', [
  ['Prosciutto di Parma', 268, 26, 0, 18, 6.2, 0, 0, 1900, 450, 10, 0.8],
  ['Prosciutto San Daniele', 260, 27, 0, 17, 5.8, 0, 0, 1800, 450, 10, 0.8],
  ['Prosciutto Toscano', 270, 27, 0, 18, 6.2, 0, 0, 2400, 430, 12, 0.9],
  ['Prosciutto Cotto Alta Qualita', 132, 19.5, 0.8, 5.5, 2, 0.5, 0, 750, 290, 8, 0.7],
  ['Speck Alto Adige', 300, 28, 0.5, 20.5, 7.5, 0.3, 0, 1800, 400, 10, 1.2],
  ['Bresaola della Valtellina', 151, 32, 0.4, 2, 0.8, 0, 0, 1600, 500, 15, 2.5],
  ['Salame Milano', 420, 25, 1.2, 35, 12.5, 0.5, 0, 1500, 300, 15, 1.4],
  ['Salame Napoli', 400, 25, 1, 33, 12, 0.5, 0, 1700, 300, 15, 1.4],
  ['Salame Felino', 380, 26, 0.5, 30, 11, 0.3, 0, 1400, 300, 12, 1.5],
  ['Salame Ungherese', 440, 22, 1, 39, 14, 0.5, 0, 1600, 300, 12, 1.3],
  ['Finocchiona', 410, 23, 1, 35, 12.5, 0.5, 0, 1600, 300, 15, 1.4],
  ['Mortadella Bologna', 310, 15, 0.5, 28, 9.5, 0.5, 0, 1100, 200, 10, 1.0],
  ['Coppa / Capocollo', 400, 24, 0.5, 33, 12, 0.3, 0, 1800, 310, 12, 1.2],
  ['Culatello di Zibello', 250, 30, 0, 14.5, 5, 0, 0, 1900, 450, 10, 1.0],
  ['Lardo di Colonnata', 790, 3, 0, 87, 33, 0, 0, 1200, 60, 2, 0.2],
  ['Pancetta Arrotolata', 400, 17, 0.5, 37, 13.5, 0.3, 0, 1800, 250, 8, 0.8],
  ['Guanciale', 655, 10, 0, 69, 25, 0, 0, 1300, 160, 6, 0.6],
  ['Porchetta di Ariccia', 290, 24, 0.5, 21, 7.5, 0.3, 0, 1100, 350, 12, 1.2],
  ['Nduja di Spilinga', 500, 13, 2, 49, 18, 1, 1, 1700, 300, 20, 1.5],
  ['Soppressata Calabrese', 410, 26, 1, 33.5, 12, 0.5, 0, 1800, 300, 15, 1.5],
  ['Cotechino', 340, 18, 1, 29.5, 11, 0.5, 0, 900, 250, 15, 1.3],
  ['Zampone', 330, 19, 1, 27.5, 10, 0.5, 0, 900, 250, 15, 1.4],
  ['Wurstel di Pollo', 220, 13, 4, 17, 5, 1, 0, 900, 150, 50, 1.1],
  ['Wurstel di Suino', 290, 12, 2, 26, 9.5, 1, 0, 950, 190, 15, 1.0],
  ['Fesa di Tacchino Arrosto', 105, 21, 1, 2, 0.6, 0.5, 0, 800, 300, 10, 0.8],
  ['Petto di Pollo Arrosto Affettato', 110, 21, 1.5, 2.2, 0.7, 0.8, 0, 850, 280, 10, 0.6],
  ['Arista Arrosto Affettata', 160, 25, 0.5, 6.5, 2.3, 0.3, 0, 700, 330, 10, 0.9],
  ['Roast Beef Affettato', 130, 23, 0.5, 4, 1.6, 0.3, 0, 600, 350, 8, 2.3],
  ['Carne Salada Trentina', 125, 25, 0, 2.5, 1, 0, 0, 1400, 380, 8, 2.4],
  ['Cecina de Leon', 155, 35, 0, 1.5, 0.6, 0, 0, 1900, 450, 10, 3.0],
  ['Salsiccia di Bra', 230, 18, 0.5, 17, 7, 0.3, 0, 700, 300, 15, 1.4],
  ['Salamella Mantovana', 320, 16, 0.5, 28.5, 10.5, 0.3, 0, 950, 260, 15, 1.2],
  ['Bacon Affumicato', 420, 14, 1, 40, 14, 0.5, 0, 1700, 250, 6, 0.6],
  ['Chorizo', 455, 24, 2, 38, 14, 1, 0, 1240, 400, 10, 1.6],
  ['Jamon Iberico', 375, 31, 0, 28, 9.5, 0, 0, 1900, 430, 10, 1.5],
]);

// === FORMAGGI ===
const FORMAGGI = [
  ...group('Latticini', 'Formaggi freschi', [
    ['Burrata', 330, 15, 1.5, 29.5, 18, 1.5, 0, 250, 140, 330, 0.2],
    ['Mozzarella di Bufala Campana', 288, 17, 0.4, 24, 16.5, 0.4, 0, 230, 110, 210, 0.3],
    ['Fiordilatte', 250, 18.5, 0.8, 19, 12, 0.8, 0, 200, 100, 350, 0.2],
    ['Stracciatella di Burrata', 290, 11, 2, 26.5, 17, 2, 0, 250, 140, 250, 0.2],
    ['Squacquerone', 210, 12.5, 2, 17, 11, 2, 0, 500, 130, 300, 0.2],
    ['Crescenza', 280, 16, 1.5, 23.5, 15, 1.5, 0, 550, 120, 350, 0.2],
    ['Primo Sale', 270, 19, 1, 21, 13.5, 1, 0, 600, 110, 500, 0.3],
    ['Caprino Fresco', 230, 14, 1.5, 19, 13, 1.5, 0, 450, 150, 140, 0.4],
    ['Mascarpone', 455, 4.5, 4, 47, 30, 4, 0, 40, 80, 70, 0.1],
    ['Quark', 70, 12, 3.5, 0.3, 0.2, 3.5, 0, 40, 160, 90, 0.1],
    ['Skyr Naturale', 63, 11, 4, 0.2, 0.1, 4, 0, 45, 150, 120, 0.1],
    ['Ricotta di Pecora', 270, 9.5, 4, 24, 15, 4, 0, 120, 120, 170, 0.3],
    ['Ricotta di Bufala', 200, 9, 4, 16.5, 10.5, 4, 0, 100, 120, 200, 0.2],
  ]),
  ...group('Latticini', 'Formaggi stagionati', [
    ['Parmigiano Reggiano 24 Mesi', 392, 33, 0, 28.5, 18.5, 0, 0, 650, 100, 1160, 0.2],
    ['Parmigiano Reggiano 36 Mesi', 400, 34, 0, 29, 19, 0, 0, 680, 100, 1180, 0.2],
    ['Grana Padano', 384, 33, 0, 28, 18, 0, 0, 600, 120, 1165, 0.2],
    ['Pecorino Romano', 387, 26, 0.2, 31, 20, 0.2, 0, 1800, 100, 1060, 0.4],
    ['Pecorino Sardo', 390, 26, 0.5, 31.5, 20, 0.5, 0, 1200, 110, 950, 0.4],
    ['Pecorino Toscano', 380, 25, 0.8, 30.5, 19.5, 0.8, 0, 1000, 110, 900, 0.4],
    ['Provolone Valpadana', 352, 26, 2, 26.5, 17, 1, 0, 870, 140, 750, 0.5],
    ['Caciocavallo Silano', 370, 30, 2, 26.5, 17, 1, 0, 860, 120, 850, 0.4],
    ['Scamorza Affumicata', 330, 25, 1, 25, 16, 1, 0, 700, 120, 650, 0.3],
    ['Taleggio', 315, 19, 0.5, 26, 17, 0.5, 0, 1000, 100, 400, 0.3],
    ['Gorgonzola Piccante', 360, 19, 0, 31, 20, 0, 0, 1300, 120, 400, 0.3],
    ['Fontina Valdostana', 390, 26, 0.5, 31.5, 20, 0.5, 0, 800, 90, 870, 0.2],
    ['Asiago Stagionato', 390, 30, 1, 30, 19, 1, 0, 900, 100, 960, 0.3],
    ['Montasio', 380, 28, 1, 29.5, 19, 1, 0, 700, 100, 900, 0.3],
    ['Bitto', 390, 27, 0.5, 31, 20, 0.5, 0, 650, 100, 900, 0.3],
    ['Emmental', 380, 28.5, 0.5, 29.5, 19, 0.5, 0, 250, 90, 1000, 0.2],
    ['Gruviera', 413, 30, 0.4, 32, 19, 0.4, 0, 700, 80, 1010, 0.2],
    ['Cheddar', 403, 25, 1.3, 33, 21, 0.5, 0, 650, 98, 720, 0.7],
    ['Brie', 334, 21, 0.5, 28, 17.5, 0.5, 0, 630, 150, 180, 0.5],
    ['Camembert', 300, 20, 0.5, 24, 15, 0.5, 0, 840, 190, 390, 0.3],
  ]),
];

// === CARNE: TAGLI ===
const CARNE = [
  ...group('Carni Rosse', 'Manzo', [
    ['Controfiletto di Manzo', 180, 22, 0, 10, 4, 0, 0, 55, 330, 6, 2.0],
    ['Lombata di Manzo', 175, 21.5, 0, 9.5, 3.8, 0, 0, 55, 330, 6, 2.1],
    ['Fesa di Manzo', 120, 22, 0, 3.5, 1.4, 0, 0, 55, 340, 5, 2.0],
    ['Girello di Manzo', 115, 22.5, 0, 2.8, 1.1, 0, 0, 55, 340, 5, 2.1],
    ['Noce di Manzo', 118, 22, 0, 3.2, 1.3, 0, 0, 55, 340, 5, 2.0],
    ['Scamone di Manzo', 140, 21, 0, 6, 2.4, 0, 0, 55, 330, 6, 2.2],
    ['Picanha', 220, 19, 0, 16, 6.5, 0, 0, 55, 300, 7, 2.0],
    ['Costata di Manzo', 230, 19, 0, 17, 7, 0, 0, 55, 300, 7, 2.0],
    ['Ossobuco di Manzo', 160, 20, 0, 9, 3.6, 0, 0, 60, 320, 10, 2.4],
    ['Spezzatino di Manzo', 145, 20.5, 0, 7, 2.8, 0, 0, 60, 320, 8, 2.3],
    ['Guancia di Manzo', 160, 19, 0, 9.5, 3.8, 0, 0, 60, 300, 8, 2.5],
    ['Cappello del Prete', 150, 20, 0, 7.8, 3.1, 0, 0, 58, 320, 7, 2.2],
    ['Carpaccio di Manzo', 115, 22, 0, 3, 1.2, 0, 0, 55, 340, 5, 2.0],
    ['Tartare di Manzo', 130, 21.5, 0, 4.8, 2, 0, 0, 60, 330, 6, 2.2],
    ['Macinato di Manzo Magro 5%', 135, 21, 0, 5.5, 2.3, 0, 0, 65, 330, 6, 2.3],
  ]),
  ...group('Carni Rosse', 'Maiale', [
    ['Filetto di Maiale', 120, 21, 0, 3.8, 1.3, 0, 0, 55, 400, 6, 1.0],
    ['Lonza di Maiale', 145, 22, 0, 6.2, 2.2, 0, 0, 55, 380, 6, 0.8],
    ['Braciola di Maiale', 210, 19.5, 0, 14.5, 5.2, 0, 0, 60, 330, 15, 0.8],
    ['Costine di Maiale', 280, 17, 0, 23.5, 8.5, 0, 0, 80, 280, 25, 0.9],
    ['Coppa di Maiale Fresca', 240, 17, 0, 19, 7, 0, 0, 65, 300, 12, 1.0],
    ['Stinco di Maiale', 220, 19, 0, 16, 5.8, 0, 0, 70, 300, 15, 1.2],
    ['Pulled Pork', 230, 23, 4, 13, 4.6, 3.5, 0.2, 450, 340, 18, 1.3],
    ['Macinato di Maiale', 260, 17, 0, 21, 7.6, 0, 0, 70, 290, 12, 0.9],
  ]),
  ...group('Carni Rosse', 'Vitello', [
    ['Fesa di Vitello', 92, 21, 0, 1, 0.4, 0, 0, 80, 360, 8, 1.0],
    ['Scaloppine di Vitello', 105, 20.5, 2, 1.8, 0.6, 0, 0, 130, 340, 10, 1.0],
    ['Nodino di Vitello', 145, 20, 0, 7, 2.8, 0, 0, 80, 330, 10, 1.1],
    ['Ossobuco di Vitello', 130, 20, 0, 5.5, 2.1, 0, 0, 85, 330, 15, 1.3],
    ['Vitello Tonnato', 190, 19, 1, 12, 2.2, 0.5, 0, 350, 300, 15, 1.1],
    ['Cotoletta alla Milanese', 270, 18, 13, 16.5, 5.5, 1, 0.8, 300, 280, 25, 1.5],
  ]),
  ...group('Carni Rosse', 'Agnello e altre carni', [
    ['Costolette di Agnello', 240, 17.5, 0, 19, 8.5, 0, 0, 70, 280, 15, 1.6],
    ['Cosciotto di Agnello', 170, 20, 0, 10, 4.5, 0, 0, 65, 300, 10, 1.8],
    ['Capretto', 120, 20, 0, 4.5, 1.6, 0, 0, 80, 330, 12, 2.4],
    ['Cervo', 120, 23, 0, 3, 1.3, 0, 0, 50, 330, 5, 3.4],
    ['Cinghiale', 125, 21.5, 0, 4.5, 1.4, 0, 0, 60, 380, 12, 2.0],
    ['Fegato di Vitello', 140, 20, 4, 4.5, 1.5, 0, 0, 80, 300, 6, 8.0],
    ['Trippa', 85, 12, 0, 3.7, 1.3, 0, 0, 100, 70, 70, 0.6],
  ]),
  ...group('Carni Bianche', 'Pollo', [
    ['Sovracosce di Pollo', 180, 18, 0, 12, 3.4, 0, 0, 85, 220, 10, 1.0],
    ['Ali di Pollo', 200, 18.5, 0, 14, 3.9, 0, 0, 80, 200, 12, 0.9],
    ['Pollo allo Spiedo', 190, 26, 0, 9.5, 2.7, 0, 0, 380, 250, 14, 1.2],
    ['Nuggets di Pollo', 285, 15, 16, 18, 3.5, 0.5, 1, 550, 250, 15, 1.0],
    ['Cotoletta di Pollo Impanata', 240, 17, 14, 13, 2.5, 1, 1, 400, 250, 20, 1.0],
    ['Straccetti di Pollo', 115, 23, 0, 2.2, 0.6, 0, 0, 70, 300, 8, 0.6],
  ]),
];

// === PESCE ===
const PESCE = [
  ...group('Pesce', 'Pesce bianco', [
    ['Ombrina', 95, 19, 0, 2, 0.5, 0, 0, 70, 350, 30, 0.4],
    ['Dentice', 101, 20, 0, 2.3, 0.5, 0, 0, 70, 360, 40, 0.5],
    ['Pesce Spada', 144, 19.5, 0, 6.6, 1.8, 0, 0, 90, 290, 6, 0.8],
    ['Pagello', 92, 19, 0, 1.5, 0.4, 0, 0, 70, 340, 30, 0.6],
    ['Rana Pescatrice', 76, 15, 0, 1.5, 0.3, 0, 0, 18, 400, 8, 0.3],
    ['San Pietro', 88, 18, 0, 1.4, 0.3, 0, 0, 80, 350, 30, 0.5],
    ['Triglia', 123, 15.8, 0, 6.2, 1.8, 0, 0, 80, 300, 40, 0.8],
    ['Luccio', 88, 19, 0, 0.7, 0.1, 0, 0, 40, 260, 20, 0.6],
    ['Pangasio', 90, 15, 0, 3.5, 1, 0, 0, 60, 280, 10, 0.3],
    ['Cefalo', 117, 19.5, 0, 4, 1.2, 0, 0, 65, 350, 40, 1.0],
    ['Baccala alla Vicentina', 180, 22, 2, 9.5, 1.6, 0.5, 0, 600, 300, 60, 0.8],
  ]),
  ...group('Pesce', 'Pesce azzurro', [
    ['Ricciola', 146, 23, 0, 5.2, 1.4, 0, 0, 40, 450, 10, 0.6],
    ['Lampuga', 85, 18.5, 0, 0.7, 0.2, 0, 0, 88, 415, 15, 1.1],
    ['Palamita', 140, 23, 0, 5.3, 1.4, 0, 0, 50, 400, 15, 1.0],
    ['Aguglia', 100, 19, 0, 2.6, 0.6, 0, 0, 80, 350, 20, 0.8],
    ['Suro', 120, 19, 0, 5, 1.3, 0, 0, 80, 350, 30, 1.0],
  ]),
  ...group('Pesce', 'Molluschi e crostacei', [
    ['Canocchie', 85, 15, 1, 2, 0.4, 0, 0, 300, 300, 80, 1.5],
    ['Ricci di Mare', 120, 13, 3.5, 5, 1, 0, 0, 220, 330, 20, 1.0],
    ['Lumachine di Mare', 90, 16, 2, 1.5, 0.3, 0, 0, 280, 250, 80, 3.0],
    ['Fasolari', 75, 13, 2, 1.2, 0.2, 0, 0, 110, 300, 60, 6.0],
    ['Cannolicchi', 74, 12.5, 3, 1, 0.2, 0, 0, 360, 260, 60, 4.0],
    ['Granceola', 95, 19, 0.5, 1.5, 0.2, 0, 0, 400, 260, 90, 1.0],
    ['Frittura di Paranza', 250, 17, 12, 15, 2.2, 0.5, 0.5, 350, 280, 120, 1.3],
    ['Insalata di Mare', 110, 16, 2, 4, 0.6, 0.5, 0.2, 500, 250, 50, 2.0],
    ['Polpo alla Luciana', 110, 15, 3, 4, 0.6, 2, 0.6, 450, 380, 60, 4.5],
  ]),
];

// === DOLCI ITALIANI ===
const DOLCI = group('Snack / Dolci', 'Pasticceria italiana', [
  ['Cannolo Siciliano', 380, 7, 40, 21, 9, 25, 1, 120, 150, 90, 1.0],
  ['Sfogliatella Riccia', 380, 7.5, 45, 19, 9, 18, 1.2, 180, 110, 50, 1.2],
  ['Baba al Rum', 290, 5, 45, 9, 5, 28, 0.8, 120, 90, 30, 0.8],
  ['Pastiera Napoletana', 330, 7.5, 45, 13, 5.5, 25, 1.4, 120, 130, 60, 1.0],
  ['Cassata Siciliana', 360, 6, 52, 14, 7, 42, 1, 90, 140, 80, 0.8],
  ['Bigne alla Crema', 280, 6, 30, 15, 7.5, 18, 0.5, 120, 110, 70, 0.8],
  ['Zeppola di San Giuseppe', 350, 6, 38, 19, 6, 20, 0.8, 120, 100, 60, 1.0],
  ['Maritozzo con la Panna', 370, 6, 38, 21.5, 13, 16, 1.2, 160, 110, 50, 0.9],
  ['Bombolone alla Crema', 360, 6.5, 44, 17.5, 6.5, 18, 1.3, 200, 100, 50, 1.0],
  ['Cornetto alla Crema', 380, 7, 46, 18.5, 10, 18, 1.5, 300, 110, 40, 1.2],
  ['Cornetto Integrale al Miele', 390, 7.5, 47, 19, 10.5, 15, 4, 300, 160, 35, 1.5],
  ['Panettone', 365, 7, 52, 14, 8, 25, 2, 180, 150, 50, 1.2],
  ['Pandoro', 405, 8, 50, 19.5, 11, 20, 1.5, 200, 110, 40, 1.1],
  ['Colomba Pasquale', 380, 7.5, 50, 16.5, 8.5, 25, 2, 180, 140, 45, 1.2],
  ['Panna Cotta', 230, 3, 23, 14.5, 9, 22, 0, 40, 110, 80, 0.1],
  ['Torta della Nonna', 360, 7, 45, 17, 8.5, 25, 1.2, 140, 120, 70, 1.0],
  ['Crostata di Marmellata', 400, 5, 60, 15.5, 8, 33, 1.5, 120, 100, 30, 1.0],
  ['Torta Caprese', 470, 8, 40, 31, 13, 32, 3.5, 60, 300, 60, 2.5],
  ['Sbrisolona', 490, 8.5, 54, 26, 11, 25, 3, 70, 230, 60, 1.6],
  ['Cantucci', 430, 10, 64, 14, 2, 30, 3.5, 150, 250, 80, 2.0],
  ['Amaretti', 440, 8, 70, 14.5, 1.2, 55, 3, 40, 260, 60, 1.4],
  ['Baci di Dama', 520, 7.5, 54, 30.5, 10, 30, 3, 50, 200, 50, 1.6],
  ['Torrone alle Mandorle', 450, 10, 60, 19, 2.2, 52, 3.5, 40, 300, 100, 1.8],
  ['Sorbetto al Limone', 120, 0.3, 30, 0, 0, 28, 0.2, 10, 40, 4, 0.1],
  ['Semifreddo al Torroncino', 330, 5, 32, 20, 11, 28, 0.8, 60, 150, 80, 0.6],
]);

// === VERDURE E FRUTTA AGGIUNTIVE ===
const VERDURE_FRUTTA = [
  ...group('Verdure', 'Verdure di stagione', [
    ['Cardi', 17, 0.7, 2.4, 0.1, 0, 1.6, 1.6, 170, 400, 70, 0.7],
    ['Agretti', 17, 1.8, 1.4, 0.2, 0, 0.8, 2.7, 80, 450, 130, 2.0],
    ['Puntarelle', 15, 1.4, 1.6, 0.3, 0.1, 0.7, 2.6, 30, 300, 75, 0.7],
    ['Friarielli', 22, 2.8, 2, 0.3, 0, 0.5, 2.9, 30, 300, 100, 1.5],
    ['Borragine', 21, 1.8, 3, 0.7, 0.2, 0.5, 1.5, 80, 470, 93, 3.3],
    ['Taccole', 42, 2.8, 7.5, 0.2, 0, 4, 2.6, 4, 200, 43, 2.1],
    ['Cavolo Romanesco', 25, 2.6, 3, 0.3, 0, 1.8, 2.6, 20, 300, 25, 0.6],
    ['Pak Choi', 13, 1.5, 2.2, 0.2, 0, 1.2, 1, 65, 252, 105, 0.8],
    ['Germogli di Soia', 30, 3, 5.9, 0.2, 0, 4, 1.8, 6, 149, 13, 0.9],
    ['Fiori di Zucca', 15, 1, 3.3, 0.1, 0, 1, 0.9, 5, 170, 39, 0.7],
    ['Peperoni Friggitelli', 25, 1, 4.5, 0.2, 0, 3, 1.5, 3, 200, 10, 0.4],
    ['Pomodorini Datterini', 22, 1, 3.9, 0.2, 0, 3.4, 1.4, 5, 290, 10, 0.3],
    ['Zucchine Trombetta', 16, 1.3, 1.6, 0.1, 0, 1.4, 1.3, 3, 250, 20, 0.4],
    ['Verdure Grigliate Miste', 70, 1.5, 5, 5, 0.7, 3.5, 2.5, 150, 280, 20, 0.6],
    ['Caponata Siciliana', 110, 1.5, 9, 7.5, 1, 7, 2.6, 400, 300, 25, 0.6],
  ]),
  ...group('Frutta', 'Frutta esotica e particolare', [
    ['Melograno', 83, 1.7, 18.7, 1.2, 0.1, 13.7, 4, 3, 236, 10, 0.3],
    ['Kaki', 70, 0.6, 18.6, 0.2, 0, 12.5, 3.6, 1, 161, 8, 0.2],
    ['Fico d\'India', 41, 0.7, 9.6, 0.5, 0.1, 9.6, 3.6, 5, 220, 56, 0.3],
    ['Nespole', 47, 0.4, 12, 0.2, 0, 6.1, 1.7, 1, 266, 16, 0.3],
    ['Giuggiole', 79, 1.2, 20, 0.2, 0, 15, 1.4, 3, 250, 21, 0.5],
    ['Physalis', 53, 1.9, 11.2, 0.7, 0.1, 9, 2, 1, 320, 9, 1.0],
    ['Carambola', 31, 1, 6.7, 0.3, 0, 4, 2.8, 2, 133, 3, 0.1],
    ['Pitaya', 60, 1.2, 13, 0.4, 0.1, 8, 3, 1, 220, 18, 0.7],
    ['Guava', 68, 2.6, 14.3, 1, 0.3, 8.9, 5.4, 2, 417, 18, 0.3],
    ['Lime', 30, 0.7, 10.5, 0.2, 0, 1.7, 2.8, 2, 102, 33, 0.6],
    ['Cedro', 40, 0.6, 9, 0.2, 0, 2.5, 2.5, 2, 150, 40, 0.3],
    ['Uva Fragola', 67, 0.6, 17, 0.4, 0.1, 16, 0.9, 2, 190, 14, 0.3],
    ['More di Gelso', 43, 1.4, 9.8, 0.4, 0, 8.1, 1.7, 10, 194, 39, 1.9],
    ['Ribes Rosso', 56, 1.4, 13.8, 0.2, 0, 7.4, 4.3, 1, 275, 33, 1.0],
    ['Uva Spina', 44, 0.9, 10.2, 0.6, 0, 7, 4.3, 1, 198, 25, 0.3],
  ]),
];

export const EXTRA_FOODS: FoodEntry[] = [
  ...PASTA, ...PANE_PIZZA, ...VINI, ...SALUMI, ...FORMAGGI, ...CARNE, ...PESCE, ...DOLCI, ...VERDURE_FRUTTA,
];
