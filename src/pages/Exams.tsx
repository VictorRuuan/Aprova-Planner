import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { inputClass, labelClass } from "../components/ui/Form";
import { Toast, type ToastState } from "../components/ui/Toast";
import {
  createExam,
  deleteExam,
  fetchExams,
  formatDate,
  getExamName,
  getErrorMessage,
  updateExam,
  type ExamRecord,
} from "../services/plannerData";

type ExamForm = {
  name: string;
  organization: string;
  examDate: string;
};

const emptyForm: ExamForm = {
  name: "",
  organization: "",
  examDate: "",
};

export function Exams() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRecord | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamRecord | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ExamForm>(emptyForm);

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

  function openCreateForm() {
    setEditingExam(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(exam: ExamRecord) {
    setEditingExam(exam);
    setForm({
      name: getExamName(exam),
      organization: exam.board || exam.organization || exam.institution || "",
      examDate: exam.exam_date || exam.date || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingExam) {
        const updatedExam = await updateExam(editingExam.id, form);
        setExams((current) =>
          current.map((exam) =>
            String(exam.id) === String(updatedExam.id) ? updatedExam : exam,
          ),
        );
        setToast({ type: "success", message: "Concurso atualizado." });
      } else {
        const createdExam = await createExam(form);
        setExams((current) => [createdExam, ...current]);
        setToast({ type: "success", message: "Concurso salvo." });
      }

      setForm(emptyForm);
      setEditingExam(null);
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar concurso."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!examToDelete) return;

    setDeleting(true);
    setError("");

    try {
      await deleteExam(examToDelete.id);
      setExams((current) =>
        current.filter((exam) => String(exam.id) !== String(examToDelete.id)),
      );
      setToast({ type: "success", message: "Concurso excluido." });
      setExamToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao excluir concurso."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout
      title="Concursos"
      description="Cadastre e gerencie os concursos que voce esta estudando."
    >
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={!!examToDelete}
        title="Excluir concurso"
        description={`Voce esta prestes a excluir "${examToDelete ? getExamName(examToDelete) : ""}".`}
        loading={deleting}
        onCancel={() => setExamToDelete(null)}
        onConfirm={handleDelete}
      />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Concursos cadastrados
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Adicione, edite e remova seus concursos.
            </p>
          </div>

          <Button type="button" onClick={showForm ? () => setShowForm(false) : openCreateForm}>
            {showForm ? "Cancelar" : "Novo concurso"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-3"
          >
            <label className={labelClass}>
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

            <label className={labelClass}>
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

            <label className={labelClass}>
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
                {saving
                  ? "Salvando..."
                  : editingExam
                    ? "Atualizar concurso"
                    : "Salvar concurso"}
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
            <div
              key={exam.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(exam)}
                  aria-label="Editar concurso"
                  title="Editar concurso"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setExamToDelete(exam)}
                  aria-label="Excluir concurso"
                  title="Excluir concurso"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
