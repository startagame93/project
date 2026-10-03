import type { WorkoutCategory } from '@/types';

const ACTIVITY_CATEGORIES: { label: string; emoji: string }[] = [
  { label: 'Cardio', emoji: '🏃' },
  { label: 'Sport', emoji: '⚽' },
  { label: 'Acqua', emoji: '🏊' },
  { label: 'Combattimento', emoji: '🥊' },
  { label: 'Mind & Body', emoji: '🧘' },
  { label: 'Outdoor', emoji: '🏔️' },
  { label: 'Danza', emoji: '💃' },
  { label: 'Ciclismo', emoji: '🚴' },
  { label: 'Atletica', emoji: '🤸' },
];

export const CATEGORY_TYPE: Record<string, WorkoutCategory> = {
  'Combattimento': 'strength',
  'Acqua': 'time_style',
};

export const SWIM_STYLES = ['Stile Libero', 'Dorso', 'Rana', 'Delfino', 'Farfalla', 'Misti'];
export const DANCE_STYLES = ['Standard', 'Latino', 'Contemporaneo', 'Hip Hop', 'Classico'];

export interface WorkoutDef {
  group?: string;
  equipment?: string;
  name: string;
  category: string;
  met: number;
  emoji: string;
  styles?: string[];
}

const ACTIVITY_DATABASE: WorkoutDef[] = [
  // Cardio - time_only
  { name: 'Camminata veloce', category: 'Cardio', met: 4.3, emoji: '🚶' },
  { name: 'Corsa (8 km/h)', category: 'Cardio', met: 8.0, emoji: '🏃' },
  { name: 'Corsa (10 km/h)', category: 'Cardio', met: 9.8, emoji: '🏃' },
  { name: 'Corsa (12 km/h)', category: 'Cardio', met: 11.5, emoji: '🏃' },
  { name: 'Corsa in salita', category: 'Cardio', met: 12.0, emoji: '⛰️' },
  { name: 'Tapis roulant', category: 'Cardio', met: 7.0, emoji: '🏃' },
  { name: 'Ellittica', category: 'Cardio', met: 6.5, emoji: '🏃' },
  { name: 'Step machine', category: 'Cardio', met: 7.0, emoji: '🪜' },
  { name: 'Saltelli alla corda', category: 'Cardio', met: 11.0, emoji: '🪢' },
  { name: 'Burpees', category: 'Cardio', met: 10.0, emoji: '🔥' },
  { name: 'HIIT', category: 'Cardio', met: 10.0, emoji: '⚡' },
  { name: 'CrossFit', category: 'Cardio', met: 10.5, emoji: '🔥' },
  { name: 'Circuit training', category: 'Cardio', met: 8.0, emoji: '🔄' },

  // Forza - strength (sets/reps)

  // Sport - time_only
  { name: 'Calcio', category: 'Sport', met: 7.0, emoji: '⚽' },
  { name: 'Calcetto', category: 'Sport', met: 6.0, emoji: '⚽' },
  { name: 'Basket', category: 'Sport', met: 6.5, emoji: '🏀' },
  { name: 'Volley', category: 'Sport', met: 6.0, emoji: '🏐' },
  { name: 'Tennis (singolare)', category: 'Sport', met: 8.0, emoji: '🎾' },
  { name: 'Tennis (doppio)', category: 'Sport', met: 6.0, emoji: '🎾' },
  { name: 'Padel', category: 'Sport', met: 6.5, emoji: '🎾' },
  { name: 'Rugby', category: 'Sport', met: 10.0, emoji: '🏉' },
  { name: 'Football americano', category: 'Sport', met: 8.0, emoji: '🏈' },
  { name: 'Hockey su prato', category: 'Sport', met: 7.0, emoji: '🏒' },
  { name: 'Baseball', category: 'Sport', met: 5.0, emoji: '⚾' },
  { name: 'Golf', category: 'Sport', met: 4.3, emoji: '⛳' },
  { name: 'Pallamano', category: 'Sport', met: 8.0, emoji: '🤾' },
  { name: 'Ping pong', category: 'Sport', met: 4.0, emoji: '🏓' },
  { name: 'Badminton', category: 'Sport', met: 5.5, emoji: '🏸' },
  { name: 'Squash', category: 'Sport', met: 9.0, emoji: '🎾' },

  // Acqua - time_style
  { name: 'Nuoto', category: 'Acqua', met: 8.0, emoji: '🏊', styles: SWIM_STYLES },
  { name: 'Aquagym', category: 'Acqua', met: 5.0, emoji: '💧' },
  { name: 'Surf', category: 'Acqua', met: 6.0, emoji: '🏄' },
  { name: 'Windsurf', category: 'Acqua', met: 6.0, emoji: '🏄' },
  { name: 'Kitesurf', category: 'Acqua', met: 7.0, emoji: '🪁' },
  { name: 'SUP (paddleboard)', category: 'Acqua', met: 6.0, emoji: '🚣' },
  { name: 'Canottaggio', category: 'Acqua', met: 8.5, emoji: '🚣' },
  { name: 'Kayak', category: 'Acqua', met: 7.0, emoji: '🛶' },
  { name: 'Rafting', category: 'Acqua', met: 7.0, emoji: '🌊' },
  { name: 'Subacquea', category: 'Acqua', met: 7.0, emoji: '🤿' },
  { name: 'Pallanuoto', category: 'Acqua', met: 10.0, emoji: '💧' },
  { name: 'Tuffi', category: 'Acqua', met: 5.0, emoji: '🤿' },
  { name: 'Acqua jogging', category: 'Acqua', met: 8.0, emoji: '💧' },

  // Combattimento - strength
  { name: 'Boxe', category: 'Combattimento', met: 9.0, emoji: '🥊' },
  { name: 'MMA', category: 'Combattimento', met: 10.0, emoji: '🥋' },
  { name: 'Judo', category: 'Combattimento', met: 9.0, emoji: '🥋' },
  { name: 'Karate', category: 'Combattimento', met: 8.0, emoji: '🥋' },
  { name: 'Taekwondo', category: 'Combattimento', met: 8.0, emoji: '🦶' },
  { name: 'BJJ / Grappling', category: 'Combattimento', met: 9.0, emoji: '🥋' },
  { name: 'Lotta', category: 'Combattimento', met: 8.0, emoji: '🤼' },
  { name: 'Kickboxing', category: 'Combattimento', met: 9.5, emoji: '🦵' },
  { name: 'Muay Thai', category: 'Combattimento', met: 10.0, emoji: '🥊' },
  { name: 'Krav Maga', category: 'Combattimento', met: 9.0, emoji: '🥋' },

  // Mind & Body - time_only
  { name: 'Yoga (Hatha)', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Yoga (Vinyasa)', category: 'Mind & Body', met: 4.0, emoji: '🧘' },
  { name: 'Yoga (Bikram)', category: 'Mind & Body', met: 5.0, emoji: '🧘' },
  { name: 'Pilates', category: 'Mind & Body', met: 3.5, emoji: '🧘' },
  { name: 'Tai Chi', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Stretching', category: 'Mind & Body', met: 2.5, emoji: '🤸' },
  { name: 'Ginnastica posturale', category: 'Mind & Body', met: 3.5, emoji: '🧘' },

  // Outdoor - time_only
  { name: 'Escursionismo (pianura)', category: 'Outdoor', met: 5.0, emoji: '🥾' },
  { name: 'Trekking (montagna)', category: 'Outdoor', met: 7.0, emoji: '🏔️' },
  { name: 'Arrampicata', category: 'Outdoor', met: 8.0, emoji: '🧗' },
  { name: 'Alpinismo', category: 'Outdoor', met: 9.0, emoji: '🏔️' },
  { name: 'Equitazione', category: 'Outdoor', met: 5.5, emoji: '🐎' },
  { name: 'Sci (discesa)', category: 'Outdoor', met: 6.0, emoji: '⛷️' },
  { name: 'Snowboard', category: 'Outdoor', met: 6.0, emoji: '🏂' },
  { name: 'Sci di fondo', category: 'Outdoor', met: 8.0, emoji: '🎿' },
  { name: 'Pattinaggio su ghiaccio', category: 'Outdoor', met: 6.0, emoji: '⛸️' },

  // Danza - time_style
  { name: 'Danza', category: 'Danza', met: 4.5, emoji: '💃', styles: DANCE_STYLES },
  { name: 'Zumba', category: 'Danza', met: 7.0, emoji: '💃' },
  { name: 'Balletto', category: 'Danza', met: 6.0, emoji: '🩰' },
  { name: 'Salsa', category: 'Danza', met: 5.5, emoji: '💃' },
  { name: 'Tango', category: 'Danza', met: 5.0, emoji: '💃' },

  // Ciclismo - time_only
  { name: 'Ciclismo (16 km/h)', category: 'Ciclismo', met: 6.0, emoji: '🚴' },
  { name: 'Ciclismo (20 km/h)', category: 'Ciclismo', met: 8.0, emoji: '🚴' },
  { name: 'Ciclismo (25 km/h)', category: 'Ciclismo', met: 10.0, emoji: '🚴' },
  { name: 'Ciclismo in salita', category: 'Ciclismo', met: 12.0, emoji: '⛰️' },
  { name: 'Cyclette (moderata)', category: 'Ciclismo', met: 5.5, emoji: '🚴' },
  { name: 'Cyclette (intensa)', category: 'Ciclismo', met: 8.5, emoji: '🚴' },
  { name: 'Spin bike', category: 'Ciclismo', met: 9.0, emoji: '🚴' },
  { name: 'Mountain bike', category: 'Ciclismo', met: 8.5, emoji: '🚵' },

  // Atletica - time_only
  { name: 'Salto in lungo', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Salto in alto', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Lancio del peso', category: 'Atletica', met: 6.0, emoji: '🤾' },
  { name: 'Maratona (training)', category: 'Atletica', met: 10.0, emoji: '🏃' },
  { name: 'Pattinaggio a rotelle', category: 'Atletica', met: 7.0, emoji: '🛼' },
  { name: 'Ginnastica artistica', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Parkour', category: 'Atletica', met: 9.0, emoji: '🤸' },
];

type Eq = 'B' | 'M' | 'C' | 'MA' | 'CL' | 'K' | 'E' | 'S' | 'EZ' | 'TRX';

export const EQUIPMENT: Record<Eq, string> = {
  B: 'Bilanciere', M: 'Manubri', C: 'Cavi', MA: 'Macchina', CL: 'Corpo libero',
  K: 'Kettlebell', E: 'Elastici', S: 'Smith machine', EZ: 'Bilanciere EZ', TRX: 'TRX',
};

export const MUSCLE_GROUPS: { label: string; emoji: string; met: number; exercises: [string, Eq[]][] }[] = [
  { label: 'Petto', emoji: '🫁', met: 5, exercises: [
    ['Panca piana con fermo', ['B', 'M', 'S']], ['Panca inclinata presa neutra', ['M']], ['Croci su panca declinata', ['M', 'C']], ['Chest press inclinata', ['MA', 'C']], ['Chest press declinata', ['MA']], ['Crossover ai cavi', ['C', 'E']], ['Spinte su fitball', ['M', 'K']], ['Guillotine press', ['B', 'S']], ['Piegamenti con zavorra', ['CL', 'E']], ['Piegamenti su anelli', ['TRX', 'CL']],
    ['Panca piana', ['B', 'M', 'S', 'MA']], ['Panca inclinata', ['B', 'M', 'S', 'MA']], ['Panca declinata', ['B', 'M', 'S']],
    ['Croci su panca piana', ['M', 'C']], ['Croci su panca inclinata', ['M', 'C']], ['Croci ai cavi alti', ['C']], ['Croci ai cavi bassi', ['C']],
    ['Chest press', ['MA', 'E']], ['Pec deck', ['MA']], ['Pullover', ['M', 'B', 'C']], ['Floor press', ['B', 'M', 'K']],
    ['Piegamenti', ['CL', 'TRX', 'E']], ['Piegamenti inclinati', ['CL']], ['Piegamenti declinati', ['CL']], ['Piegamenti diamante', ['CL']],
    ['Piegamenti larghi', ['CL']], ['Piegamenti esplosivi', ['CL']], ['Dip alle parallele (petto)', ['CL', 'MA']], ['Svend press', ['M']],
    ['Squeeze press', ['M']], ['Spinte a una mano', ['M', 'C', 'K']],
  ] },
  { label: 'Schiena', emoji: '🔙', met: 5.5, exercises: [
    ['Rematore Yates', ['B', 'S']], ['Rematore seal', ['B', 'M']], ['Rematore Kroc', ['M']], ['Rematore in piedi ai cavi', ['C', 'E']], ['Lat machine a un braccio', ['C', 'MA']], ['Pulley presa larga', ['C', 'MA']], ['Stacco trap bar', ['B']], ['Stacco con deficit', ['B']], ['Gorilla row', ['K', 'M']], ['Muscle-up', ['CL', 'TRX']], ['Pullover alla macchina', ['MA', 'C']],
    ['Stacco da terra', ['B', 'M', 'K']], ['Stacco sumo', ['B', 'K']], ['Rematore busto flesso', ['B', 'M', 'S', 'EZ']], ['Rematore a un braccio', ['M', 'C', 'K']],
    ['Rematore al T-bar', ['B', 'MA']], ['Rematore pendlay', ['B']], ['Rematore su panca inclinata', ['M', 'B']], ['Pulley basso', ['C', 'MA']],
    ['Lat machine presa larga', ['C', 'MA']], ['Lat machine presa stretta', ['C', 'MA']], ['Lat machine presa inversa', ['C', 'MA']], ['Lat machine dietro', ['C']],
    ['Trazioni presa prona', ['CL', 'E']], ['Trazioni presa supina', ['CL', 'E']], ['Trazioni presa neutra', ['CL', 'E']], ['Trazioni assistite', ['MA', 'E']],
    ['Pulldown a braccia tese', ['C', 'E']], ['Iperestensioni', ['CL', 'MA']], ['Good morning', ['B', 'E']], ['Rack pull', ['B']],
    ['Inverted row', ['CL', 'TRX', 'S']], ['Scrollate', ['B', 'M', 'S', 'MA']], ['Superman', ['CL']], ['Rematore alto', ['MA', 'C']],
  ] },
  { label: 'Spalle', emoji: '🤷', met: 5, exercises: [
    ['Alzate laterali su panca inclinata', ['M', 'C']], ['Alzate laterali a un braccio', ['M', 'C', 'K']], ['Lento seduto', ['B', 'M', 'S', 'K']], ['Lento a un braccio', ['M', 'K', 'C']], ['Z press', ['B', 'M', 'K']], ['Cuban press', ['M', 'B']], ['Lu raise', ['M']], ['Scaption', ['M', 'C', 'E']], ['Bradford press', ['B', 'S']], ['Pike push-up elevati', ['CL']],
    ['Lento avanti', ['B', 'M', 'S', 'MA']], ['Lento dietro', ['B', 'S']], ['Arnold press', ['M', 'K']], ['Push press', ['B', 'M', 'K']],
    ['Alzate laterali', ['M', 'C', 'MA', 'E']], ['Alzate frontali', ['M', 'B', 'C', 'E']], ['Alzate posteriori', ['M', 'C', 'MA']], ['Alzate a 90 gradi', ['M', 'C']],
    ['Tirate al mento', ['B', 'EZ', 'C', 'M']], ['Face pull', ['C', 'E']], ['Shoulder press', ['MA']], ['Landmine press', ['B']],
    ['Piegamenti pike', ['CL']], ['Verticale contro il muro', ['CL']], ['Bottoms-up press', ['K']], ['Extrarotazioni', ['C', 'E', 'M']],
    ['Y-raise', ['M', 'C', 'E']], ['Reverse pec deck', ['MA']], ['Turkish get-up', ['K', 'M']],
  ] },
  { label: 'Bicipiti', emoji: '💪', met: 4, exercises: [
    ['Curl Bayesian', ['C']], ['Curl presa larga', ['B', 'EZ']], ['Curl presa stretta', ['B', 'EZ', 'C']], ['Curl a martello incrociato', ['M', 'C']], ['Curl isometrico', ['M', 'E']], ['Curl con corda', ['C']], ['Curl prono su panca', ['M', 'EZ']], ['Curl Waiter', ['M']],
    ['Curl', ['B', 'M', 'EZ', 'C', 'E', 'K']], ['Curl a martello', ['M', 'C', 'E']], ['Curl concentrato', ['M', 'C']], ['Curl su panca Scott', ['EZ', 'M', 'MA']],
    ['Curl su panca inclinata', ['M']], ['Curl alternato', ['M', 'K']], ['Curl 21', ['B', 'EZ']], ['Spider curl', ['M', 'EZ']],
    ['Curl ai cavi alti', ['C']], ['Curl presa inversa', ['B', 'EZ', 'C']], ['Drag curl', ['B', 'EZ']], ['Curl Zottman', ['M']],
    ['Curl in piedi', ['MA']], ['Chin-up isometrico', ['CL']],
  ] },
  { label: 'Tricipiti', emoji: '🦾', met: 4, exercises: [
    ['French press su panca inclinata', ['EZ', 'M']], ['Estensioni con corda sopra la testa', ['C']], ['Pushdown a un braccio', ['C', 'E']], ['Rolling extension', ['M']], ['Kickback inclinato', ['M', 'C']], ['Estensioni in ginocchio', ['C']], ['Dip assistiti', ['MA', 'E']], ['California press', ['B', 'S']],
    ['French press', ['EZ', 'B', 'M']], ['Pushdown', ['C', 'E']], ['Pushdown con corda', ['C']], ['Pushdown presa inversa', ['C']],
    ['Estensioni sopra la testa', ['M', 'C', 'E', 'K']], ['Kickback', ['M', 'C', 'E']], ['Dip alle parallele (tricipiti)', ['CL', 'MA']], ['Dip tra panche', ['CL']],
    ['Panca presa stretta', ['B', 'S', 'M']], ['Skull crusher', ['EZ', 'B', 'M']], ['Tate press', ['M']], ['JM press', ['B', 'S']],
    ['Piegamenti stretti', ['CL']], ['Estensioni a un braccio', ['M', 'C']], ['Triceps machine', ['MA']],
  ] },
  { label: 'Gambe', emoji: '🦵', met: 6, exercises: [
    ['Squat con fermo', ['B', 'M', 'S']], ['Squat zercher', ['B']], ['Squat sumo', ['B', 'K', 'M']], ['Squat su panca', ['B', 'M', 'CL']], ['Belt squat', ['MA']], ['Affondi in diagonale', ['M', 'CL']], ['Affondi con salto', ['CL']], ['Leg curl in piedi', ['MA', 'C', 'E']], ['Cossack squat', ['CL', 'K', 'M']], ['Spanish squat', ['E']], ['V-squat', ['MA']], ['Heel elevated squat', ['B', 'M', 'K']],
    ['Squat', ['B', 'M', 'S', 'K', 'CL']], ['Front squat', ['B', 'K', 'M']], ['Goblet squat', ['M', 'K']], ['Squat bulgaro', ['M', 'B', 'S', 'CL']],
    ['Affondi in avanti', ['M', 'B', 'CL', 'K']], ['Affondi indietro', ['M', 'B', 'CL', 'S']], ['Affondi laterali', ['M', 'CL', 'K']], ['Affondi camminati', ['M', 'B', 'CL']],
    ['Leg press', ['MA']], ['Leg press a una gamba', ['MA']], ['Hack squat', ['MA', 'B']], ['Leg extension', ['MA', 'E']],
    ['Leg curl sdraiato', ['MA']], ['Leg curl seduto', ['MA']], ['Stacco rumeno', ['B', 'M', 'K']], ['Stacco a gambe tese', ['B', 'M']],
    ['Step-up', ['M', 'B', 'CL']], ['Sissy squat', ['CL', 'MA']], ['Pistol squat', ['CL', 'K', 'TRX']], ['Squat jump', ['CL', 'M']],
    ['Wall sit', ['CL']], ['Nordic curl', ['CL']], ['Pendulum squat', ['MA']], ['Box squat', ['B']], ['Adduttori', ['MA', 'C', 'E']],
    ['Abduttori', ['MA', 'C', 'E']],
  ] },
  { label: 'Glutei', emoji: '🍑', met: 5, exercises: [
    ['Hip thrust a una gamba', ['CL', 'M', 'B']], ['Hip abduction in piedi', ['C', 'E', 'MA']], ['Step-up laterale', ['M', 'CL']], ['B-stance hip thrust', ['B', 'M']], ['Glute ham raise', ['MA', 'CL']], ['Donkey kick', ['CL', 'E', 'C']], ['Squat con elastico', ['E']], ['Bulgarian split squat glutei', ['M', 'B', 'S']],
    ['Hip thrust', ['B', 'M', 'MA', 'S', 'E']], ['Glute bridge', ['CL', 'B', 'M', 'E']], ['Glute bridge a una gamba', ['CL', 'M']], ['Kickback glutei', ['C', 'MA', 'E']],
    ['Slanci posteriori', ['CL', 'E', 'C']], ['Frog pump', ['CL', 'M']], ['Clamshell', ['E', 'CL']], ['Fire hydrant', ['CL', 'E']],
    ['Monster walk', ['E']], ['Cable pull-through', ['C']], ['Reverse hyperextension', ['MA', 'CL']], ['Stacco a una gamba', ['M', 'K', 'B']],
    ['Kettlebell swing', ['K', 'M']], ['Sumo squat', ['M', 'K', 'B']], ['Curtsy lunge', ['M', 'CL']],
  ] },
  { label: 'Addome', emoji: '🎯', met: 4, exercises: [
    ['Crunch con peso', ['M', 'K']], ['Crunch alla fitball', ['CL', 'M']], ['Hanging windshield wiper', ['CL']], ['Side bend', ['M', 'C', 'K']], ['Plank su fitball', ['CL']], ['Stir the pot', ['CL']], ['L-sit', ['CL']], ['Jackknife', ['CL', 'TRX']], ['Pike su TRX', ['TRX']], ['Suitcase carry', ['M', 'K']], ['Landmine rotation', ['B']], ['Crunch al cavo in ginocchio', ['C']],
    ['Crunch', ['CL', 'C', 'MA']], ['Crunch inverso', ['CL']], ['Crunch obliquo', ['CL', 'C']], ['Sit-up', ['CL', 'M']],
    ['Plank', ['CL']], ['Plank laterale', ['CL']], ['Plank con tocco spalle', ['CL']], ['Russian twist', ['CL', 'M', 'K']],
    ['Leg raise a terra', ['CL']], ['Leg raise alla sbarra', ['CL']], ['Knee raise', ['CL']], ['Mountain climber', ['CL', 'TRX']],
    ['Bicycle crunch', ['CL']], ['Dead bug', ['CL', 'K']], ['Hollow hold', ['CL']], ['V-up', ['CL']],
    ['Ab wheel rollout', ['CL']], ['Pallof press', ['C', 'E']], ['Woodchopper', ['C', 'M', 'E']], ['Toes to bar', ['CL']],
    ['Dragon flag', ['CL']], ['Flutter kick', ['CL']], ['Farmer walk', ['M', 'K']],
  ] },
  { label: 'Polpacci', emoji: '🦶', met: 3.5, exercises: [
    ['Calf raise allo Smith', ['S']], ['Calf raise con salto', ['CL', 'M']], ['Calf raise piedi in dentro', ['MA', 'B', 'M']], ['Calf raise piedi in fuori', ['MA', 'B', 'M']], ['Farmer walk sulle punte', ['M', 'K']],
    ['Calf raise in piedi', ['MA', 'B', 'M', 'S', 'CL']], ['Calf raise seduto', ['MA', 'M', 'B']], ['Calf raise alla leg press', ['MA']], ['Calf raise a una gamba', ['CL', 'M']],
    ['Donkey calf raise', ['MA', 'CL']], ['Tibialis raise', ['CL', 'MA']], ['Salti sulle punte', ['CL']],
  ] },
  { label: 'Avambracci', emoji: '✊', met: 3.5, exercises: [
    ['Curl dietro la schiena', ['B', 'C']], ['Pronazione e supinazione', ['M']], ['Deviazione radiale', ['M']], ['Towel hang', ['CL']], ['Fat grip curl', ['M', 'B']], ['Hand gripper', ['CL']],
    ['Wrist curl', ['B', 'M', 'C', 'EZ']], ['Reverse wrist curl', ['B', 'M', 'C', 'EZ']], ['Wrist roller', ['CL']], ['Dead hang', ['CL']],
    ['Pinch grip hold', ['CL']], ['Plate pinch', ['CL']], ['Farmer hold', ['M', 'K']],
  ] },
  { label: 'Total body', emoji: '🔥', met: 8, exercises: [
    ['Power clean', ['B', 'K']], ['Hang clean', ['B', 'M', 'K']], ['Squat clean', ['B']], ['Push jerk', ['B', 'M']], ['Kettlebell flow', ['K']], ['Renegade row', ['M', 'K']], ['Burpee con salto alla sbarra', ['CL']], ['Medicine ball slam', ['CL']], ['Overhead walking lunge', ['B', 'M', 'K']], ['Squat to press', ['M', 'K', 'E']],
    ['Clean', ['B', 'M', 'K']], ['Clean and jerk', ['B']], ['Snatch', ['B', 'M', 'K']], ['Thruster', ['B', 'M', 'K']],
    ['Burpee', ['CL', 'M']], ['Man maker', ['M']], ['Wall ball', ['CL']], ['Sled push', ['MA']], ['Battle ropes', ['CL']],
    ['Bear crawl', ['CL']], ['Devil press', ['M']], ['Sandbag carry', ['CL']],
  ] },
];

const STRENGTH_EXERCISES: WorkoutDef[] = MUSCLE_GROUPS.flatMap((g) =>
  g.exercises.flatMap(([name, eqs]) =>
    eqs.map((eq) => ({
      name: eqs.length === 1 && eq === 'CL' ? name : `${name} (${EQUIPMENT[eq]})`,
      category: g.label,
      group: g.label,
      equipment: EQUIPMENT[eq],
      met: eq === 'CL' ? g.met + 0.5 : g.met,
      emoji: g.emoji,
    })),
  ),
);

for (const g of MUSCLE_GROUPS) CATEGORY_TYPE[g.label] = 'strength';

export const WORKOUT_GROUPS: { label: string; emoji: string; strength: boolean }[] = [
  ...MUSCLE_GROUPS.map((g) => ({ label: g.label, emoji: g.emoji, strength: true })),
  ...ACTIVITY_CATEGORIES.map((c) => ({ ...c, strength: false })),
];

export const WORKOUT_DATABASE: WorkoutDef[] = [...STRENGTH_EXERCISES, ...ACTIVITY_DATABASE];

export function getWorkoutCategory(workout: WorkoutDef): WorkoutCategory {
  return CATEGORY_TYPE[workout.category] ?? 'time_only';
}
