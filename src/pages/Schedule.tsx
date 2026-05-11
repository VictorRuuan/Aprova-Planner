import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { inputClass, labelClass } from "../components/ui/Form";
import { Toast, type ToastState } from "../components/ui/Toast";
import {
  createScheduleItem,
  deleteScheduleItem,
  fetchExams,
  fetchScheduleItems,
  fetchSubjects,
  formatDateTime,
  getErrorMessage,
  getExamName,
  getSubjectName,
  isMissingScheduleItemsTable,
  updateScheduleItem,
  type ExamRecord,
  type ScheduleItemRecord,
  type SubjectRecord,
} from "../services/plannerData";

type ScheduleForm = {
  subjectId: string;
  title: string;
  scheduledAt: string;
  studyType: string;
};

const emptyForm: ScheduleForm = {
  subjectId: "",
  title: "",
  scheduledAt: "",
  studyType: "Teoria",
};

export function Schedule() {
  const [items, setItems] = useState<ScheduleItemRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItemRecord | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] = useState<ScheduleItemRecord | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setNeedsSetup(false);
        const [scheduleItems, subjectRows, examRows] = await Promise.all([
          fetchScheduleItems(),
          fetchSubjects(),
          fetchExams(),
        ]);

        setItems(scheduleItems);
        setSubjects(subjectRows);
        setExams(examRows);
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

  const visibleSubjects = selectedExamId
    ? subjects.filter((subject) => String(subject.exam_id) === selectedExamId)
    : subjects;

  const filteredItems = selectedExamId
    ? items.filter((item) => {
        const subject = item.subject_id
          ? subjectById.get(String(item.subject_id))
          : undefined;
        return subject?.exam_id && String(subject.exam_id) === selectedExamId;
      })
    : items;

  function openCreateForm() {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(item: ScheduleItemRecord) {
    setEditingItem(item);
    setForm({
      subjectId: item.subject_id ? String(item.subject_id) : "",
      title: item.title || "",
      scheduledAt: "",
      studyType: item.study_type || item.type || "Teoria",
    });
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingItem) {
        const updatedItem = await updateScheduleItem(editingItem.id, form);
        setItems((current) =>
          current.map((item) =>
            String(item.id) === String(updatedItem.id) ? updatedItem : item,
          ),
        );
        setToast({ type: "success", message: "Estudo atualizado." });
      } else {
        const createdItem = await createScheduleItem(form);
        setItems((current) => [createdItem, ...current]);
        setToast({ type: "success", message: "Estudo agendado." });
      }

      setForm(emptyForm);
      setEditingItem(null);
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

  async function handleDelete() {
    if (!itemToDelete) return;

    setDeleting(true);
    setError("");

    try {
      await deleteScheduleItem(itemToDelete.id);
      setItems((current) =>
        current.filter((item) => String(item.id) !== String(itemToDelete.id)),
      );
      setToast({ type: "success", message: "Estudo removido." });
      setItemToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao excluir cronograma."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout
      title="Cronograma"
      description="Veja seu plano semanal de estudos."
    >
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={!!itemToDelete}
        title="Excluir estudo"
        description="Este compromisso sera removido do cronograma."
        loading={deleting}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleDelete}
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Cronograma semanal
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Organize estudos e visualize sua semana.
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
              disabled={needsSetup}
            >
              {showForm ? "Cancelar" : "Novo estudo"}
            </Button>
          </div>
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
            <label className={labelClass}>
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
                {visibleSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {getSubjectName(subject)}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
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

            <label className={labelClass}>
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

            <label className={labelClass}>
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
                {saving
                  ? "Salvando..."
                  : editingItem
                    ? "Atualizar estudo"
                    : "Salvar estudo"}
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

        {!loading && filteredItems.length === 0 && !needsSetup && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhum item de cronograma encontrado.
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-7">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
            <div
              key={day}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {day}
              </p>
              <div className="space-y-2">
                {filteredItems
                  .filter((item) => {
                    const value = item.scheduled_at || item.date;
                    if (!value) return false;
                    return new Date(value).getDay() ===
                      ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].indexOf(
                        day,
                      );
                  })
                  .map((item) => {
                    const subject = item.subject_id
                      ? subjectById.get(String(item.subject_id))
                      : undefined;

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg bg-white p-2 text-xs shadow-sm dark:bg-slate-900"
                      >
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.title || getSubjectName(subject)}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {formatDateTime(item.scheduled_at || item.date)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map((item) => {
            const subject = item.subject_id
              ? subjectById.get(String(item.subject_id))
              : undefined;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {item.subject_name || item.title || getSubjectName(subject)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDateTime(item.scheduled_at || item.date)} -{" "}
                    {item.study_type || item.type || "Estudo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    aria-label="Editar estudo"
                    title="Editar estudo"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    aria-label="Excluir estudo"
                    title="Excluir estudo"
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
