import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  createSubject,
  deleteSubject,
  fetchExams,
  fetchSubjects,
  getErrorMessage,
  getExamName,
  getSubjectName,
  type ExamRecord,
  type SubjectRecord,
} from "../services/plannerData";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function Subjects() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    examId: "",
    weight: "",
    difficulty: "",
    priority: "",
  });

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true);
        const [subjectRows, examRows] = await Promise.all([
          fetchSubjects(),
          fetchExams(),
        ]);
        setSubjects(subjectRows);
        setExams(examRows);
      } catch (err) {
        setError(getErrorMessage(err, "Erro ao carregar dados."));
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const createdSubject = await createSubject(form);
      setSubjects((current) => [createdSubject, ...current]);
      setForm({
        name: "",
        examId: "",
        weight: "",
        difficulty: "",
        priority: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar materia."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject: SubjectRecord) {
    const subjectName = getSubjectName(subject);
    const shouldDelete = window.confirm(
      `Excluir a materia "${subjectName}"? Essa acao nao pode ser desfeita.`,
    );

    if (!shouldDelete) return;

    setDeletingId(subject.id);
    setError("");

    try {
      await deleteSubject(subject.id);
      setSubjects((current) =>
        current.filter((item) => String(item.id) !== String(subject.id)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao excluir materia."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Materias"
      description="Organize as disciplinas do edital por peso, dificuldade e prioridade."
    >
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Lista de materias
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cadastre as disciplinas e vincule a um concurso quando quiser.
            </p>
          </div>

          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Cancelar" : "Nova materia"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-5"
          >
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-3">
              Concurso
              <select
                value={form.examId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    examId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Sem concurso</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {getExamName(exam)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Peso
              <input
                value={form.weight}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weight: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Dificuldade
              <input
                value={form.difficulty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    difficulty: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Prioridade
              <input
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <div className="md:col-span-5">
              <Button disabled={saving}>
                {saving ? "Salvando..." : "Salvar materia"}
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
            Carregando materias...
          </p>
        )}

        {!loading && subjects.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma materia cadastrada no banco de dados.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="grid items-center gap-2 py-3 text-sm md:grid-cols-[1fr_120px_140px_120px_44px]"
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {getSubjectName(subject)}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Peso: {subject.weight ?? "-"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Dificuldade: {subject.difficulty ?? "-"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Prioridade: {subject.priority ?? "-"}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(subject)}
                disabled={deletingId === subject.id}
                aria-label="Excluir materia"
                title="Excluir materia"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
