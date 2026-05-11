import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { inputClass, labelClass } from "../components/ui/Form";
import { Toast, type ToastState } from "../components/ui/Toast";
import {
  createSubject,
  deleteSubject,
  fetchExams,
  fetchSubjects,
  getErrorMessage,
  getExamName,
  getSubjectName,
  updateSubject,
  type ExamRecord,
  type SubjectRecord,
} from "../services/plannerData";

type SubjectForm = {
  name: string;
  examId: string;
  weight: string;
  difficulty: string;
  priority: string;
};

const emptyForm: SubjectForm = {
  name: "",
  examId: "",
  weight: "",
  difficulty: "",
  priority: "",
};

export function Subjects() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(
    null,
  );
  const [subjectToDelete, setSubjectToDelete] =
    useState<SubjectRecord | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SubjectForm>(emptyForm);

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

  const examById = useMemo(
    () => new Map(exams.map((exam) => [String(exam.id), exam])),
    [exams],
  );

  const filteredSubjects = selectedExamId
    ? subjects.filter((subject) => String(subject.exam_id) === selectedExamId)
    : subjects;

  function openCreateForm() {
    setEditingSubject(null);
    setForm({ ...emptyForm, examId: selectedExamId });
    setShowForm(true);
  }

  function openEditForm(subject: SubjectRecord) {
    setEditingSubject(subject);
    setForm({
      name: getSubjectName(subject),
      examId: subject.exam_id ? String(subject.exam_id) : "",
      weight: subject.weight ? String(subject.weight) : "",
      difficulty: subject.difficulty ? String(subject.difficulty) : "",
      priority: subject.priority ? String(subject.priority) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingSubject) {
        const updatedSubject = await updateSubject(editingSubject.id, form);
        setSubjects((current) =>
          current.map((subject) =>
            String(subject.id) === String(updatedSubject.id)
              ? updatedSubject
              : subject,
          ),
        );
        setToast({ type: "success", message: "Materia atualizada." });
      } else {
        const createdSubject = await createSubject(form);
        setSubjects((current) => [createdSubject, ...current]);
        setToast({ type: "success", message: "Materia salva." });
      }

      setForm(emptyForm);
      setEditingSubject(null);
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar materia."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!subjectToDelete) return;

    setDeleting(true);
    setError("");

    try {
      await deleteSubject(subjectToDelete.id);
      setSubjects((current) =>
        current.filter(
          (subject) => String(subject.id) !== String(subjectToDelete.id),
        ),
      );
      setToast({ type: "success", message: "Materia excluida." });
      setSubjectToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao excluir materia."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout
      title="Materias"
      description="Organize as disciplinas do edital por peso, dificuldade e prioridade."
    >
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={!!subjectToDelete}
        title="Excluir materia"
        description={`Voce esta prestes a excluir "${subjectToDelete ? getSubjectName(subjectToDelete) : ""}".`}
        loading={deleting}
        onCancel={() => setSubjectToDelete(null)}
        onConfirm={handleDelete}
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Lista de materias
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Filtre por concurso, edite ou exclua disciplinas.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
              className={inputClass}
            >
              <option value="">Todos os concursos</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {getExamName(exam)}
                </option>
              ))}
            </select>

            <Button
              type="button"
              onClick={showForm ? () => setShowForm(false) : openCreateForm}
            >
              {showForm ? "Cancelar" : "Nova materia"}
            </Button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-5"
          >
            <label className={`${labelClass} md:col-span-2`}>
              Nome
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className={inputClass}
                required
              />
            </label>

            <label className={`${labelClass} md:col-span-3`}>
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

            <label className={labelClass}>
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

            <label className={labelClass}>
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

            <label className={labelClass}>
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
                {saving
                  ? "Salvando..."
                  : editingSubject
                    ? "Atualizar materia"
                    : "Salvar materia"}
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

        {!loading && filteredSubjects.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma materia encontrada.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSubjects.map((subject) => {
            const exam = subject.exam_id
              ? examById.get(String(subject.exam_id))
              : undefined;

            return (
              <div
                key={subject.id}
                className="grid items-center gap-2 py-3 text-sm md:grid-cols-[1fr_150px_100px_120px_100px_88px]"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {getSubjectName(subject)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {exam ? getExamName(exam) : "Sem concurso"}
                  </p>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Peso: {subject.weight ?? "-"}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Dificuldade: {subject.difficulty ?? "-"}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Prioridade: {subject.priority ?? "-"}
                </p>
                <div className="flex gap-2 md:justify-end md:col-span-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(subject)}
                    aria-label="Editar materia"
                    title="Editar materia"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectToDelete(subject)}
                    aria-label="Excluir materia"
                    title="Excluir materia"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppLayout>
  );
}
