import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Card } from "../components/ui/Card";
import { inputClass } from "../components/ui/Form";
import {
  fetchExams,
  fetchStudySessions,
  fetchSubjects,
  getErrorMessage,
  getExamName,
  getSubjectName,
  type ExamRecord,
  type StudySessionRecord,
  type SubjectRecord,
  toNumber,
} from "../services/plannerData";

export function Reports() {
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
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

    loadReports();
  }, []);

  const filteredSubjects = selectedExamId
    ? subjects.filter((subject) => String(subject.exam_id) === selectedExamId)
    : subjects;

  const reportRows = useMemo(
    () =>
      filteredSubjects.map((subject) => {
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
    [filteredSubjects, sessions],
  );

  const totalMinutes = reportRows.reduce((sum, row) => sum + row.minutes, 0);
  const totalQuestions = reportRows.reduce((sum, row) => sum + row.questions, 0);
  const totalCorrect = reportRows.reduce((sum, row) => sum + row.correct, 0);
  const totalAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <AppLayout
      title="Relatorios"
      description="Acompanhe sua evolucao por materia, acertos e horas estudadas."
    >
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Horas estudadas
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {Math.round(totalMinutes / 60)}h
          </strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Questoes
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {totalQuestions}
          </strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acertos</p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {totalCorrect}
          </strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Taxa geral
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {totalAccuracy}%
          </strong>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Desempenho por materia
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Compare tempo, questoes e taxa de acerto.
            </p>
          </div>

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
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Carregando relatorios...
          </p>
        )}

        {!loading && reportRows.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre materias e sessoes de estudo no banco para gerar relatorios.
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
                  {Math.round(row.minutes / 60)}h - {row.questions} questoes -{" "}
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
