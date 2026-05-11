import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  createStudySession,
  fetchStudySessions,
  fetchSubjects,
  formatDateTime,
  getErrorMessage,
  getSubjectName,
  type StudySessionRecord,
  type SubjectRecord,
  toNumber,
} from "../services/plannerData";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function StudySession() {
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    subjectId: "",
    durationMinutes: "",
    questionsDone: "",
    correctAnswers: "",
    studiedAt: "",
    type: "Teoria",
  });

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        const [sessionRows, subjectRows] = await Promise.all([
          fetchStudySessions(),
          fetchSubjects(),
        ]);

        setSessions(sessionRows);
        setSubjects(subjectRows);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const createdSession = await createStudySession(form);
      setSessions((current) => [createdSession, ...current]);
      setForm({
        subjectId: "",
        durationMinutes: "",
        questionsDone: "",
        correctAnswers: "",
        studiedAt: "",
        type: "Teoria",
      });
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar sessao."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout
      title="Registrar estudo"
      description="Registre o que voce estudou, tempo investido, questoes feitas e acertos."
    >
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Sessoes de estudo
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Salve seus estudos e acompanhe a evolucao nos relatorios.
            </p>
          </div>

          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Cancelar" : "Nova sessao"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-6"
          >
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                {saving ? "Salvando..." : "Salvar sessao"}
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

        {!loading && sessions.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma sessao de estudo cadastrada no banco de dados.
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((session) => {
            const subject = session.subject_id
              ? subjectById.get(String(session.subject_id))
              : undefined;
            const questions = toNumber(
              session.questions_done ?? session.questions,
            );
            const correct = toNumber(session.correct_answers ?? session.correct);

            return (
              <div key={session.id} className="py-3">
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
                  min -{" "}
                  {questions} questoes - {correct} acertos
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </AppLayout>
  );
}
