# Project memory

## Product intent & audience

- Nutriplan è una PWA italiana per gestire diete multi-settimana, pasti, nutrizione avanzata, integratori, micronutrienti, metriche di salute e liste della spesa dinamiche.
- Il catalogo alimentare è centrale: deve servire soprattutto utenti italiani e coprire cucina mediterranea, alimenti di uso quotidiano, piatti internazionali e prodotti moderni o da catene fast food.
- Obiettivo di crescita: circa 4.000 alimenti nel breve periodo, con direzione futura verso almeno 10.000.
- L’accessibilità per persone non vedenti è un requisito importante, in particolare per controlli icon-only e compatibilità con lettori di schermo.
- Gli alimenti non trovati devono poter essere raccolti da tutti gli account e forniti in forma aggregata per successive integrazioni del catalogo.
- Gli utenti gestiscono dati personali e sanitari; amministrazione, isolamento tra account e protezione dei dati restano prioritari.

## Brand personality & voice

- Usare italiano chiaro, diretto e comprensibile nelle interfacce, inclusi messaggi di accessibilità, errori, privacy e stato delle segnalazioni.
- I nomi degli alimenti devono essere naturali, coerenti e facilmente ricercabili; evitare traduzioni automatiche innaturali o ambigue.
- Rendere esplicita la provenienza e l’affidabilità dei valori nutrizionali, distinguendo dati verificati, medi e stimati quando necessario.
- Le descrizioni accessibili devono identificare con precisione l’azione e l’oggetto del controllo, non limitarsi a indicare genericamente “pulsante”.
- I messaggi admin sulle segnalazioni devono chiarire che i dati sono aggregati e indicare conteggi o frequenza quando disponibili.

## Visual design & UX direction

- Mantenere un’esperienza curata e adatta alla produzione, evitando dashboard generiche.
- La ricerca alimenti deve distinguere chiaramente nome, famiglia/categoria e valori nutrizionali per 100 g, funzionando bene anche con migliaia di risultati.
- Preferire ricerca rapida, filtri o raggruppamenti comprensibili, prevenzione dei duplicati visibili e feedback chiaro quando un alimento non viene trovato.
- I controlli con sola icona devono avere nome accessibile tramite `aria-label` o testo equivalente; verificare anche chiusura, eliminazione, navigazione temporale, selezioni, gestione serie, acqua e aggiunta/rimozione alimenti.
- La sezione admin per gli alimenti non trovati deve consentire di copiare facilmente un elenco aggregato, con uno stato di feedback dopo la copia.
- Le schermate privacy, cancellazione account e gestione segnalazioni devono restare leggibili e utilizzabili su mobile e desktop.
- Il tema Retro/Arcade/Pixel Art è esclusivamente estetico e non deve compromettere leggibilità, accessibilità, logica o sicurezza.

## Decisions, constraints & rationale

- Gli alimenti sono dati statici nel frontend; il formato attuale è una riga per alimento con valori nutrizionali per 100 g e famiglia/categoria.
- Il catalogo è passato da circa 1.102 a circa 1.196 alimenti; il target intermedio di 4.000 non è ancora raggiunto.
- È stato valutato USDA SR Legacy: dataset ampio, con circa 7.800 voci e valori per 100 g, ma prevalentemente in inglese. La traduzione automatica ha prodotto solo un insieme limitato di voci utilizzabili e risultati linguistically scadenti; non usarla senza revisione.
- CREA/INRAN è una possibile fonte italiana importante, ma non è stata individuata una modalità affidabile di importazione massiva. L’espansione deve basarsi su fonti autorevoli, licenze compatibili e revisione dei nomi.
- Non aggiungere migliaia di alimenti a memoria: la qualità e l’origine dei valori nutrizionali sono più importanti del raggiungimento artificiale del conteggio.
- Le segnalazioni di alimenti non trovati sono state spostate dal solo browser a una tabella Supabase condivisa, con accesso dell’utente alle proprie segnalazioni e lettura aggregata riservata all’admin.
- Il pannello admin include una funzione per copiare l’elenco aggregato degli alimenti non trovati, inclusa la frequenza di segnalazione quando prevista.
- Sono stati aggiunti nomi accessibili ai principali pulsanti icon-only individuati; typecheck e build risultavano validi dopo le modifiche. L’audit completo con lettore di schermo non è ancora stato eseguito.
- Dopo modifiche al codice o al catalogo è necessario riavviare/recaricare l’app per rendere visibili le nuove funzioni e i nuovi dati.
- La chiave Gemini non deve essere esposta nel frontend; eventuali arricchimenti o traduzioni automatiche richiedono un servizio server-side protetto.
- La sicurezza Supabase resta prioritaria: verificare RLS, ruolo admin, accesso alle segnalazioni, rate limiting e audit logging.

## Open questions & assumptions

- Scegliere una fonte primaria o una combinazione di fonti per arrivare prima a 4.000 e poi a circa 10.000 alimenti, verificando licenze, attribuzioni e struttura dei dati.
- Definire una pipeline di importazione con normalizzazione, traduzione/revisione italiana, deduplicazione semantica e controllo qualità nutrizionale.
- Stabilire se e come conservare fonte, versione, affidabilità e stato di revisione per ogni alimento.
- Verificare in ambiente reale RLS e autorizzazioni della tabella degli alimenti non trovati, inclusi tentativi di accesso tra utenti e ruoli admin.
- Definire retention, anonimizzazione e gestione della cancellazione delle segnalazioni associate a un account.
- Decidere se l’admin debba poter esportare anche CSV/JSON oltre alla copia testuale e se servano filtri per frequenza, data o lingua.
- Completare l’audit accessibilità su tutte le schermate con tastiera, lettore di schermo, focus visibile, ordine del focus, stati dinamici e messaggi live.
- Verificare ricerca, prestazioni, raggruppamento e assenza di duplicati con un catalogo molto più ampio.
- Stabilire categorie e priorità per i nuovi lotti, dando precedenza agli alimenti italiani e ai prodotti internazionali più comuni invece di una copertura uniforme di cucine poco frequenti.
- Verificare grafici Corpo, unità dei micronutrienti, periodi senza dati e valori mancanti come già previsto.