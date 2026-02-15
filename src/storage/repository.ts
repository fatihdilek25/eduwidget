import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppState,
  ClassGroup,
  Course,
  ScheduleItem,
  TimeSlot,
  TimeRange,
  Homework,
  DailyStuck,
} from "../domain/types";

const STORAGE_KEY = "edu_widget_app_state_v11";

/* ================================
   ID HELPERS
================================ */

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

/* ================================
   DEFAULT TIME SLOTS (Türkiye okulları için örnek)
   (İstersen sonra Ayarlar’dan düzenleriz)
================================ */

function defaultTimeSlots(): TimeSlot[] {
  return [
    { slotIndex: 1, start: "08:30", end: "09:10" },
    { slotIndex: 2, start: "09:20", end: "10:00" },
    { slotIndex: 3, start: "10:10", end: "10:50" },
    { slotIndex: 4, start: "11:00", end: "11:40" },
    { slotIndex: 5, start: "11:50", end: "12:30" },
    { slotIndex: 6, start: "13:30", end: "14:10" },
    { slotIndex: 7, start: "14:20", end: "15:00" },
    { slotIndex: 8, start: "15:10", end: "15:50" },
  ];
}

/* ================================
   EMPTY STATE (v1.1)
================================ */

export function createEmptyState(): AppState {
  const cgId = "cg-default";
  const classGroups: ClassGroup[] = [{ id: cgId, label: "Varsayılan Sınıf" }];

  return {
    mode: undefined,
    selectedClassGroupId: cgId,

    classGroups,
    courses: [
  {
    id: "course-fen-5a",
    classGroupId: cgId,
    title: "Fen Bilimleri",
    type: "lesson",
    defaultNote: "Deney malzemelerini getir",
  },
],
scheduleItems: [
  {
    id: "sched-demo-1",
    courseId: "course-fen-5a",
    dayIndex: 0,   // Pzt
    slotIndex: 1,
  },
],

    timeSlots: defaultTimeSlots(),

    homeworks: [],
    achievements: [],
    dailyStuck: [],
  };
}

/* ================================
   STORAGE HELPERS
================================ */

async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function saveJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/* ================================
   LEGACY MIGRATION (V1 -> v1.1)
   Eski yapı: lessons[] vardı.
   Yeni yapı: classGroups/courses/scheduleItems/timeSlots
================================ */

type LegacyLesson = {
  id?: string;
  title?: string;
  note?: string;
  dayIndex?: number;     // 0..6
  startTime?: string;    // "09:00"
  endTime?: string;      // "09:40"
};

type LegacyState = {
  mode?: any;

  lessons?: LegacyLesson[];

  homeworks?: any[];
  achievements?: any[];
  dailyStuck?: any[];
};

function buildTimeSlotsFromLegacyLessons(lessons: LegacyLesson[]): TimeSlot[] {
  const pairs = lessons
    .map(l => ({ start: l.startTime, end: l.endTime }))
    .filter(p => !!p.start && !!p.end) as { start: string; end: string }[];

  // unique by "start|end"
  const uniq = new Map<string, { start: string; end: string }>();
  for (const p of pairs) uniq.set(`${p.start}|${p.end}`, p);

  const list = Array.from(uniq.values()).sort((a, b) => a.start.localeCompare(b.start));

  // Eğer legacy’den çıkmadıysa default’a dön
  if (list.length === 0) return defaultTimeSlots();

  return list.map((p, i) => ({ slotIndex: i + 1, start: p.start, end: p.end }));
}

function findSlotIndex(timeSlots: TimeSlot[], range: TimeRange): number {
  const idx = timeSlots.find(ts => ts.start === range.start && ts.end === range.end)?.slotIndex;
  return idx ?? 1;
}

function migrateLegacyToV11(s: LegacyState): AppState {
  const base = createEmptyState();

  const cgId = base.selectedClassGroupId!; // "cg-default"

  const lessons = Array.isArray(s.lessons) ? s.lessons : [];
  const timeSlots = buildTimeSlotsFromLegacyLessons(lessons);

  // Courses: unique by lesson.title
  const courseByTitle = new Map<string, Course>();

  const courses: Course[] = [];
  const scheduleItems: ScheduleItem[] = [];

  for (const l of lessons) {
    const title = (l.title ?? "").trim();
    if (!title) continue;

    let course = courseByTitle.get(title);
    if (!course) {
      course = {
        id: uid("course"),
        classGroupId: cgId,
        title,
        type: "lesson",
      };
      courseByTitle.set(title, course);
      courses.push(course);
    }

    const dayIndex = typeof l.dayIndex === "number" ? l.dayIndex : 0;

    // slotIndex: start/end eşleşirse bul, yoksa 1
    const hasTime = !!l.startTime && !!l.endTime;
    const slotIndex = hasTime
      ? findSlotIndex(timeSlots, { start: l.startTime!, end: l.endTime! })
      : 1;

    scheduleItems.push({
      id: uid("sched"),
      courseId: course.id,
      dayIndex,
      slotIndex,
      noteOverride: l.note ? String(l.note) : undefined,
    });
  }

  // Homeworks legacy’de classGroupId yoksa default ekle
  const homeworks: Homework[] = (Array.isArray(s.homeworks) ? s.homeworks : []).map((h: any) => ({
    ...h,
    classGroupId: h.classGroupId ?? cgId,
  }));

  const dailyStuck: DailyStuck[] = (Array.isArray(s.dailyStuck) ? s.dailyStuck : []).map((d: any) => ({
    ...d,
    id: d.id ?? uid("stuck"),
    classGroupId: d.classGroupId ?? cgId,
  }));

  return {
    ...base,
    mode: s.mode === "teacher" || s.mode === "student" ? s.mode : undefined,
    timeSlots,
    courses,
    scheduleItems,
    homeworks,
    achievements: Array.isArray(s.achievements) ? (s.achievements as any) : [],
    dailyStuck,
  };
}

/* ================================
   NORMALIZE (v1.1)
   - Eksik alanları tamamlar
   - Legacy state görürse migrate eder
================================ */

function normalizeState(s: Partial<AppState> | LegacyState | null | undefined): AppState {
  const base = createEmptyState();

  if (!s) return base;

  // Legacy tespiti: lessons varsa ama classGroups yoksa
  const maybeLegacy = s as LegacyState;
  const maybeV11 = s as Partial<AppState>;

  const isLegacy =
    (maybeLegacy.lessons && Array.isArray(maybeLegacy.lessons)) &&
    (!maybeV11.classGroups || !Array.isArray(maybeV11.classGroups));

  if (isLegacy) {
    return migrateLegacyToV11(maybeLegacy);
  }

  // v1.1 normalize
  const out: AppState = { ...base, ...(maybeV11 as any) };

  out.classGroups = Array.isArray(out.classGroups) ? out.classGroups : base.classGroups;
  out.courses = Array.isArray(out.courses) ? out.courses : [];
  out.scheduleItems = Array.isArray(out.scheduleItems) ? out.scheduleItems : [];
  out.timeSlots = Array.isArray(out.timeSlots) && out.timeSlots.length > 0 ? out.timeSlots : base.timeSlots;

  out.homeworks = Array.isArray(out.homeworks) ? out.homeworks : [];
  out.achievements = Array.isArray(out.achievements) ? out.achievements : [];
  out.dailyStuck = Array.isArray(out.dailyStuck) ? out.dailyStuck : [];

  out.mode = out.mode === "teacher" || out.mode === "student" ? out.mode : undefined;

  // selectedClassGroupId geçerli değilse ilk sınıfa düş
  const cgIds = new Set(out.classGroups.map(cg => cg.id));
  if (!out.selectedClassGroupId || !cgIds.has(out.selectedClassGroupId)) {
    out.selectedClassGroupId = out.classGroups[0]?.id ?? base.selectedClassGroupId;
  }

  // Homeworks: classGroupId yoksa default ver
  out.homeworks = out.homeworks.map(h => ({
    ...h,
    classGroupId: (h as any).classGroupId ?? out.selectedClassGroupId!,
  })) as any;

  // DailyStuck: id ve classGroupId güvene al
  out.dailyStuck = out.dailyStuck.map(d => ({
    ...d,
    id: (d as any).id ?? uid("stuck"),
    classGroupId: (d as any).classGroupId ?? out.selectedClassGroupId!,
  })) as any;

  return out;
}

/* ================================
   PUBLIC API
================================ */

export async function getState(): Promise<AppState> {
  const s = await loadJSON<any>(STORAGE_KEY);
  return normalizeState(s);
}

export async function setState(next: AppState): Promise<void> {
  const normalized = normalizeState(next);
  await saveJSON(STORAGE_KEY, normalized);
}

export async function updateState(updater: (prev: AppState) => AppState): Promise<void> {
  const current = await getState();
  const next = updater(current);
  await setState(next);
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
