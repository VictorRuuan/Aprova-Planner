import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  const message =
    "As variaveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY precisam estar no .env ou .env.local.";

  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,sans-serif;padding:24px">
      <section style="max-width:520px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:24px;box-shadow:0 8px 30px rgba(15,23,42,.08)">
        <h1 style="margin:0 0 12px;font-size:22px">Configuracao incompleta</h1>
        <p style="margin:0 0 12px;line-height:1.5;color:#475569">${message}</p>
        <pre style="white-space:pre-wrap;border-radius:12px;background:#f1f5f9;padding:12px;color:#334155">VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...</pre>
      </section>
    </main>
  `;

  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
