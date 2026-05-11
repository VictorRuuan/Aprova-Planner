import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  createScheduleItem,
  fetchScheduleItems,
  fetchSubjects,
  formatDateTime,
  getErrorMessage,
  getSubjectName,
  isMissingScheduleItemsTable,
  type ScheduleItemRecord,
  type SubjectRecord,
} from "../services/plannerData";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function Schedule() {
  const [items, setItems] = useState<ScheduleItemRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [form, setForm] = useState({
    subjectId: "",
    title: "",
    scheduledAt: "",
    studyType: "Teoria",
  });

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setNeedsSetup(false);
        const [scheduleItems, subjectRows] = await Promise.all([
          fetchScheduleItems(),
          fetchSubjects(),
        ]);

        setItems(scheduleItems);
        setSubjects(subjectRows);
      } catch (err) {
        if (isMissingScheduleItemsTable(err)) {
          setNeedsSetup(true);
          setError("");
          return;
        }

        setError(getErrorMessage(err, "Erro ao carregar dados."));
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [String(subject.id), subject])),
    [subjects],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const createdItem = await createScheduleItem(form);
      setItems((current) => [createdItem, ...current]);
      setForm({
        subjectId: "",
        title: "",
        scheduledAt: "",
        studyType: "Teoria",
      });
      setShowForm(false);
    } catch (err) {
      if (isMissingScheduleItemsTable(err)) {
        setNeedsSetup(true);
        setError("");
        return;
      }

      setError(getErrorMessage(err, "Erro ao salvar cronograma."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout
      title="Cronograma"
      description="Veja seu plano semanal de estudos."
    >
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Cronograma semanal
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Adicione estudos programados e salve no banco.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            disabled={needsSetup}
          >
            {showForm ? "Cancelar" : "Novo estudo"}
          </Button>
        </div>

        {needsSetup && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            A tabela schedule_items ainda nao existe no Supabase. Execute o SQL
            em database/schedule_items.sql no SQL Editor do Supabase e depois
            recarregue esta pagina.
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-4"
          >
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Materia
              <select
                value={form.subjectId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subjectId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Sem materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {getSubjectName(subject)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Titulo
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Ex.: Revisao de edital"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Data e hora
              <input
                value={form.scheduledAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledAt: event.target.value,
                  }))
                }
                type="datetime-local"
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo
              <select
                value={form.studyType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    studyType: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option>Teoria</option>
                <option>Questoes</option>
                <option>Revisao</option>
                <option>Simulado</option>
              </select>
            </label>

            <div className="md:col-span-4">
              <Button disabled={saving}>
                {saving ? "Salvando..." : "Salvar estudo"}
              </Button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Carregando cronograma...
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhum item de cronograma cadastrado no banco de dados.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const subject = item.subject_id
              ? subjectById.get(String(item.subject_id))
              : undefined;

            return (
              <div key={item.id} className="py-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {item.subject_name || item.title || getSubjectName(subject)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDateTime(item.scheduled_at || item.date)} -{" "}
                  {item.study_type || item.type || "Estudo"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </AppLayout>
  );
}
