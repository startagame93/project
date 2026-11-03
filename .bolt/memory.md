# Project memory

## Product intent & audience

- Nutriplan è una PWA italiana per gestire diete multi-settimana, pasti, nutrizione avanzata, integratori, micronutrienti, metriche di salute e liste della spesa dinamiche.
- Il database alimentare è una componente centrale della ricerca e della composizione dei pasti: contiene circa 750 alimenti preesistenti e supporta valori nutrizionali per 100 g e raggruppamento per famiglia.
- Il catalogo deve coprire sia alimenti della dieta mediterranea sia piatti e preparazioni della cucina moderna e internazionale, inclusi sushi, burger, hot dog, kebab, tacos, patatine e nuggets.
- Gli utenti gestiscono dati personali e sanitari; l’isolamento tra account e la protezione dei dati restano fondamentali.
- Gli amministratori necessitano di strumenti sicuri per audit, gestione operativa e supervisione dei dati globali.

## Brand personality & voice

- Usare un italiano chiaro, diretto e comprensibile per privacy, dati sanitari, sicurezza, cancellazione account, stato offline ed errori.
- Le comunicazioni di sicurezza devono spiegare con trasparenza cosa viene protetto, cosa viene eliminato e quali azioni sono irreversibili.
- Le etichette degli alimenti, delle categorie e dei valori nutrizionali devono essere coerenti, leggibili e facilmente ricercabili.
- Quando i dati nutrizionali sono stimati o provengono da fonti differenti, la UI e la documentazione devono distinguerli chiaramente dai dati verificati.

## Visual design & UX direction

- Mantenere un’esperienza curata e adatta alla produzione, evitando dashboard generiche.
- La ricerca alimenti deve rendere facilmente distinguibili nome, famiglia/categoria e valori nutrizionali per 100 g.
- Le categorie devono avere icone coerenti nella vista database; la categoria Fast Food è stata aggiunta alla mappa delle icone.
- Il catalogo deve gestire bene molti risultati: ricerca rapida, filtri o raggruppamenti comprensibili e assenza di duplicati visibili.
- Il tema Retro/Arcade/Pixel Art è esclusivamente estetico e non deve alterare logica, dati o sicurezza.
- Le schermate privacy e cancellazione account devono essere facilmente raggiungibili e leggibili su mobile e desktop.
- La vista Corpo ospita una sezione unica “Progressi nel tempo”, con selettori per gruppo, metrica e periodo.
- Il grafico storico riutilizzabile deve gestire dati assenti, pochi punti e intervalli temporali diversi, soprattutto su mobile.

## Decisions, constraints & rationale

- Gli alimenti sono dati statici nel codice frontend; l’aggiunta del catalogo non richiede modifiche al database applicativo.
- Il formato esistente è una riga per alimento, con valori nutrizionali per 100 g e appartenenza a una famiglia/categoria.
- È stato introdotto un nuovo blocco di 94 alimenti, collegato al database esistente; include piatti mediterranei, sushi e cucina internazionale, fast food, fritti e dolci.
- Gli alimenti già presenti, tra cui Falafel, Hamburger Classico, Hot Dog, Burrata e Cannolo Siciliano, sono stati esclusi dal nuovo blocco per evitare doppioni.
- La categoria Fast Food è stata aggiunta alla mappa delle icone della vista database.
- Typecheck e build risultano completati senza errori dopo la correzione dell’esportazione della funzione `group`.
- La richiesta di circa 3000 nuovi alimenti non è ancora soddisfatta: aggiungere migliaia di valori nutrizionali a memoria aumenterebbe il rischio di dati inesatti.
- Per un catalogo esteso servono fonti nutrizionali affidabili, come tabelle CREA/INRAN o USDA, oppure valori stimati esplicitamente marcati come tali.
- La sicurezza Supabase resta prioritaria: verificare RLS sulle tabelle con dati personali, protezione del ruolo admin, accesso ai ticket, rate limiting e audit logging.
- La chiave Gemini non deve essere esposta nel frontend; l’eventuale integrazione dovrà usare un’architettura server-side protetta.
- La cancellazione account deve essere definitiva, con eliminazione a cascata dei record associati e informativa chiara sui dati sanitari.

## Open questions & assumptions

- Decidere se completare l’espansione verso 3000 alimenti per lotti oppure importare un dataset affidabile e compatibile con il formato attuale.
- Confermare la fonte autorizzata per i valori nutrizionali e le eventuali licenze o attribuzioni richieste.
- Stabilire come distinguere tecnicamente e visivamente valori verificati, medi e stimati.
- Verificare la presenza di duplicati semantici oltre ai nomi identici, ad esempio varianti regionali o preparazioni con nomi diversi.
- Definire ulteriori categorie necessarie per il catalogo moderno e mediterraneo e le relative icone.
- Verificare visivamente ricerca, raggruppamento e prestazioni con un catalogo molto più ampio.
- Verificare grafici Corpo con periodi senza dati, valori mancanti e dataset con un solo punto.
- Confermare unità di misura, fascia consigliata dei micronutrienti e definizione della variazione mostrata.
- Verificare in ambiente Supabase reale RLS, protezione del ruolo admin, rate limiting, audit logging e tentativi di escalation.
- Definire retention dei log di sicurezza, testo dell’informativa sanitaria e comportamento preciso della cancellazione a cascata.