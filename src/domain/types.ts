/* =========================
   USER / MODE
========================= */

export type UserMode = "teacher" | "student";

/* =========================
   CORE ENTITIES
========================= */

export type ClassGroup = {
  id: string;         // unique
  label: string;      // "5/A", "7/D"
};

export type CourseType = "lesson" | "dyk" | "private" | "study";

export type Course = {
  id: string;
  classGroupId: string;   // ClassGroup.id
  title: string;          // "Fen Bilimleri"
  type: CourseType;       // lesson/dyk/private/study

  // Haftaya yayılan “sabit not”
  defaultNote?: string;

  // İleride: course'a bağlanacak kazanımlar
  achievementIds?: string[];
};

export type TimeRange = {
  start: string; // "08:30"
  end: string;   // "09:10"
};

export type TimeSlot = {
  slotIndex: number; // 1..N
  start: string;     // "08:30"
  end: string;       // "09:10"
};

export type ScheduleItem = {
  id: string;
  courseId: string;     // Course.id

  dayIndex: number;     // 0=Mon ... 6=Sun
  slotIndex: number;    // 1..N

  // Bazı günler saat değişebilir
  timeOverride?: TimeRange;

  // Sadece o gün/slot özel not
  noteOverride?: string;
};

/* =========================
   HOMEWORK / ACHIEVEMENT
========================= */

export type Homework = {
  id: string;
  classGroupId: string;      // hangi sınıf için
  title: string;
  dueDateISO: string;        // "YYYY-MM-DD"
  createdBy: "teacher";
  isDone: boolean;           // öğrenci işaretler
};

export type Achievement = {
  id: string;
  title: string;             // örn: "Kuvvet ve Hareket / Sürtünme"
  unit?: string;             // opsiyonel: "Kuvvet ve Hareket"
  outcome?: string;          // opsiyonel: "Sürtünme kuvvetini açıklar"
};

export type DailyStuck = {
  id: string;
  dateISO: string;           // "YYYY-MM-DD"
  classGroupId: string;

  // İstersen bağla:
  scheduleItemId?: string;
  courseId?: string;

  achievementId: string;
  note?: string;             // “Bugün şurada kaldık” gibi kısa not
};

/* =========================
   APP STATE (v1.1)
========================= */

export type AppState = {
  mode?: UserMode;

  // Öğretmen tarafı: en son seçili sınıf
  selectedClassGroupId?: string;

  // Program altyapısı
  classGroups: ClassGroup[];
  courses: Course[];
  scheduleItems: ScheduleItem[];

  // Ortak ders saatleri (okulun standart çizelgesi)
  timeSlots: TimeSlot[];

  // Diğer modüller
  homeworks: Homework[];
  achievements: Achievement[];
  dailyStuck: DailyStuck[];
};
