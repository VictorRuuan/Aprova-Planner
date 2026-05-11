import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "../components/layout/AppLayout.tsx";
import { Card } from "../components/ui/Card";
import { inputClass } from "../components/ui/Form";
import {
  fetchExams,
  fetchScheduleItems,
  fetchStudySessions,
  fetchSubjects,
  formatDateTime,
  getErrorMessage,
  getExamName,
  getSubjectName,
  isMissingScheduleItemsTable,
  type ExamRecord,
  type ScheduleItemRecord,
  type StudySessionRecord,
  type SubjectRecord,
  toNumber,
} from "../services/plannerData";

type DashboardData = {
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  sessions: StudySessionRecord[];
  scheduleItems: ScheduleItemRecord[];
};

type GoalSettings = {
  dailyMinutes: string;
  dailyQuestions: string;
  weeklyReviews: string;
};

const defaultGoals: GoalSettings = {
  dailyMinutes: "120",
  dailyQuestions: "50",
  weeklyReviews: "3",
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    exams: [],
    subjects: [],
    sessions: [],
    scheduleItems: [],
  });
  const [selectedExamId, setSelectedExamId] = useState("");
  const [today] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goals] = useState<GoalSettings>(() => {
    const savedGoals = localStorage.getItem("aprova-planner-goals");
    return savedGoals ? JSON.parse(savedGoals) : defaultGoals;
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        fetchExams(),
        fetchSubjects(),
        fetchStudySessions(),
        fetchScheduleItems(),
      ]);

      setData({
        exams: results[0].status === "fulfilled" ? results[0].value : [],
        subjects: results[1].status === "fulfilled" ? results[1].value : [],
        sessions: results[2].status === "fulfilled" ? results[2].value : [],
        scheduleItems:
          results[3].status === "fulfilled" ? results[3].value : [],
      });

      const rejected = results.find(
        (result) =>
          result.status === "rejected" &&
          !isMissingScheduleItemsTable(result.reason),
      );
      if (rejected?.status === "rejected") {
        setError(getErrorMessage(rejected.reason, "Erro ao carregar dados."));
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const subjectById = useMemo(
    () => new Map(data.subjects.map((subject) => [String(subject.id), subject])),
    [data.subjects],
  );

  const filteredSubjects = selectedExamId
    ? data.subjects.filter((subject) => String(subject.exam_id) === selectedExamId)
    : data.subjects;

  const filteredSessions = selectedExamId
    ? data.sessions.filter((session) => {
        const subject = session.subject_id
          ? subjectById.get(String(session.subject_id))
          : undefined;
        return subject?.exam_id && String(subject.exam_id) === selectedExamId;
      })
    : data.sessions;

  const totalMinutes = filteredSessions.reduce(
    (sum, session) =>
      sum +
      toNumber(
        session.studied_minutes ?? session.duration_minutes ?? session.minutes,
      ),
    0,
  );
  const totalQuestions = filteredSessions.reduce(
    (sum, session) => sum + toNumber(session.questions_done ?? session.questions),
    0,
  );
  const totalCorrect = filteredSessions.reduce(
    (sum, session) =>
      sum + toNumber(session.correct_answers ?? session.correct),
    0,
  );
  const accuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weeklyMinutes = filteredSessions.reduce((sum, session) => {
    const date = new Date(session.created_at || session.studied_at || "");
    if (Number.isNaN(date.getTime()) || date < weekStart) return sum;
    return (
      sum +
      toNumber(
        session.studied_minutes ?? session.duration_minutes ?? session.minutes,
      )
    );
  }, 0);

  const nextExam = data.exams
    .filter((exam) => !selectedExamId || String(exam.id) === selectedExamId)
    .map((exam) => ({ exam, date: exam.exam_date || exam.date }))
    .filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()))
    .sort(
      (a, b) =>
        new Date(a.date ?? "").getTime() - new Date(b.date ?? "").getTime(),
    )[0];
  const daysUntilExam = nextExam?.date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextExam.date).getTime() - today) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const subjectStats = filteredSubjects
    .map((subject) => {
      const sessions = filteredSessions.filter(
        (session) => String(session.subject_id) === String(subject.id),
      );
      const questions = sessions.reduce(
        (sum, session) =>
          sum + toNumber(session.questions_done ?? session.questions),
        0,
      );
      const correct = sessions.reduce(
        (sum, session) =>
          sum + toNumber(session.correct_answers ?? session.correct),
        0,
      );

      return {
        subject,
        accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
        questions,
        priority: toNumber(subject.priority) + toNumber(subject.difficulty),
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.priority - a.priority);

  const attentionSubjects = subjectStats
    .filter((item) => item.questions > 0)
    .slice(0, 3);
  const scheduleSuggestion =
    subjectStats[0]?.subject || filteredSubjects.sort((a, b) => toNumber(b.priority) - toNumber(a.priority))[0];

  const weeklyGoal = toNumber(goals.dailyMinutes) * 7;
  const weeklyProgress =
    weeklyGoal > 0 ? Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100)) : 0;

  return (
    <AppLayout
      title="Dashboard"
      description="Acompanhe sua preparacao, evolucao e proximas atividades."
    >
      <div className="mb-4 flex justify-end">
        <select
          value={selectedExamId}
          onChange={(event) => setSelectedExamId(event.target.value)}
          className={inputClass}
        >
          <option value="">Todos os concursos</option>
          {data.exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {getExamName(exam)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          Nao foi possivel carregar todos os dados: {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dias ate a prova
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {loading ? "..." : daysUntilExam ?? "-"}
          </strong>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Horas estudadas
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {loading ? "..." : `${Math.round(totalMinutes / 60)}h`}
          </strong>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Questoes feitas
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {loading ? "..." : totalQuestions}
          </strong>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Taxa de acerto
          </p>
          <strong className="mt-2 block text-3xl text-slate-900 dark:text-slate-100">
            {loading ? "..." : `${accuracy}%`}
          </strong>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Meta semanal">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(weeklyMinutes / 60)}h de {Math.round(weeklyGoal / 60)}h
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Meta diaria: {goals.dailyMinutes} min e {goals.dailyQuestions} questoes.
          </p>
        </Card>

        <Card title="Sugestao automatica">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Proximo foco recomendado
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {scheduleSuggestion
              ? getSubjectName(scheduleSuggestion)
              : "Cadastre materias para gerar sugestoes"}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A sugestao considera prioridade, dificuldade e taxa de acerto.
          </p>
        </Card>

        <Card title="Proximos estudos">
          <div className="space-y-3 text-sm">
            {data.scheduleItems.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Nenhum estudo agendado no banco de dados.
              </p>
            )}

            {data.scheduleItems.slice(0, 3).map((item) => {
              const subject = item.subject_id
                ? subjectById.get(String(item.subject_id))
                : undefined;

              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {item.subject_name || item.title || getSubjectName(subject)}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {formatDateTime(item.scheduled_at || item.date)} -{" "}
                    {item.study_type || item.type || "Estudo"}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Materias com atencao">
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            {attentionSubjects.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Registre questoes por materia para gerar este indicador.
              </p>
            )}

            {attentionSubjects.map((item) => (
              <div key={item.subject.id}>
                <div className="mb-1 flex justify-between">
                  <span>{getSubjectName(item.subject)}</span>
                  <span>{item.accuracy}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Concurso em foco">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {nextExam ? getExamName(nextExam.exam) : "Nenhum concurso com data"}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {nextExam?.date
              ? `${daysUntilExam} dias restantes`
              : "Adicione a data da prova para acompanhar a contagem."}
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
