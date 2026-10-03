import {
  Flame, Salad, Dumbbell, Scale, BookOpen, Droplet, Pill, ShoppingCart, Palette, Bell,
  CalendarDays, ScanBarcode, CloudOff, MessageCircle, Layers, Sparkles, type LucideIcon,
} from 'lucide-react';

// Single source of truth is "version" in package.json: bump the minor (1.5.0 -> 1.6.0 ... 1.9.0 -> 2.0.0) for each release.
export const APP_VERSION = __APP_VERSION__.split('.').slice(0, 2).join('.');
export const APP_VERSION_LABEL = `Alfa ${APP_VERSION}`;

export interface ManualSection {
  icon: LucideIcon;
  title: string;
  content: string;
  since: string;
}

// Add new features here with `since` set to the release version: they get the "New" badge and appear in the news popup.
export const MANUAL_SECTIONS: ManualSection[] = [
  { since: '1.5', icon: Sparkles, title: 'Lettura PDF con IA', content: 'Aggiungi in Impostazioni la tua chiave Google Gemini gratuita: l\'app leggera diete e schede di allenamento in PDF (anche scansionate) e le inserira da sola nei giorni giusti. Le diete vanno nel Piano Alimentare, le schede nella sezione Palestra, dove puoi registrare ogni esercizio con un tocco.' },
  { since: '1.5', icon: CalendarDays, title: 'Calendario mensile', content: 'Dall\'icona calendario in alto apri la vista mensile. Scorri tra i mesi passati e futuri: per ogni giorno vedi pasti consumati, allenamenti, acqua, pasti pianificati e allenamenti della tua scheda. Spunta il giorno quando hai completato tutto.' },
  { since: '1.5', icon: Dumbbell, title: 'Libreria esercizi', content: 'Oltre 500 esercizi organizzati per gruppo muscolare e attrezzo. Scegli il gruppo dalla griglia, filtra per attrezzo o cerca per nome, poi registra serie e ripetizioni.' },
  { since: '1.5', icon: Palette, title: 'Palette colori', content: 'In Impostazioni > Aspetto, oltre a Chiaro, Scuro e Sistema, puoi scegliere tra 12 palette colori (Oceano, Foresta, AMOLED, Cyberpunk, Minimal e altre). Ogni palette cambia sfondi, schede, bordi e colori di accento dell\'intera app, all\'istante.' },
  { since: '1.5', icon: CloudOff, title: 'Offline e backup', content: 'Senza connessione i dati restano salvati sul telefono e vengono sincronizzati appena torna la rete. In Impostazioni puoi esportare un backup completo (JSON) o un file CSV da aprire con Excel.' },
  { since: '1.5', icon: ScanBarcode, title: 'Scanner prodotti', content: 'Nella sezione Alimenti tocca "Scannerizza Prodotto" e inquadra il codice a barre: i valori nutrizionali vengono importati automaticamente. Se il prodotto non viene trovato puoi inserire i valori a mano.' },
  { since: '1.5', icon: Layers, title: 'Alimenti per categoria', content: 'Oltre 1.100 alimenti divisi in categorie e tipologie (es. Pasta > Pasta corta > Penne Rigate). I valori nutrizionali compaiono subito, prima ancora di scegliere i grammi.' },
  { since: '1.5', icon: MessageCircle, title: 'Bacheca segnalazioni', content: 'Le segnalazioni sono pubbliche: prima di scriverne una controlla se il problema e gia stato segnalato. Un pallino rosso indica nuove segnalazioni non ancora lette.' },
  { since: '1.0', icon: Flame, title: 'Dashboard', content: 'La schermata principale mostra un riepilogo giornaliero: calorie consumate e obiettivo, macro, acqua bevuta e calorie bruciate con l\'attivita.' },
  { since: '1.0', icon: Salad, title: 'Piano Alimentare', content: 'Crea un piano settimanale con 5 pasti. Per ogni pasto aggiungi alimenti dal database con i grammi: calorie e nutrienti si calcolano da soli. Spunta i pasti completati: finiranno nello storico del calendario.' },
  { since: '1.0', icon: BookOpen, title: 'Database Alimenti', content: 'Cerca un alimento per nome o filtra per categoria e tipologia. Puoi anche creare alimenti personalizzati.' },
  { since: '1.0', icon: Scale, title: 'Corpo e fabbisogno', content: 'Registra peso, massa grassa e circonferenze. Qui trovi l\'unico calcolatore del fabbisogno calorico (metabolismo basale e consumo giornaliero), usato da tutta l\'app.' },
  { since: '1.0', icon: Droplet, title: 'Nutrizione & Integratori', content: 'Traccia l\'acqua, gli integratori e i micronutrienti, con avvisi per eventuali carenze.' },
  { since: '1.0', icon: ShoppingCart, title: 'Lista della Spesa', content: 'Genera la lista della spesa dal piano alimentare settimanale e spunta gli articoli mentre li compri.' },
  { since: '1.0', icon: Bell, title: 'Notifiche', content: 'Promemoria per pasti, idratazione e integratori, configurabili dalle Impostazioni.' },
  { since: '1.0', icon: Pill, title: 'Account e dati', content: 'Ogni account ha i propri dati, salvati nel cloud e sul dispositivo.' },
];

export const NEW_SECTIONS = MANUAL_SECTIONS.filter((s) => s.since === APP_VERSION);
