import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gemini-2.5-flash";
const RATE_BUCKET = "estimate-barcode-nutrition";
const RATE_MAX_REQUESTS = 30;
const RATE_WINDOW_SECONDS = 3600;

const PROMPT = `Sei un assistente nutrizionale. Ti viene fornito SOLO un codice a barre (EAN/UPC) di un prodotto alimentare venduto in Italia o in Europa.
Se riconosci con sicurezza il prodotto associato a questo codice, indica i valori nutrizionali medi per 100 g.
Se NON sei certo di quale prodotto si tratti, NON inventare: rispondi con found false e tutti i valori a 0.
Rispondi SOLO con JSON valido nel formato:
{"found":true,"name":"nome prodotto in italiano","calories":0,"protein":0,"carbs":0,"fat":0,"saturatedFat":0,"sugar":0,"fiber":0,"sodium":0}
Unita: calorie in kcal, macronutrienti in grammi, sodio in milligrammi, tutti per 100 g.

CODICE A BARRE:
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
    const barcode = typeof body?.barcode === "string" ? body.barcode : "";
    if (!/^(\d{8}|\d{12,14})$/.test(barcode)) return json({ error: "Codice a barre non valido." }, 400);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return json({ error: "Il servizio IA non e configurato." }, 503);

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: PROMPT + barcode }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      console.error("gemini barcode request failed", geminiRes.status);
      if (geminiRes.status === 429) return json({ error: "Limite del servizio IA raggiunto. Riprova tra qualche minuto." }, 429);
      return json({ error: "Il servizio IA non ha potuto stimare questo prodotto." }, 502);
    }

    const data = await geminiRes.json().catch(() => null);
    const candidate = data?.candidates?.[0];
    const parts: unknown[] = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((p) => (typeof (p as { text?: unknown })?.text === "string" ? (p as { text: string }).text : ""))
      .join("");

    return json({ text });
  } catch (err) {
    console.error("estimate-barcode-nutrition failed", err);
    return json({ error: "Errore interno del servizio." }, 500);
  }
});
