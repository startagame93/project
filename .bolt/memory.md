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
- Le stime generate dall’IA devono essere presentate come indicative, con invito esplicito a verificarle sull’etichetta.

## Visual design & UX direction

- L’esperienza deve essere curata e adatta alla produzione, non una dashboard generica; l’estetica Retro/Arcade/Pixel Art non deve compromettere leggibilità o accessibilità.
- Nel catalogo il totale degli alimenti deve essere sempre visibile anche nella vista ad albero, non soltanto dopo una ricerca.
- Categorie e sottomenu/famiglie devono avere icone o sticker identificativi per facilitare la scansione visiva. Le icone delle famiglie possono derivare da parole chiave, con fallback coerente alla categoria.
- La ricerca deve distinguere chiaramente nome, famiglia/categoria e valori nutrizionali per 100 g, funzionando con migliaia di risultati.
- In “Scegli per categoria”, la selezione di un alimento deve permettere di espandere una tabella nutrizionale per 100 g prima di aggiungerlo alla dieta; il controllo deve comunicare lo stato espanso/chiuso.
- Riutilizzare una tabella nutrizionale condivisa tra database alimenti e picker per mantenere contenuti e presentazione coerenti.
- Preferire feedback esplicito per aggiunta, espansione, copia, errore, alimento non trovato e stato della sincronizzazione. I controlli icon-only devono avere nome accessibile e stati dinamici annunciabili.
- Le interfacce di catalogo, privacy, segnalazioni, amministrazione e sincronizzazione devono restare leggibili e utilizzabili su mobile e desktop.
- Lo scanner deve mostrare il codice riconosciuto e lasciare all’utente il controllo esplicito dell’avvio della ricerca; prevedere un’azione chiara per ripetere la scansione quando la lettura è dubbia.
- I risultati Gemini devono essere distinguibili dai dati verificati e richiedere conferma o revisione manuale prima del salvataggio.
- Nel manuale d’uso, le funzioni introdotte di recente sono marcate con un tag “New/Nuovo”; il tag scompare quando l’utente espande la relativa sezione, evitando di riproporre una novità già consultata.

## Decisions, constraints & rationale

- Gli alimenti sono dati statici nel frontend; il formato attuale contiene una riga per alimento con valori per 100 g e famiglia/categoria.
- Il catalogo è passato da circa 1.102 a circa 1.196 alimenti; il target intermedio di 4.000 non è ancora raggiunto.
- La vista albero espone il conteggio totale calcolato sull’intero catalogo; la vista ricerca mantiene il conteggio dei risultati.
- Le icone delle categorie esistono già; quelle delle famiglie usano riconoscimento per parola chiave e fallback, quindi la copertura visiva va ancora verificata.
- La tabella per 100 g è condivisa tra scheda database e picker per categoria.
- Lo scanner barcode applica validazione della cifra di controllo per codici EAN/UPC e richiede due letture consecutive coerenti prima di accettare il risultato. La ricerca richiede conferma dell’utente.
- Quando il codice non è disponibile nel catalogo locale, il flusso prova Open Food Facts e usa Gemini come ulteriore fallback per ottenere macronutrienti sintetici per 100 g.
- Gemini viene chiamato tramite servizio server-side; il risultato è mostrato con avviso di verifica prima del salvataggio. In assenza del servizio è disponibile l’inserimento manuale.
- Il catalogo e i dati applicativi usano Supabase per la persistenza server-side; le segnalazioni restano isolate per utente e aggregate per l’amministrazione.
- La persistenza applicativa è offline-first tramite IndexedDB. I dati restano sul dispositivo e vengono sincronizzati alla riconnessione, senza dipendere da una singola copia locale sovrascritta.
- I dati preesistenti nella vecchia memoria del browser vengono importati automaticamente al primo avvio del nuovo strato IndexedDB.
- Il sync usa salvataggio condizionale sulla versione letta: se un altro dispositivo ha scritto, il client rilegge, unisce e riprova invece di sovrascrivere.
- Il merge avviene per identificativo di pasti, giorni e settimane; le aggiunte offline di dispositivi diversi vengono conservate e i duplicati evitati. Se lo stesso pasto è modificato offline in conflitto, prevale la versione del dispositivo che sta sincronizzando.
- Il logout lascia sul dispositivo i dati non ancora inviati, destinati alla sincronizzazione al successivo accesso dello stesso account. Reset locale e recupero da crash devono preservare i dati ancora non sincronizzati.
- Le sezioni già aperte del manuale vengono registrate nello stato applicativo con riferimento alla versione corrente delle novità; il tag resta nascosto dopo il reload e sugli altri dispositivi dell’account.
- Il comportamento del tag è implementato; typecheck e build passano. Rimane un warning relativo alla dimensione del bundle, non bloccante.
- Il merge è stato verificato con sei prove isolate, inclusi aggiunte offline, duplicati, cancellazioni e modifiche concorrenti. Typecheck e build sono passati.

## Open questions & assumptions

- Verificare nell’app in esecuzione che il tag del manuale sparisca all’espansione, resti nascosto dopo un reload e si comporti correttamente per versioni successive delle novità.
- Testare il sync reale con due dispositivi/account sessioni, offline prolungato, riconnessione simultanea, crash e retry falliti.
- Definire e verificare la gestione di conflitti più fini: cancellazione contro modifica, modifica di campi diversi dello stesso pasto e ordine delle operazioni.
- Confermare il comportamento di logout, cambio account e dispositivo condiviso per evitare che dati locali vengano associati all’account errato.
- Valutare retention, cifratura e possibilità di eliminare esplicitamente i dati locali non sincronizzati.
- Verificare versionamento IndexedDB, migrazioni future e compatibilità tra vecchi client e nuove strutture server.
- Configurare la chiave Gemini in ambiente server-side e verificare timeout, errori, rate limiting e servizio non disponibile.
- Definire il contratto JSON minimo del fallback Gemini, includendo unità, valori mancanti, identificazione, confidenza e fonte.
- Verificare visivamente icone delle famiglie, tabella nutrizionale mobile, grafici Corpo, unità dei micronutrienti e stati senza dati.
- Completare audit con tastiera e lettore di schermo per focus, pannelli dinamici, controlli icon-only e messaggi live.
- Definire fonti, licenze e pipeline di normalizzazione, deduplicazione semantica e controllo nutrizionale per arrivare a 4.000 e poi circa 10.000 alimenti.
- Verificare in ambiente reale RLS, ruoli admin, accesso alle segnalazioni, rate limiting, audit logging, retention e cancellazione associata all’account.
- Non sono ancora disponibili test su telefono reale, modalità aereo o due dispositivi c…