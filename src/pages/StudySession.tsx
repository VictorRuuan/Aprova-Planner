import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { inputClass, labelClass } from "../components/ui/Form";
import { Toast, type ToastState } from "../components/ui/Toast";
import {
  createStudySession,
  deleteStudySession,
  fetchExams,
  fetchStudySessions,
  fetchSubjects,
  formatDateTime,
  getErrorMessage,
  getExamName,
  getSubjectName,
  toNumber,
  updateStudySession,
  type ExamRecord,
  type StudySessionRecord,
  type SubjectRecord,
} from "../services/plannerData";

type SessionForm = {
  subjectId: string;
  durationMinutes: string;
  questionsDone: string;
  correctAnswers: string;
  studiedAt: string;
  type: string;
};

const emptyForm: SessionForm = {
  subjectId: "",
  durationMinutes: "",
  questionsDone: "",
  correctAnswers: "",
  studiedAt: "",
  type: "Teoria",
};

export function StudySession() {
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] =
    useState<StudySessionRecord | null>(null);
  const [sessionToDelete, setSessionToDelete] =
    useState<StudySessionRecord | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SessionForm>(emptyForm);

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        const [sessionRows, subjectRows, examRows] = await Promise.all([
          fetchStudySessions(),
          fetchSubjects(),
          fetchExams(),
        ]);

        setSessions(sessionRows);
        setSubjects(subjectRows);
        setExams(examRows);
      } catch (err) {
        setError(getErrorMessage(err, "Erro ao carregar dados."));
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [String(subject.id), subject])),
    [subjects],
  );

  const visibleSubjects = selectedExamId
    ? subjects.filter((subject) => String(subject.exam_id) === selectedExamId)
    : subjects;

  const filteredSessions = selectedExamId
    ? sessions.filter((session) => {
        const subject = session.subject_id
          ? subjectById.get(String(session.subject_id))
          : undefined;
        return subject?.exam_id && String(subject.exam_id) === selectedExamId;
      })
    : sessions;

  function openCreateForm() {
    setEditingSession(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(session: StudySessionRecord) {
    setEditingSession(session);
    setForm({
      subjectId: session.subject_id ? String(session.subject_id) : "",
      durationMinutes: String(
        toNumber(
          session.studied_minutes ?? session.duration_minutes ?? session.minutes,
        ),
      ),
      questionsDone: String(
        toNumber(session.questions_done ?? session.questions),
      ),
      correctAnswers: String(
        toNumber(session.correct_answers ?? session.correct),
      ),
      studiedAt: "",
      type: session.type || session.mode || "Teoria",
    });
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingSession) {
        const updatedSession = await updateStudySession(editingSession.id, form);
        setSessions((current) =>
          current.map((session) =>
            String(session.id) === String(updatedSession.id)
              ? updatedSession
              : session,
          ),
        );
        setToast({ type: "success", message: "Sessao atualizada." });
      } else {
        const createdSession = await createStudySession(form);
        setSessions((current) => [createdSession, ...current]);
        setToast({ type: "success", message: "Sessao salva." });
      }

      setForm(emptyForm);
      setEditingSession(null);
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar sessao."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sessionToDelete) return;

    setDeleting(true);
    setError("");

    try {
      await deleteStudySession(sessionToDelete.id);
      setSessions((current) =>
        current.filter(
          (session) => String(session.id) !== String(sessionToDelete.id),
        ),
      );
      setToast({ type: "success", message: "Sessao excluida." });
      setSessionToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao excluir sessao."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout
      title="Registrar estudo"
      description="Registre o que voce estudou, tempo investido, questoes feitas e acertos."
    >
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={!!sessionToDelete}
        title="Excluir sessao"
        description="Essa sessao sera removida dos seus relatorios."
        loading={deleting}
        onCancel={() => setSessionToDelete(null)}
        onConfirm={handleDelete}
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Sessoes de estudo
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Salve, edite e filtre seus estudos por concurso.
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
              {showForm ? "Cancelar" : "Nova sessao"}
            </Button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-6"
          >
            <label className={`${labelClass} md:col-span-2`}>
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

            {!editingSession && (
              <label className={`${labelClass} md:col-span-2`}>
                Data e hora
                <input
                  value={form.studiedAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studiedAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  className={inputClass}
                  required
                />
              </label>
            )}

            <label className={labelClass}>
              Minutos
              <input
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
                type="number"
                min="1"
                className={inputClass}
                required
              />
            </label>

            <label className={labelClass}>
              Tipo
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
                className={inputClass}
              >
                <option>Teoria</option>
                <option>Questoes</option>
                <option>Revisao</option>
                <option>Simulado</option>
              </select>
            </label>

            <label className={labelClass}>
              Questoes
              <input
                value={form.questionsDone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    questionsDone: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Acertos
              <input
                value={form.correctAnswers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    correctAnswers: event.target.value,
                  }))
                }
                type="number"
                min="0"
                className={inputClass}
              />
            </label>

            <div className="md:col-span-6">
              <Button disabled={saving}>
                {saving
                  ? "Salvando..."
                  : editingSession
                    ? "Atualizar sessao"
                    : "Salvar sessao"}
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
            Carregando sessoes...
          </p>
        )}

        {!loading && filteredSessions.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma sessao encontrada.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSessions.map((session) => {
            const subject = session.subject_id
              ? subjectById.get(String(session.subject_id))
              : undefined;
            const questions = toNumber(
              session.questions_done ?? session.questions,
            );
            const correct = toNumber(session.correct_answers ?? session.correct);

            return (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {getSubjectName(subject)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDateTime(
                      session.studied_at || session.date || session.created_at,
                    )}{" "}
                    -{" "}
                    {toNumber(
                      session.studied_minutes ??
                        session.duration_minutes ??
                        session.minutes,
                    )}{" "}
                    min - {questions} questoes - {correct} acertos
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(session)}
                    aria-label="Editar sessao"
                    title="Editar sessao"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionToDelete(session)}
                    aria-label="Excluir sessao"
                    title="Excluir sessao"
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
