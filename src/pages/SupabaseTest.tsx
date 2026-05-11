import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function SupabaseTest() {
  const [status, setStatus] = useState("Testando conexão...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.from("exams").select("id").limit(1);

      if (error) {
        setStatus(`Erro na conexão: ${error.message}`);
        return;
      }

      setStatus("Conexão com Supabase funcionando!");
    }

    testConnection();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Teste do Supabase
        </h1>

        <p className="mt-3 text-slate-600 dark:text-slate-300">{status}</p>
      </div>
    </div>
  );
}
