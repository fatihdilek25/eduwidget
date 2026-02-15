import type { AppState, ScheduleItem, Course, TimeSlot, Homework } from "./types";

/* =========================
   DATE / TIME HELPERS
========================= */

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// JS getDay(): 0=Sunday..6=Saturday
// Biz dayIndex: 0=Mon..6=Sun
export function getTodayDayIndex(): number {
  const js = new Date().getDay(); // 0..6 (Sun..Sat)
  return js === 0 ? 6 : js - 1;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/* =========================
   CORE SELECTORS
========================= */

export function selectSelectedClassGroupId(state: AppState): string | undefined {
  return state.selectedClassGroupId;
}

export function selectCoursesForSelectedClass(state: AppState): Course[] {
  const cg = selectSelectedClassGroupId(state);
  if (!cg) return [];
  return state.courses.filter(c => c.classGroupId === cg);
}

export function selectScheduleForSelectedClass(state: AppState): ScheduleItem[] {
  const courseIds = new Set(selectCoursesForSelectedClass(state).map(c => c.id));
  return state.scheduleItems.filter(si => courseIds.has(si.courseId));
}

export function selectTimeSlots(state: AppState): TimeSlot[] {
  return Array.isArray(state.timeSlots) ? state.timeSlots : [];
}

export function selectCourseById(state: AppState, courseId: string): Course | undefined {
  return state.courses.find(c => c.id === courseId);
}

export function selectScheduleItemForDaySlot(
  state: AppState,
  dayIndex: number,
  slotIndex: number
): ScheduleItem | undefined {
  return selectScheduleForSelectedClass(state).find(
    si => si.dayIndex === dayIndex && si.slotIndex === slotIndex
  );
}

/* =========================
   TODAY LESSONS
========================= */

export type TodayLessonView = {
  scheduleItem: ScheduleItem;
  course: Course;
  slotIndex: number;
  start: string;
  end: string;
  effectiveNote?: string; // noteOverride varsa o, yoksa course.defaultNote
};

export function selectTodayLessons(state: AppState): TodayLessonView[] {
  const today = getTodayDayIndex();
  const slots = selectTimeSlots(state);
  const bySlot = new Map<number, TimeSlot>();
  for (const ts of slots) bySlot.set(ts.slotIndex, ts);

  const items = selectScheduleForSelectedClass(state)
    .filter(si => si.dayIndex === today)
    .sort((a, b) => a.slotIndex - b.slotIndex);

  const result: TodayLessonView[] = [];

  for (const si of items) {
    const course = selectCourseById(state, si.courseId);
    if (!course) continue;

    const baseSlot = bySlot.get(si.slotIndex);
    const start = si.timeOverride?.start ?? baseSlot?.start ?? "00:00";
    const end = si.timeOverride?.end ?? baseSlot?.end ?? "00:00";

    const effectiveNote = si.noteOverride?.trim()
      ? si.noteOverride.trim()
      : course.defaultNote?.trim()
      ? course.defaultNote.trim()
      : undefined;

    result.push({
      scheduleItem: si,
      course,
      slotIndex: si.slotIndex,
      start,
      end,
      effectiveNote,
    });
  }

  return result;
}

/* =========================
   CURRENT / NEXT LESSON
========================= */

export function selectCurrentAndNextLesson(state: AppState): {
  current?: TodayLessonView;
  next?: TodayLessonView;
  nextList: TodayLessonView[];
} {
  const todayLessons = selectTodayLessons(state);

  if (todayLessons.length === 0) {
    return { nextList: [] };
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // current = now between start-end
  let current: TodayLessonView | undefined;
  for (const l of todayLessons) {
    const s = toMinutes(l.start);
    const e = toMinutes(l.end);
    if (nowMin >= s && nowMin < e) {
      current = l;
      break;
    }
  }

  // next = first lesson whose start is after now
  let next: TodayLessonView | undefined;
  for (const l of todayLessons) {
    if (toMinutes(l.start) > nowMin) {
      next = l;
      break;
    }
  }

  // nextList = after current (or after now if no current)
  const pivotMin = current ? toMinutes(current.end) : nowMin;
  const nextList = todayLessons.filter(l => toMinutes(l.start) >= pivotMin).slice(0, 3);

  return { current, next, nextList };
}

/* =========================
   HOMEWORK
========================= */

export function selectHomeworksForSelectedClass(state: AppState): Homework[] {
  const cg = selectSelectedClassGroupId(state);
  if (!cg) return [];
  return state.homeworks.filter(h => h.classGroupId === cg);
}

export function selectDueTodayHomeworkCount(state: AppState): number {
  const today = getTodayISO();
  return selectHomeworksForSelectedClass(state).filter(h => h.dueDateISO === today).length;
}

/* =========================
   ACHIEVEMENTS / LAST STUCK
========================= */

export function selectLastStuckText(state: AppState): string | null {
  const cg = selectSelectedClassGroupId(state);
  if (!cg) return null;

  const stuck = (state.dailyStuck ?? []).filter(d => d.classGroupId === cg);
  if (stuck.length === 0) return null;

  // Son kayıt (basit MVP)
  const last = stuck[stuck.length - 1];

  const ach = state.achievements.find(a => a.id === last.achievementId);
  if (!ach) return null;

  // title varsa onu kullan
  if (ach.title?.trim()) return ach.title.trim();

  // yoksa unit/outcome birleştir
  const u = ach.unit?.trim();
  const o = ach.outcome?.trim();
  if (u && o) return `${u} / ${o}`;
  return u || o || null;
}

/* =========================
   WIDGET SUMMARY
========================= */

export function buildWidgetSummaryText(state: AppState): { headline: string; subline: string } {
  const { current, next } = selectCurrentAndNextLesson(state);
  const due = selectDueTodayHomeworkCount(state);
  const stuck = selectLastStuckText(state);

  let headline = "Bugün ders yok";
  let sublineParts: string[] = [];

  if (current) {
    headline = `${current.course.title} (${current.start}–${current.end})`;
    if (current.effectiveNote) sublineParts.push(current.effectiveNote);
  } else if (next) {
    headline = `Sonraki: ${next.course.title} (${next.start}–${next.end})`;
  }

  if (due > 0) sublineParts.push(`Bugün ${due} ödev teslimi`);
  if (stuck) sublineParts.push(`Kazanım: ${stuck}`);

  return { headline, subline: sublineParts.join(" • ") };
}
