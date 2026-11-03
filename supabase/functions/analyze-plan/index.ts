import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gemini-2.5-flash";
const MAX_PLAN_CHARS = 60000;
const RATE_BUCKET = "analyze-plan";
const RATE_MAX_REQUESTS = 20;
const RATE_WINDOW_SECONDS = 3600;

const PROMPT = `Sei un assistente che legge piani alimentari e schede di allenamento scritti in italiano.
Il testo e stato incollato dall'utente (da PDF, Word, note o scritto a mano): puo essere disordinato, con righe spezzate, senza a capo o tutto attaccato in un unico blocco continuo.
NON affidarti agli a capo o alle righe vuote: individua la struttura SOLO tramite le parole chiave:
- marcatori di settimana ("Settimana 1", "Sett. 2", "Week 3", "Prima/Seconda settimana") aprono una nuova settimana;
- nomi dei giorni (Lunedi...Domenica, anche abbreviati Lun/Mar/..., oppure "Giorno 1") aprono un nuovo giorno nella settimana corrente;
- nomi dei pasti (Colazione, Spuntino, Pranzo, Merenda, Cena, Dopocena) aprono un nuovo pasto nel giorno corrente;
- tutto cio che segue un nome di pasto, fino alla parola chiave successiva, sono gli alimenti di quel pasto.
Leggi TUTTO il testo fino alla fine.
La struttura di output e SEMPRE rigorosamente Settimana -> Giorno -> Pasto -> Alimenti. Determina se e una DIETA o una SCHEDA DI ALLENAMENTO e rispondi SOLO con JSON valido in uno di questi formati.

Dieta:
{"kind":"diet","title":"nome dieta","durationWeeks":4,"weeks":[{"days":[{"day":0,"meals":[{"type":"Colazione","name":"titolo breve","foods":[{"name":"fiocchi di avena","grams":80},{"name":"latte parzialmente scremato","grams":200}]}]}]}]}

Scheda:
{"kind":"workout","title":"nome scheda","days":[{"day":0,"title":"Petto e tricipiti","exercises":[{"name":"Panca piana","sets":4,"reps":"8-10","weight":60,"notes":"recupero 90s"}]}]}

Regole dieta:
- "durationWeeks": per quante settimane va seguito il piano in totale (es. "per 4 settimane", "ciclo di 2 settimane", "mese" = 4). Se non indicato, usa il numero di settimane distinte presenti.
- "weeks": una voce SEPARATA per ogni settimana presente nel testo (massimo 8), nell'ordine del testo. Se il testo contiene "Settimana 2" (o successive), i suoi giorni vanno SOLO nella seconda voce di "weeks": non unire mai settimane diverse nella prima. Se il testo descrive una sola settimana da ripetere, scrivine una sola e indica la durata in "durationWeeks".
- "day": 0=Lunedi, 1=Martedi, 2=Mercoledi, 3=Giovedi, 4=Venerdi, 5=Sabato, 6=Domenica. Se la dieta non indica i giorni usa "day":"all" (stessi pasti ogni giorno). Se indica "Giorno 1, 2, 3...", Giorno 1 = Lunedi.
- "type" deve essere uno tra: Colazione, Spuntino, Pranzo, Merenda, Cena. Spuntino = meta mattina, Merenda = pomeriggio, spuntino serale/dopocena = Merenda.
- Ogni alimento e un oggetto separato: "name" e il nome generico e semplice dell'alimento in italiano, al singolare, senza marche ne quantita (es. "petto di pollo", "riso basmati", "olio extravergine di oliva", "mela").
- "grams": grammi (o ml) della porzione; converti cucchiai/cucchiaini/fette/pezzi in grammi realistici (cucchiaio olio = 10, cucchiaino = 5, fetta pane = 30, uovo = 60). Se non c'e quantita usa 0.
- Se un piatto composto ha ingredienti indicati, elenca ogni ingrediente come alimento separato; altrimenti usa il piatto come singolo alimento.
- Se ci sono alternative ("oppure"), usa solo la prima.
- Riporta OGNI alimento nel pasto corretto anche se non lo riconosci o il nome ti sembra strano: non saltarlo e non spostarlo. Se la quantita manca o non e leggibile usa 0.

Regole scheda:
- "day" come sopra. Se la scheda usa "Giorno A/B/C" o "Giorno 1/2/3", distribuiscili su Lunedi, Mercoledi, Venerdi (poi Martedi, Giovedi, Sabato).

Non inventare pasti, alimenti o esercizi assenti dal testo.

TESTO:
`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Metodo non consentito." }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessione non valida. Accedi di nuovo." }, 401);
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: allowed, error: limitError } = await admin.rpc("consume_rate_limit", {
      p_user: userId,
      p_bucket: RATE_BUCKET,
      p_max: RATE_MAX_REQUESTS,
      p_window_seconds: RATE_WINDOW_SECONDS,
    });
    if (limitError) throw limitError;
    if (allowed !== true) {
      await admin.from("security_audit_log").insert({
        user_id: userId,
        event: "rate_limit_exceeded",
        details: { bucket: RATE_BUCKET },
      });
      return json({ error: "Troppe richieste. Riprova tra un'ora." }, 429);
    }

    const body = await req.json().catch(() => null);
    const planText = typeof body?.planText === "string" ? body.planText.trim() : "";
    if (!planText) return json({ error: "Testo del piano mancante." }, 400);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return json({ error: "Il servizio IA non e configurato." }, 503);

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT + planText.slice(0, MAX_PLAN_CHARS) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      console.error("gemini request failed", geminiRes.status);
      if (geminiRes.status === 429) return json({ error: "Limite del servizio IA raggiunto. Riprova tra qualche minuto." }, 429);
      return json({ error: "Il servizio IA non ha potuto analizzare questo testo." }, 502);
    }

    const data = await geminiRes.json().catch(() => null);
    const candidate = data?.candidates?.[0];
    const parts: unknown[] = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((p) => (typeof (p as { text?: unknown })?.text === "string" ? (p as { text: string }).text : ""))
      .join("");

    return json({ text, finishReason: typeof candidate?.finishReason === "string" ? candidate.finishReason : null });
  } catch (err) {
    console.error("analyze-plan failed", err);
    return json({ error: "Errore interno del servizio." }, 500);
  }
});
