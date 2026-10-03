import {
  Flame, Salad, Dumbbell, Scale, BookOpen, Droplet, Pill, ShoppingCart, Palette, Bell,
  CalendarDays, ScanBarcode, CloudOff, MessageCircle, Layers, ClipboardPaste, KeyRound, type LucideIcon,
} from 'lucide-react';

// Single source of truth is "version" in package.json: bump the minor (1.5.0 -> 1.6.0 ... 1.9.0 -> 2.0.0) for each release.
export const APP_VERSION = __APP_VERSION__.split('.').slice(0, 2).join('.');
export const APP_VERSION_LABEL = `Alfa ${APP_VERSION}`;

export interface ManualSection {
  icon: LucideIcon;
  title: string;
  content: string;
  since: string;
  steps?: string[];
  tips?: string[];
}

export const PASTE_IMPORT_GUIDE: ManualSection = {
  since: '1.5',
  icon: ClipboardPaste,
  title: 'Importa la dieta con copia e incolla',
  content: 'Copia il testo della dieta o della scheda da qualsiasi fonte (PDF, Word, WhatsApp, email, note) e incollalo nell\'app: giorni, pasti e alimenti vengono smistati da soli e collegati al database con grammi e valori nutrizionali.',
  steps: [
    'Apri il PDF o il documento della dieta, tieni premuto sul testo e scegli "Seleziona tutto", poi "Copia".',
    'In NutriPlan vai su Piano Alimentare e tocca "Incolla dieta" (per le schede di allenamento: Palestra > "Incolla scheda").',
    'Tocca il pulsante "Incolla" oppure tieni premuto nel riquadro e scegli "Incolla". Va bene anche un unico blocco di testo senza a capo.',
    'Tocca "Analizza e importa": l\'app crea le settimane (Settimana 1, Settimana 2...) e mette ogni pasto nel giorno giusto.',
    'Controlla il risultato: gli alimenti in arancione con la scritta "sconosciuto" non sono stati trovati nel database.',
    'Tocca la matita sul pasto, poi tocca l\'alimento sconosciuto e riscrivilo con la quantità (es. "riso basmati 80 g"): se viene trovato, i valori si aggiungono da soli. Con la X lo elimini.',
  ],
  tips: [
    'Scrivi i nomi dei giorni (Lunedì, Martedì... oppure "Giorno 1") e dei pasti (Colazione, Spuntino, Pranzo, Merenda, Cena): sono le parole chiave che guidano la lettura.',
    'Per piani su più settimane lascia nel testo le intestazioni "Settimana 1", "Settimana 2"; se la dieta dice "per 4 settimane" le settimane vengono ripetute in automatico.',
    'Se il testo non indica i giorni, gli stessi pasti vengono messi su tutti e 7 i giorni.',
    'Le alternative introdotte da "oppure" o "in alternativa" vengono saltate: resta la prima scelta.',
    'Le quantità scritte come cucchiaio, cucchiaino, fetta, vasetto, tazza o numero di pezzi (es. "2 uova") vengono convertite in grammi.',
    'Se la dieta è già vuota, l\'importazione la sostituisce; altrimenti le nuove settimane vengono aggiunte in coda.',
    'Con la chiave Gemini attiva la lettura è ancora più precisa sui testi disordinati, ed è necessaria per le schede di allenamento.',
  ],
};

export const GEMINI_KEY_GUIDE: ManualSection = {
  since: '1.5',
  icon: KeyRound,
  title: 'Come ottenere la chiave Gemini (gratis)',
  content: 'La chiave Gemini permette all\'app di usare l\'intelligenza artificiale di Google per leggere diete e schede incollate. È gratuita, si crea in pochi passaggi e resta salvata solo sul tuo telefono.',
  steps: [
    'Dal browser del telefono o del computer apri il sito aistudio.google.com/apikey.',
    'Accedi con il tuo account Google (lo stesso di Gmail). Al primo accesso accetta i termini di servizio.',
    'Tocca "Create API key" (o "Crea chiave API"). Se ti chiede un progetto, scegli quello proposto o creane uno nuovo: va bene qualsiasi nome.',
    'Quando compare la chiave (una lunga sequenza che inizia con "AIza"), tocca l\'icona di copia accanto.',
    'Apri NutriPlan, vai in Impostazioni e cerca la scheda "Lettura testi con IA".',
    'Incolla la chiave nel campo "Chiave API Gemini" e tocca "Verifica e salva". Se compare "IA attiva" è tutto pronto.',
  ],
  tips: [
    'Il piano gratuito ha un limite di richieste al minuto: se l\'app segnala "troppe richieste", aspetta un minuto e riprova.',
    'Se la verifica fallisce, controlla di aver copiato la chiave per intero, senza spazi, e di essere connesso a internet.',
    'Non condividere la chiave con nessuno. Puoi eliminarla in qualsiasi momento dal cestino nell\'app o dal sito AI Studio, e crearne una nuova.',
    'Senza chiave l\'importazione delle diete funziona comunque, con la lettura di base dell\'app.',
  ],
};

// Add new features here with `since` set to the release version: they get the "New" badge and appear in the news popup.
export const MANUAL_SECTIONS: ManualSection[] = [
  PASTE_IMPORT_GUIDE,
  GEMINI_KEY_GUIDE,
  {
    since: '1.5', icon: Salad, title: 'Gestire le settimane della dieta',
    content: 'Il piano alimentare può avere più settimane, ognuna con 7 giorni e i suoi pasti.',
    steps: [
      'In Piano Alimentare tocca il nome della settimana in alto per aprire la gestione settimane.',
      'Tocca una settimana per aprirla, la matita per rinominarla (es. "Settimana di scarico"), il cestino per eliminarla.',
      'Con "Aggiungi" crei una nuova settimana vuota; con le frecce ai lati del nome passi da una settimana all\'altra.',
      'Il pulsante "Cancella dieta" (X) svuota l\'intero piano dopo una conferma e riparte da una settimana vuota.',
    ],
    tips: ['Lo storico dei pasti già consumati resta salvato anche se cancelli la dieta.'],
  },
  {
    since: '1.5', icon: CalendarDays, title: 'Calendario mensile',
    content: 'Dall\'icona calendario in alto apri la vista mensile. Per ogni giorno vedi pasti consumati, allenamenti, acqua, pasti pianificati e allenamenti della tua scheda.',
    tips: ['Scorri tra i mesi passati e futuri con le frecce.', 'Spunta il giorno quando hai completato tutto: resterà evidenziato.'],
  },
  {
    since: '1.5', icon: Dumbbell, title: 'Libreria esercizi e scheda',
    content: 'Oltre 500 esercizi organizzati per gruppo muscolare e attrezzo. Scegli il gruppo dalla griglia, filtra per attrezzo o cerca per nome, poi registra serie e ripetizioni.',
    tips: ['Se hai importato una scheda, in Palestra scegli il giorno e tocca + accanto a un esercizio per registrarlo con un tocco.'],
  },
  { since: '1.5', icon: Palette, title: 'Palette colori', content: 'In Impostazioni > Aspetto, oltre a Chiaro, Scuro e Sistema, puoi scegliere tra 12 palette colori (Oceano, Foresta, AMOLED, Cyberpunk, Minimal e altre). Ogni palette cambia sfondi, schede, bordi e colori di accento dell\'intera app, all\'istante.' },
  {
    since: '1.5', icon: CloudOff, title: 'Offline e backup',
    content: 'Senza connessione i dati restano salvati sul telefono e vengono sincronizzati appena torna la rete.',
    steps: [
      'Vai in Impostazioni e scorri fino alla scheda "Backup & Ripristino".',
      'Tocca "JSON" per salvare un file di backup completo da conservare o da ripristinare su un altro telefono.',
      'Tocca "CSV" per un file da aprire con Excel o Fogli Google.',
      'Per ripristinare tocca "Ripristina" e scegli il file di backup salvato in precedenza.',
    ],
  },
  {
    since: '1.5', icon: ScanBarcode, title: 'Scanner prodotti',
    content: 'Nella sezione Alimenti tocca "Scannerizza Prodotto" e inquadra il codice a barre: i valori nutrizionali vengono importati automaticamente.',
    tips: ['Al primo utilizzo consenti l\'accesso alla fotocamera.', 'Se il prodotto non viene trovato puoi inserire i valori a mano leggendoli dall\'etichetta.'],
  },
  { since: '1.5', icon: Layers, title: 'Alimenti per categoria', content: 'Oltre 1.100 alimenti divisi in categorie e tipologie (es. Pasta > Pasta corta > Penne Rigate). I valori nutrizionali compaiono subito, prima ancora di scegliere i grammi.' },
  { since: '1.5', icon: MessageCircle, title: 'Bacheca segnalazioni', content: 'Le segnalazioni sono pubbliche: prima di scriverne una controlla se il problema è già stato segnalato. Un pallino rosso indica nuove segnalazioni non ancora lette.' },
  { since: '1.0', icon: Flame, title: 'Dashboard', content: 'La schermata principale mostra un riepilogo giornaliero: calorie consumate e obiettivo, macro, acqua bevuta e calorie bruciate con l\'attività.' },
  {
    since: '1.0', icon: Salad, title: 'Piano Alimentare',
    content: 'Crea un piano settimanale con 5 pasti. Per ogni pasto aggiungi alimenti con i grammi: calorie e nutrienti si calcolano da soli.',
    steps: [
      'Scegli il giorno dalla barra in alto e tocca la matita su un pasto (o un pulsante + sotto i pasti per aggiungerne uno).',
      'Nel campo "Aggiungi alimento" scrivi nome e quantità, es. "petto di pollo 150 g", e tocca +: se è nel database i valori vengono sommati al pasto.',
      'Tocca un alimento già inserito per correggerlo, oppure la X per eliminarlo, poi "Salva Pasto".',
      'Spunta il pasto con il segno di spunta quando lo hai consumato: finirà nello storico del calendario.',
    ],
  },
  { since: '1.0', icon: BookOpen, title: 'Database Alimenti', content: 'Cerca un alimento per nome o filtra per categoria e tipologia. Puoi anche creare alimenti personalizzati: verranno riconosciuti anche quando incolli una dieta.' },
  { since: '1.0', icon: Scale, title: 'Corpo e fabbisogno', content: 'Registra peso, massa grassa e circonferenze. Qui trovi l\'unico calcolatore del fabbisogno calorico (metabolismo basale e consumo giornaliero), usato da tutta l\'app.' },
  { since: '1.0', icon: Droplet, title: 'Nutrizione & Integratori', content: 'Traccia l\'acqua, gli integratori e i micronutrienti, con avvisi per eventuali carenze.' },
  { since: '1.0', icon: ShoppingCart, title: 'Lista della Spesa', content: 'Genera la lista della spesa dal piano alimentare della settimana aperta con "Lista Spesa" e spunta gli articoli mentre li compri.' },
  { since: '1.0', icon: Bell, title: 'Notifiche', content: 'Promemoria per pasti, idratazione e integratori, configurabili dalle Impostazioni.' },
  { since: '1.0', icon: Pill, title: 'Account e dati', content: 'Ogni account ha i propri dati, salvati nel cloud e sul dispositivo. La versione dell\'app è indicata sotto l\'icona e in questo manuale.' },
];

export const NEW_SECTIONS = MANUAL_SECTIONS.filter((s) => s.since === APP_VERSION);
