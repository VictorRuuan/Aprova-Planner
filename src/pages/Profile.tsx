import { useEffect, useState } from "react";
import { Mail, Target, User } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { inputClass, labelClass } from "../components/ui/Form";
import { Toast, type ToastState } from "../components/ui/Toast";
import { supabase } from "../services/supabase";

type GoalSettings = {
  dailyMinutes: string;
  dailyQuestions: string;
  weeklyReviews: string;
};

const defaultGoals: GoalSettings = {
  dailyMinutes: "120",
  dailyQuestions: "50",
  weeklyReviews: "3",
};

export function Profile() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [goals, setGoals] = useState<GoalSettings>(() => {
    const savedGoals = localStorage.getItem("aprova-planner-goals");
    return savedGoals ? JSON.parse(savedGoals) : defaultGoals;
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? "");
      setName(String(user?.user_metadata?.full_name ?? ""));
    }

    loadUser();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem("aprova-planner-goals", JSON.stringify(goals));
    setToast({ type: "success", message: "Metas atualizadas." });
  }

  return (
    <AppLayout
      title="Perfil"
      description="Ajuste suas metas e confira os dados da sua conta."
    >
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <User size={22} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {name || "Estudante"}
              </p>
              <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <Mail size={14} />
                {email || "E-mail nao encontrado"}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Metas de estudo">
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
            <label className={labelClass}>
              Minutos por dia
              <input
                value={goals.dailyMinutes}
                onChange={(event) =>
                  setGoals((current) => ({
                    ...current,
                    dailyMinutes: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Questoes por dia
              <input
                value={goals.dailyQuestions}
                onChange={(event) =>
                  setGoals((current) => ({
                    ...current,
                    dailyQuestions: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Revisoes por semana
              <input
                value={goals.weeklyReviews}
                onChange={(event) =>
                  setGoals((current) => ({
                    ...current,
                    weeklyReviews: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <div className="md:col-span-3">
              <Button>
                <Target size={16} className="mr-2 inline-block" />
                Salvar metas
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
