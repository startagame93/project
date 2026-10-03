import {
  Flame, Salad, Dumbbell, Scale, BookOpen, Droplet, Pill, ShoppingCart, Palette, Bell,
  CalendarDays, ScanBarcode, CloudOff, MessageCircle, Layers, type LucideIcon,
} from 'lucide-react';

export const APP_VERSION = 'alfa-1.0';
export const APP_VERSION_LABEL = 'Alfa 1.0';

export interface ManualSection {
  icon: LucideIcon;
  title: string;
  content: string;
  since: string;
}

// Add new features here with `since: APP_VERSION`: they get the "New" badge and appear in the news popup.
export const MANUAL_SECTIONS: ManualSection[] = [
  { since: 'alfa-1.0', icon: CalendarDays, title: 'Calendario mensile', content: 'Dall\'icona calendario in alto apri la vista mensile. Scorri tra i mesi passati e futuri: per ogni giorno vedi pasti consumati, allenamenti, acqua e pasti pianificati. Spunta il giorno quando hai completato tutto.' },
  { since: 'alfa-1.0', icon: Dumbbell, title: 'Libreria esercizi', content: 'Oltre 500 esercizi organizzati per gruppo muscolare e attrezzo. Scegli il gruppo dalla griglia, filtra per attrezzo o cerca per nome, poi registra serie e ripetizioni.' },
  { since: 'alfa-1.0', icon: Palette, title: 'Palette colori', content: 'In Impostazioni > Aspetto, oltre a Chiaro, Scuro e Sistema, puoi scegliere tra 12 palette colori (Oceano, Foresta, AMOLED, Cyberpunk, Minimal e altre). Il cambio e immediato.' },
  { since: 'alfa-1.0', icon: CloudOff, title: 'Offline e backup', content: 'Senza connessione i dati restano salvati sul telefono e vengono sincronizzati appena torna la rete. In Impostazioni puoi esportare un backup completo (JSON) o un file CSV da aprire con Excel.' },
  { since: 'alfa-1.0', icon: ScanBarcode, title: 'Scanner prodotti', content: 'Nella sezione Alimenti tocca "Scannerizza Prodotto" e inquadra il codice a barre: i valori nutrizionali vengono importati automaticamente. Se il prodotto non viene trovato puoi inserire i valori a mano.' },
  { since: 'alfa-1.0', icon: Layers, title: 'Alimenti per categoria', content: 'Oltre 1.100 alimenti divisi in categorie e tipologie (es. Pasta > Pasta corta > Penne Rigate). I valori nutrizionali compaiono subito, prima ancora di scegliere i grammi.' },
  { since: 'alfa-1.0', icon: MessageCircle, title: 'Bacheca segnalazioni', content: 'Le segnalazioni sono pubbliche: prima di scriverne una controlla se il problema e gia stato segnalato. Un pallino rosso indica nuove segnalazioni non ancora lette.' },
  { since: 'alpha-4.0', icon: Flame, title: 'Dashboard', content: 'La schermata principale mostra un riepilogo giornaliero: calorie consumate e obiettivo, macro, acqua bevuta e calorie bruciate con l\'attivita.' },
  { since: 'alpha-4.0', icon: Salad, title: 'Piano Alimentare', content: 'Crea un piano settimanale con 5 pasti. Per ogni pasto aggiungi alimenti dal database con i grammi: calorie e nutrienti si calcolano da soli. Spunta i pasti completati: finiranno nello storico del calendario.' },
  { since: 'alpha-4.0', icon: BookOpen, title: 'Database Alimenti', content: 'Cerca un alimento per nome o filtra per categoria e tipologia. Puoi anche creare alimenti personalizzati.' },
  { since: 'alpha-4.0', icon: Scale, title: 'Corpo e fabbisogno', content: 'Registra peso, massa grassa e circonferenze. Qui trovi l\'unico calcolatore del fabbisogno calorico (metabolismo basale e consumo giornaliero), usato da tutta l\'app.' },
  { since: 'alpha-4.0', icon: Droplet, title: 'Nutrizione & Integratori', content: 'Traccia l\'acqua, gli integratori e i micronutrienti, con avvisi per eventuali carenze.' },
  { since: 'alpha-4.0', icon: ShoppingCart, title: 'Lista della Spesa', content: 'Genera la lista della spesa dal piano alimentare settimanale e spunta gli articoli mentre li compri.' },
  { since: 'alpha-4.0', icon: Bell, title: 'Notifiche', content: 'Promemoria per pasti, idratazione e integratori, configurabili dalle Impostazioni.' },
  { since: 'alpha-4.0', icon: Pill, title: 'Account e dati', content: 'Ogni account ha i propri dati, salvati nel cloud e sul dispositivo.' },
];

export const NEW_SECTIONS = MANUAL_SECTIONS.filter((s) => s.since === APP_VERSION);
