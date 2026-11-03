# Project memory

## Product intent & audience

- Nutriplan è una PWA italiana per gestire diete multi-settimana, pasti, nutrizione avanzata, integratori, micronutrienti, metriche di salute e liste della spesa dinamiche.
- Il catalogo alimentare è centrale e deve coprire alimenti italiani e mediterranei, prodotti quotidiani, piatti internazionali e prodotti moderni o da fast food.
- Obiettivo di crescita: circa 4.000 alimenti nel breve periodo, con direzione futura verso almeno 10.000, senza sacrificare qualità e affidabilità.
- Gli utenti gestiscono dati personali e sanitari: amministrazione, isolamento tra account e protezione dei dati sono prioritari.
- L’accessibilità per persone non vedenti è importante, soprattutto per controlli icon-only e contenuti dinamici.

## Brand personality & voice

- Usare italiano chiaro, diretto e comprensibile in interfaccia, errori, privacy, accessibilità e stato delle segnalazioni.
- I nomi degli alimenti devono essere naturali, coerenti e facilmente ricercabili; evitare traduzioni automatiche innaturali.
- Rendere riconoscibili provenienza e affidabilità dei valori nutrizionali, distinguendo dati verificati, medi o stimati quando necessario.
- Le descrizioni accessibili devono spiegare con precisione azione e oggetto del controllo.
- I messaggi amministrativi sulle segnalazioni devono chiarire aggregazione e frequenza dei dati quando disponibili.

## Visual design & UX direction

- L’esperienza deve essere curata e adatta alla produzione, non una dashboard generica; l’estetica Retro/Arcade/Pixel Art non deve compromettere leggibilità o accessibilità.
- Nel catalogo il totale degli alimenti deve essere sempre visibile anche nella vista ad albero, non soltanto dopo una ricerca.
- Categorie e sottomenu/famiglie devono avere icone o sticker identificativi per facilitare la scansione visiva. Le icone delle famiglie possono derivare da parole chiave, con fallback coerente alla categoria.
- La ricerca deve distinguere chiaramente nome, famiglia/categoria e valori nutrizionali per 100 g, funzionando con migliaia di risultati.
- In “Scegli per categoria”, la selezione di un alimento deve permettere di espandere una tabella nutrizionale per 100 g prima di aggiungerlo alla dieta; il controllo deve comunicare lo stato espanso/chiuso.
- Riutilizzare una tabella nutrizionale condivisa tra database alimenti e picker per mantenere contenuti e presentazione coerenti.
- Preferire feedback esplicito per aggiunta, espansione, copia, errore e alimento non trovato. I controlli icon-only devono avere nome accessibile e stati dinamici annunciabili.
- Le interfacce di catalogo, privacy, segnalazioni e amministrazione devono restare leggibili e utilizzabili su mobile e desktop.
- Lo scanner deve mostrare il codice riconosciuto e lasciare all’utente il controllo esplicito dell’avvio della ricerca; prevedere un’azione chiara per ripetere la scansione quando la lettura è dubbia.

## Decisions, constraints & rationale

- Gli alimenti sono dati statici nel frontend; il formato attuale contiene una riga per alimento con valori per 100 g e famiglia/categoria.
- Il catalogo è passato da circa 1.102 a circa 1.196 alimenti; il target intermedio di 4.000 non è ancora raggiunto.
- La vista albero ora espone il conteggio totale calcolato sull’intero catalogo; la vista ricerca mantiene il conteggio dei risultati.
- Le icone delle categorie esistono già; quelle delle famiglie sono state aggiunte con riconoscimento per parola chiave e fallback, quindi la copertura visiva va ancora verificata.
- La tabella per 100 g è stata estratta in un componente condiviso e collegata sia alla scheda database sia al picker per categoria, evitando duplicazioni.
- Lo scanner barcode attuale applica validazione della cifra di controllo per codici EAN/UPC e richiede due letture consecutive coerenti prima di accettare il risultato. La ricerca non parte automaticamente: l’utente deve confermarla.
- Typecheck e build risultavano validi dopo le modifiche allo scanner. La lettura reale da fotocamera non è stata verificata e richiede test su dispositivo.
- L’integrazione specifica per PWA iOS standalone tramite input nativo `capture` non è ancora stata completata; la compatibilità Safari/WebKit e l’eventuale decodifica dell’immagine restano da valutare.
- Il fallback Gemini non è ancora implementato. Dovrà restare server-side, usare la chiave fuori dal frontend e restituire soltanto dati nutrizionali sintetici per 100 g quando il database non contiene informazioni sufficienti.
- Non esiste ancora una sincronizzazione offline-first completa con IndexedDB. La futura soluzione dovrà prevedere identificatori stabili, coda di sincronizzazione, deduplicazione dei pasti e risoluzione esplicita dei conflitti senza perdita o azzeramento dei conteggi.
- USDA SR Legacy è stato valutato come fonte ampia, ma prevalentemente inglese; le traduzioni automatiche non sono sufficientemente affidabili senza revisione.
- CREA/INRAN resta una possibile fonte italiana, da usare solo con modalità d’importazione, licenze e qualità verificabili.
- Le segnalazioni di alimenti non trovati sono condivise tramite Supabase: ogni utente vede le proprie, mentre l’admin può leggere dati aggregati e copiarne l’elenco.
- Dopo modifiche al catalogo o al codice vanno verificati typecheck, build, comportamento responsive e accessibilità reale.

## Open questions & assumptions

- Verificare visivamente che ogni famiglia/sottomenu abbia un’icona pertinente e che i fallback non risultino ambigui o ripetitivi.
- Testare lo scanner con fotocamera reale, immagini mosse/sfocate, codici validi e stringhe anomale; chiarire il comportamento per formati diversi da EAN/UPC.
- Definire il percorso iOS standalone: input `capture`, modalità di selezione immagine e libreria/strategia di decodifica compatibile con Safari.
- Definire il contratto JSON minimo del fallback Gemini, i campi obbligatori, soglie di affidabilità, gestione degli errori e tracciamento della fonte.
- Progettare il modello offline IndexedDB: versionamento, record locali/server, ordinamento delle operazioni, retry, conflitti tra dispositivi e riconciliazione dei conteggi.
- Decidere se mostrare il totale anche in altri punti dell’app oltre alla vista ad albero e alla ricerca, mantenendo conteggi coerenti.
- Completare l’audit con tastiera e lettore di schermo: focus, `aria-expanded`, pannelli dinamici, controlli icon-only e messaggi live.
- Verificare il comportamento della tabella nutrizionale su mobile, inclusi valori mancanti, unità e contenuto esteso.
- Definire fonte primaria/combinazione di fonti per arrivare a 4.000 e poi circa 10.000 alimenti, con licenze, attribuzioni e revisione italiana.
- Definire pipeline di normalizzazione, deduplicazione semantica, controllo nutrizionale e tracciamento di fonte, versione e affidabilità.
- Verificare in ambiente reale RLS, ruoli admin, accesso alle segnalazioni, rate limiting, audit logging, retention e cancellazione associata all’account.
- Valutare esportazione admin CSV/JSON e filtri per frequenza, data o lingua.
- Verificare grafici Corpo, unità dei micronutrienti, periodi senza dati e valori mancanti.