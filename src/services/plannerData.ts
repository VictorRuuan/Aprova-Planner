import { supabase } from "./supabase";

type InsertRecord = Record<string, string | number | null | undefined>;

export type ExamRecord = {
  id: string | number;
  name?: string | null;
  title?: string | null;
  board?: string | null;
  organization?: string | null;
  institution?: string | null;
  exam_date?: string | null;
  date?: string | null;
  created_at?: string | null;
};

export type SubjectRecord = {
  id: string | number;
  exam_id?: string | number | null;
  name?: string | null;
  title?: string | null;
  weight?: number | string | null;
  difficulty?: number | string | null;
  priority?: number | string | null;
  created_at?: string | null;
};

export type StudySessionRecord = {
  id: string | number;
  subject_id?: string | number | null;
  studied_minutes?: number | string | null;
  duration_minutes?: number | string | null;
  minutes?: number | string | null;
  questions_done?: number | string | null;
  questions?: number | string | null;
  correct_answers?: number | string | null;
  correct?: number | string | null;
  studied_at?: string | null;
  date?: string | null;
  type?: string | null;
  mode?: string | null;
  created_at?: string | null;
};

export type ScheduleItemRecord = {
  id: string | number;
  subject_id?: string | number | null;
  title?: string | null;
  subject_name?: string | null;
  scheduled_at?: string | null;
  date?: string | null;
  start_time?: string | null;
  study_type?: string | null;
  type?: string | null;
  created_at?: string | null;
};

export async function fetchExams() {
  const { data, error } = await supabase.from("exams").select("*");

  if (error) throw error;
  return (data ?? []) as ExamRecord[];
}

export async function fetchSubjects() {
  const { data, error } = await supabase.from("subjects").select("*");

  if (error) throw error;
  return (data ?? []) as SubjectRecord[];
}

export async function fetchStudySessions() {
  const { data, error } = await supabase.from("study_sessions").select("*");

  if (error) throw error;
  return (data ?? []) as StudySessionRecord[];
}

export async function fetchScheduleItems() {
  const { data, error } = await supabase.from("schedule_items").select("*");

  if (error) throw error;
  return (data ?? []) as ScheduleItemRecord[];
}

export function isMissingScheduleItemsTable(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("public.schedule_items")
  );
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

async function insertRow<T>(table: string, payload: InsertRecord) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== ""),
  );
  const payloadWithUser = user
    ? { ...cleanPayload, user_id: user.id }
    : cleanPayload;

  const firstAttempt = await supabase
    .from(table)
    .insert(payloadWithUser)
    .select()
    .single();

  if (!firstAttempt.error) return firstAttempt.data as T;

  const message = firstAttempt.error.message.toLowerCase();
  if (message.includes("user_id") || message.includes("user id")) {
    const retry = await supabase
      .from(table)
      .insert(cleanPayload)
      .select()
      .single();

    if (!retry.error) return retry.data as T;
    throw retry.error;
  }

  throw firstAttempt.error;
}

async function insertWithFallbacks<T>(table: string, payloads: InsertRecord[]) {
  let lastError: unknown;

  for (const payload of payloads) {
    try {
      return await insertRow<T>(table, payload);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message.toLowerCase() : "";

      if (!message.includes("column") && !message.includes("schema cache")) {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function createExam(input: {
  name: string;
  organization?: string;
  examDate?: string;
}) {
  return insertWithFallbacks<ExamRecord>("exams", [
    {
      name: input.name,
      board: input.organization,
      exam_date: input.examDate,
    },
    {
      name: input.name,
      organization: input.organization,
      exam_date: input.examDate,
    },
    {
      title: input.name,
      institution: input.organization,
      date: input.examDate,
    },
    {
      name: input.name,
    },
  ]);
}

export async function createSubject(input: {
  name: string;
  examId?: string;
  weight?: string;
  difficulty?: string;
  priority?: string;
}) {
  return insertWithFallbacks<SubjectRecord>("subjects", [
    {
      name: input.name,
      exam_id: input.examId,
      weight: input.weight,
      difficulty: input.difficulty,
      priority: input.priority,
    },
    {
      title: input.name,
      exam_id: input.examId,
      weight: input.weight,
      difficulty: input.difficulty,
      priority: input.priority,
    },
    {
      name: input.name,
    },
  ]);
}

export async function deleteSubject(id: string | number) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) throw error;
}

export async function createScheduleItem(input: {
  subjectId?: string;
  title?: string;
  scheduledAt: string;
  studyType?: string;
}) {
  return insertWithFallbacks<ScheduleItemRecord>("schedule_items", [
    {
      subject_id: input.subjectId,
      title: input.title,
      scheduled_at: input.scheduledAt,
      study_type: input.studyType,
    },
    {
      subject_id: input.subjectId,
      title: input.title,
      date: input.scheduledAt,
      type: input.studyType,
    },
    {
      title: input.title,
      scheduled_at: input.scheduledAt,
    },
  ]);
}

export async function createStudySession(input: {
  subjectId?: string;
  durationMinutes: string;
  questionsDone?: string;
  correctAnswers?: string;
  studiedAt: string;
  type?: string;
}) {
  return insertWithFallbacks<StudySessionRecord>("study_sessions", [
    {
      subject_id: input.subjectId,
      studied_minutes: input.durationMinutes,
      questions_done: input.questionsDone,
      correct_answers: input.correctAnswers,
    },
    {
      subject_id: input.subjectId,
      duration_minutes: input.durationMinutes,
      questions_done: input.questionsDone,
      correct_answers: input.correctAnswers,
      studied_at: input.studiedAt,
      type: input.type,
    },
    {
      subject_id: input.subjectId,
      minutes: input.durationMinutes,
      questions: input.questionsDone,
      correct: input.correctAnswers,
      date: input.studiedAt,
      mode: input.type,
    },
    {
      duration_minutes: input.durationMinutes,
      studied_at: input.studiedAt,
    },
  ]);
}

export function getExamName(exam: ExamRecord) {
  return exam.name || exam.title || "Concurso sem nome";
}

export function getSubjectName(subject?: SubjectRecord) {
  return subject?.name || subject?.title || "Materia sem nome";
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function formatDate(value?: string | null) {
  if (!value) return "Data nao informada";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Data nao informada";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
