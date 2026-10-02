import { useState } from 'react';
import { Modal } from '@/components/Modal';
import {
  Info, Flame, Salad, Dumbbell, Scale, BookOpen, Droplet,
  Pill, ShoppingCart, Moon, ChevronDown, ChevronUp, Bell,
} from 'lucide-react';

const MANUAL_SECTIONS = [
  {
    icon: Flame,
    title: 'Dashboard',
    content: 'La schermata principale mostra un riepilogo giornaliero: calorie consumate vs obiettivo, macro (proteine, carboidrati, grassi), acqua bevuta e calorie bruciate con l\'attivita. Da qui puoi accedere rapidamente a tutte le sezioni.',
  },
  {
    icon: Salad,
    title: 'Piano Alimentare',
    content: 'Crea un piano settimanale con 5 pasti: colazione, spuntino, pranzo, merenda e cena. Per ogni pasto puoi aggiungere alimenti dal database, specificare i grammi e il sistema calcolera automaticamente calorie e nutrienti. Spunta i pasti completati per tenere traccia.',
  },
  {
    icon: BookOpen,
    title: 'Database Alimenti',
    content: 'Oltre 500 alimenti organizzati per categoria. Le carni hanno sottocategorie con i singoli tagli. I pesci coprono tutte le specie piu comuni. Le bevande includono vini, birre e aperitivi. I piatti pronti includono poke bowl e piatti componibili. Quando selezioni un alimento, inserisci i grammi e la tabella nutrizionale si aggiorna in tempo reale.',
  },
  {
    icon: Dumbbell,
    title: 'Palestra & Attivita',
    content: 'Tre modalita di registrazione: 1) Esercizi di forza (sbarre, flessioni, pesi): registri serie e ripetizioni con il formato XxY (es. 3x5). 2) Attivita con stile (nuoto): inserisci durata e selezioni lo stile (libero, dorso, rana, delfino). 3) Attivita cardio (corsa, ciclismo): registri solo durata. Le calorie vengono stimate in base al tuo peso. Nella sezione Classifiche puoi confrontarti con altri utenti.',
  },
  {
    icon: Scale,
    title: 'Composizione Corporea',
    content: 'Registra misurazioni dettagliate: peso, body fat, e circonferenze (petto, pancia, vita, fianchi, braccia, cosce, collo, spalle, polpacci). Il sistema calcola automaticamente il BMI e ti dice se sei sottopeso, normopeso o sovrappeso, con consigli personalizzati in base al tuo obiettivo.',
  },
  {
    icon: Droplet,
    title: 'Nutrizione & Integratori',
    content: 'Traccia l\'acqua bevuta durante la giornata, registra gli integratori (creatina, caffeina, BCAA, ecc.) e monitora i micronutrienti (sodio, potassio, ferro, vitamine). Ricevi avvisi per carenze vitaminiche.',
  },
  {
    icon: ShoppingCart,
    title: 'Lista della Spesa',
    content: 'Genera automaticamente una lista della spesa in base al tuo piano alimentare settimanale. Spunta gli articoli mentre li compri.',
  },
  {
    icon: Moon,
    title: 'Tema Chiaro/Scura',
    content: 'Personalizza l\'aspetto dell\'app con tema chiaro, scuro o automatico (segue il sistema). Disponibile dall\'icona in alto a destra.',
  },
  {
    icon: Bell,
    title: 'Notifiche',
    content: 'Ricevi promemoria per i pasti, l\'idratazione e gli integratori. Configura gli orari e gli intervalli dalle Impostazioni.',
  },
];

const CHANGELOG_ALPHA_4 = [
  { tag: 'Nuovo', text: 'Sistema di autenticazione con account personale e isolamento dati' },
  { tag: 'Nuovo', text: 'Database alimenti espanso a 500 elementi con tagli di carne, specie di pesce, bevande e poke bowl' },
  { tag: 'Nuovo', text: 'Calcolo dinamico dei grammi per ogni alimento e pasto' },
  { tag: 'Nuovo', text: 'Tracciamento attivita con serie/ripetizioni, stili e classifiche' },
  { tag: 'Nuovo', text: 'Misurazioni corporee avanzate con BMI e valutazione automatica' },
  { tag: 'Nuovo', text: 'Sezione Informazioni con manuale d\'uso completo' },
  { tag: 'Nuovo', text: 'Sistema di supporto con ticket di segnalazione' },
  { tag: 'Nuovo', text: 'Dashboard amministratore per gestione utenti e ticket' },
  { tag: 'Nuovo', text: 'Persistenza assoluta con backup automatico' },
  { tag: 'Migliorato', text: 'Onboarding con raccolta metriche fisiche' },
  { tag: 'Migliorato', text: 'Interfaccia rinnovata con nuove icone e navigazione' },
  { tag: 'Fix', text: 'Corretta la perdita dati dopo riavvii e chiusure forzate' },
];

export function InfoScreen({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open onClose={onClose} title="Manuale d'uso" icon={Info}>
      <div className="space-y-2">
        {MANUAL_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.title;
          return (
            <div key={section.title} className="rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : section.title)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{section.title}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {isOpen && (
                <p className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in">
                  {section.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Novita - Alpha 4.0" icon={Flame}>
      <div className="space-y-2">
        {CHANGELOG_ALPHA_4.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 mt-0.5 ${
              item.tag === 'Nuovo' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' :
              item.tag === 'Migliorato' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
            }`}>
              {item.tag}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="btn-primary w-full mt-4">Inizia a esplorare</button>
    </Modal>
  );
}
