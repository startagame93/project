# Project memory

## Product intent & audience

- Nutriplan è una PWA italiana per gestire diete multi-settimana, pasti, nutrizione avanzata, integratori, micronutrienti, metriche di salute e liste della spesa dinamiche.
- Gli utenti gestiscono dati personali e sensibili, inclusi peso, diete e storico alimentare; l’isolamento tra account è un requisito fondamentale.
- Gli amministratori necessitano di strumenti sicuri per audit, gestione operativa e supervisione dei dati globali.

## Brand personality & voice

- Usare un italiano chiaro, diretto e comprensibile per privacy, dati sanitari, sicurezza, cancellazione account, stato offline ed errori.
- Le comunicazioni di sicurezza devono spiegare con trasparenza cosa viene protetto, cosa viene eliminato e quali azioni sono irreversibili.
- I messaggi admin devono distinguere chiaramente permessi, ambito dell’azione e conseguenze distruttive.

## Visual design & UX direction

- Mantenere un’esperienza curata e adatta alla produzione, evitando dashboard generiche.
- Il tema Retro/Arcade/Pixel Art è esclusivamente estetico: palette retrò, grafiche e icone dedicate; non deve alterare logica, dati o sicurezza dell’app.
- L’audio arcade è opzionale, con controlli di mute e volume; le preferenze audio devono essere persistite localmente e non devono disturbare l’uso normale.
- Le schermate privacy e cancellazione account devono essere facilmente raggiungibili, leggibili su mobile e desktop, con conferma esplicita prima dell’eliminazione definitiva.
- Le funzionalità amministrative e i relativi stati di sicurezza devono essere distinguibili dalle viste utente senza esporre dati o azioni non autorizzate.
- Nella gestione bug del pannello admin, il comando per copiare le segnalazioni deve essere evidente e accompagnato da feedback di successo o errore.

## Decisions, constraints & rationale

- La sicurezza Supabase è la priorità del prossimo intervento: verificare RLS su ogni tabella con dati personali e testare concretamente che un utente non possa leggere o modificare dati di un altro account.
- `app_state` risulta attualmente accessibile anche anonimamente ma non viene usata dall’app secondo il controllo effettuato; la chiusura di questo accesso dovrebbe essere valutata senza rompere flussi esistenti.
- `app_data` è usata dagli utenti autenticati e va protetta mantenendo il normale flusso applicativo.
- Il ruolo `admin` deve essere modificabile solo tramite meccanismi server/database autorizzati; un utente non deve poterlo assegnare o alterare dal proprio profilo.
- Il pulsante “Copia Segnalazioni per Bolt” è previsto esclusivamente nella sezione admin, dentro “Gestione bug”; non deve essere mostrato agli utenti normali.
- L’accesso ai ticket deve essere protetto sia dalla UI sia dalle policy database/RLS: un utente comune non deve poter leggere i ticket altrui tramite chiamate dirette.
- Il testo copiato dalle segnalazioni non deve includere nomi né date e deve essere pronto per l’uso in Bolt.
- Il sistema ticket e i relativi permessi restano attivi; la rimozione riguarda il comando di copia dalle viste non admin, non la bacheca ticket.
- La chiave Gemini non deve essere esposta nel frontend: l’architettura prevista è una chiave server-side protetta con rate limiting, ma la scelta finale non è ancora confermata.
- I rate limit devono essere applicati lato backend/Edge Function e gli accessi anomali devono essere registrati in log riservati agli amministratori.
- La cancellazione account deve essere definitiva e includere l’eliminazione a cascata dei record associati; servono verifica pratica dei vincoli e informativa chiara sui dati sanitari.
- Il pulsante admin è stato ripristinato; helper di formattazione/copia e lettura ticket risultano collegati, con controlli di tipi e build completati senza errori.

## Open questions & assumptions

- Confermare se Gemini userà una chiave del progetto gestita server-side con limiti di utilizzo oppure chiavi personali degli utenti.
- Verificare in un ambiente Supabase reale RLS, protezione del ruolo admin, rate limiting, audit logging e tentativi di escalation.
- Definire retention dei log di sicurezza, testo dell’informativa sanitaria e comportamento preciso della cancellazione a cascata.
- Confermare se tema retro e audio rientrano nello stesso intervento o in un lavoro estetico separato.