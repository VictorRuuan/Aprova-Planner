import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Card } from "../components/ui/Card";
import {
  fetchStudySessions,
  fetchSubjects,
  getErrorMessage,
  getSubjectName,
  type StudySessionRecord,
  type SubjectRecord,
  toNumber,
} from "../services/plannerData";

export function Reports() {
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
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

    loadReports();
  }, []);

  const reportRows = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectSessions = sessions.filter(
          (session) => String(session.subject_id) === String(subject.id),
        );
        const minutes = subjectSessions.reduce(
          (sum, session) =>
            sum +
            toNumber(
              session.studied_minutes ??
                session.duration_minutes ??
                session.minutes,
            ),
          0,
        );
        const questions = subjectSessions.reduce(
          (sum, session) =>
            sum + toNumber(session.questions_done ?? session.questions),
          0,
        );
        const correct = subjectSessions.reduce(
          (sum, session) =>
            sum + toNumber(session.correct_answers ?? session.correct),
          0,
        );
        const accuracy =
          questions > 0 ? Math.round((correct / questions) * 100) : 0;

        return { subject, minutes, questions, correct, accuracy };
      }),
    [sessions, subjects],
  );

  return (
    <AppLayout
      title="Relatórios"
      description="Acompanhe sua evolução por matéria, acertos e horas estudadas."
    >
      <Card title="Relatórios de desempenho">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Carregando relatórios...
          </p>
        )}

        {!loading && reportRows.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre matérias e sessões de estudo no banco para gerar relatórios.
          </p>
        )}

        <div className="space-y-4">
          {reportRows.map((row) => (
            <div key={row.subject.id}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {getSubjectName(row.subject)}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {Math.round(row.minutes / 60)}h - {row.questions} questões -{" "}
                  {row.accuracy}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                  style={{ width: `${row.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
