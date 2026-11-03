# Project memory

## Product intent & audience

- Nutriplan è una PWA italiana per gestire diete multi-settimana, pasti, nutrizione avanzata, integratori, micronutrienti, metriche di salute e liste della spesa dinamiche.
- Il catalogo alimentare è centrale e deve coprire alimenti italiani e mediterranei, prodotti quotidiani, piatti internazionali e prodotti moderni o fast food.
- Obiettivo di crescita: circa 4.000 alimenti nel breve periodo, con direzione futura verso almeno 10.000, mantenendo qualità e affidabilità.
- Gli utenti gestiscono dati personali e sanitari: isolamento tra account, amministrazione sicura e protezione dei dati sono prioritari.
- L’accessibilità per persone non vedenti è importante, soprattutto per controlli icon-only e contenuti dinamici.

## Brand personality & voice

- Italiano chiaro, diretto e comprensibile nell’interfaccia, negli errori, nella privacy, nell’accessibilità e negli stati di sincronizzazione.
- Nomi degli alimenti naturali, coerenti e facilmente ricercabili; evitare traduzioni automatiche innaturali.
- Rendere riconoscibili provenienza e affidabilità dei valori nutrizionali, distinguendo dati verificati, medi o stimati.
- Le stime IA sono indicative e devono invitare esplicitamente alla verifica sull’etichetta.
- Il tono visivo è energico, moderno e curato, senza perdere chiarezza, affidabilità o senso di controllo.

## Visual design & UX direction

- Direzione visiva attuale: tema **Fresh Organic & Neon**, originale e d’impatto, con sfondi puliti ma profondi, verde neon come accento principale e arancione caldo come secondario.
- Superfici con effetto glassmorphism, trasparenze controllate, bordi morbidi e sfumature verde menta/arancio; in modalità scura il fondo tende al verde profondo.
- Card alimenti, catalogo e barra inferiore condividono il linguaggio “vetro”; evitare superfici piatte e l’aspetto di una dashboard clinica generica.
- Le 19 macro-categorie e i sottomenu devono essere piacevoli da esplorare: icone/sticker riconoscibili, riquadri morbidi, stato aperto evidente e animazioni fluide al tap.
- Le animazioni devono comunicare apertura, selezione e pressione senza rallentare l’uso; rispettare `prefers-reduced-motion`.
- Il contrasto resta prioritario: il verde usato sui pulsanti è stato corretto per mantenere leggibile il testo bianco.
- La palette Fresh Organic & Neon è predefinita per i nuovi utenti; le palette esistenti, inclusa Smeraldo, restano selezionabili dalle Impostazioni.
- Il totale degli alimenti deve restare visibile anche nella vista ad albero; la ricerca deve mantenere il conteggio dei risultati.
- La ricerca distingue chiaramente nome, famiglia/categoria e valori nutrizionali per 100 g, anche con migliaia di risultati.
- Il picker per categoria consente di espandere la tabella nutrizionale per 100 g prima dell’aggiunta; la tabella è condivisa con il database alimenti.
- Preferire feedback esplicito per aggiunta, espansione, copia, errore, alimento assente e sincronizzazione. I controlli icon-only devono avere nomi accessibili e stati annunciabili.
- Scanner, risultati Gemini e dati stimati devono distinguersi chiaramente dai dati verificati e richiedere conferma o revisione prima del salvataggio.
- Catalogo, privacy, segnalazioni, amministrazione, sincronizzazione e manuale devono funzionare su mobile e desktop.
- Nel manuale, le novità hanno un tag “New/Nuovo” che scompare dopo l’espansione della sezione e resta nascosto dopo il reload per la versione consultata.

## Decisions, constraints & rationale

- Stack applicativo: Vite + React; i dati statici degli alimenti sono nel frontend, una riga per alimento con valori per 100 g e famiglia/categoria.
- Il catalogo è passato da circa 1.102 a circa 1.196 alimenti; il target di 4.000 non è ancora raggiunto.
- Le icone delle categorie esistono; quelle delle famiglie derivano da parole chiave con fallback coerente, ma la copertura va verificata.
- La palette Fresh Organic & Neon è stata aggiunta/impostata come predefinita. Il restyling è stato applicato a tema, sfondi, card, barra inferiore, catalogo, categorie e sottomenu.
- Typecheck e build passano; resta un warning non bloccante sulla dimensione del bundle. L’aspetto non è stato ancora verificato nel browser.
- Barcode: validazione cifra di controllo EAN/UPC, due letture consecutive coerenti e conferma esplicita prima della ricerca.
- Fallback barcode: catalogo locale, Open Food Facts e Gemini server-side per macronutrienti sintetici per 100 g; in assenza del servizio è disponibile l’inserimento manuale.
- Supabase gestisce persistenza server-side, account e segnalazioni; queste restano isolate per utente e aggregate per l’amministrazione.
- La persistenza applicativa è offline-first tramite IndexedDB, con import automatico dei dati della vecchia memoria browser.
- Il sync usa salvataggio condizionale sulla versione letta; in caso di concorrenza il client rilegge, unisce e riprova.
- Il merge usa gli identificativi di pasti, giorni e settimane; conserva aggiunte offline da dispositivi diversi, evita duplicati e assegna prevalenza all’ultima sincronizzazione in caso di modifica concorrente dello stesso pasto.
- Logout, reset locale e recupero da crash devono preservare i dati non ancora inviati per il successivo accesso dello stesso account.
- Il comportamento del tag “Nuovo” è implementato; il suo stato è persistito per versione delle novità e account/dispositivo.
- Il merge è stato verificato con sei prove isolate, incluse aggiunte offline, duplicati, cancellazioni e modifiche concorrenti.

## Open questions & assumptions

- Verificare visivamente il nuovo tema in browser su chiaro, scuro e AMOLED, soprattutto contrasto, trasparenze, sfondi e leggibilità delle card.
- Testare su telefono reale tap, animazioni, scrolling, prestazioni e comportamento con movimento ridotto; controllare che il glassmorphism non comprometta contrasto o consumi.
- Verificare icone delle famiglie, tutte le 19 categorie, tabella nutrizionale mobile, grafici Corpo, unità dei micronutrienti e stati senza dati.
- Testare il tag del manuale dopo apertura, reload, cambio versione e accesso da più dispositivi.
- Testare sync reale con due dispositivi, offline prolungato, riconnessione simultanea, crash e retry falliti.
- Definire conflitti fini: cancellazione contro modifica, modifica di campi diversi dello stesso pasto, ordine delle operazioni, logout e cambio account su dispositivo condiviso.
- Valutare retention, cifratura, cancellazione dei dati locali non sincronizzati, migrazioni IndexedDB e compatibilità tra vecchi client e nuove strutture server.
- Configurare e verificare Gemini: contratto JSON, unità, valori mancanti, confidenza, fonte, timeout, rate limiting e indisponibilità del servizio.
- Completare audit tastiera e lettore di schermo per focus, pannelli dinamici, controlli icon-only e messaggi live.
- Definire fonti, licenze, normalizzazione, deduplicazione semantica e controlli nutrizionali per portare il catalogo a 4.000 e poi circa 10.000 alimenti.
- Verificare in ambiente reale RLS, ruoli admin, accesso alle segnalazioni, audit logging, retention e cancellazione associata all’account.