import { useEffect, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  createExam,
  fetchExams,
  formatDate,
  getExamName,
  getErrorMessage,
  type ExamRecord,
} from "../services/plannerData";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function Exams() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    organization: "",
    examDate: "",
  });

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        setExams(await fetchExams());
      } catch (err) {
        setError(getErrorMessage(err, "Erro ao carregar dados."));
      } finally {
        setLoading(false);
      }
    }

    loadExams();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const createdExam = await createExam(form);
      setExams((current) => [createdExam, ...current]);
      setForm({ name: "", organization: "", examDate: "" });
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar concurso."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout
      title="Concursos"
      description="Cadastre e gerencie os concursos que voce esta estudando."
    >
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Concursos cadastrados
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dados carregados da tabela exams.
            </p>
          </div>

          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Cancelar" : "Novo concurso"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-3"
          >
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Banca
              <input
                value={form.organization}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organization: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Data da prova
              <input
                value={form.examDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    examDate: event.target.value,
                  }))
                }
                type="date"
                className={inputClass}
              />
            </label>

            <div className="md:col-span-3">
              <Button disabled={saving}>
                {saving ? "Salvando..." : "Salvar concurso"}
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
            Carregando concursos...
          </p>
        )}

        {!loading && exams.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhum concurso cadastrado no banco de dados.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {exams.map((exam) => (
            <div key={exam.id} className="py-3">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {getExamName(exam)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {exam.board ||
                  exam.organization ||
                  exam.institution ||
                  "Banca nao informada"}{" "}
                - {formatDate(exam.exam_date || exam.date)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
