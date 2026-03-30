type LessonType = "normal" | "dyk" | "private";

type LessonCardLike = {
  id: string;
  lessonName?: string;
  shortName?: string;
  grade?: string;
  section?: string;
  weeklyHours?: number;
  type?: LessonType;
};

type ProgramItemLike = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  lessonCardId: string | null;
  note?: string;
};

type HomeworkItemLike = {
  id: string;
  lessonCardId: string;
  date: string;
  title: string;
  note?: string;
};

type AchievementItemLike = {
  id: string;
  lessonCardId: string;
  date: string;
  unit?: string;
  text: string;
};

type AppDataLike = {
  lessonCards?: LessonCardLike[];
  program?: ProgramItemLike[];
  homeworks?: HomeworkItemLike[];
  achievements?: AchievementItemLike[];
};

export type WidgetThemeMode = "dark" | "light";

export type WidgetLesson = {
  id: string;
  order: number;
  orderLabel: string;
  classLabel: string;
  lesson: string;
  startTime: string;
  endTime: string;
  active: boolean;
  isPast: boolean;
  isFuture: boolean;
  note: string;
  lessonType: string;
  lessonCardId: string | null;
  dayKey?: string;
};

export type WidgetDaySummary = {
  dayKey: string;
  dayLabel: string;
  lessons: WidgetLesson[];
};

const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

const SHORT_DAY_LABELS: Record<string, string> = {
  monday: "Pzt",
  tuesday: "Sal",
  wednesday: "Çrş",
  thursday: "Per",
  friday: "Cum",
  saturday: "Cts",
  sunday: "Paz",
};

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function hmToMinutes(value: string) {
  const [h, m] = String(value || "00:00")
    .split(":")
    .map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function getTodayKey() {
  const day = new Date().getDay();
  if (day === 1) return "monday";
  if (day === 2) return "tuesday";
  if (day === 3) return "wednesday";
  if (day === 4) return "thursday";
  if (day === 5) return "friday";
  if (day === 6) return "saturday";
  return "sunday";
}

export function getFormattedDateLabel() {
  const d = new Date();
  const day = d.getDate();
  const month = MONTHS_TR[d.getMonth()];
  const weekDay = DAY_LABELS[getTodayKey()] || "";
  return `${day} ${month} ${weekDay}`;
}

function typeLabel(type?: LessonType) {
  if (type === "dyk") return "DYK";
  if (type === "private") return "ÖZEL";
  return "";
}

function buildLesson(
  item: ProgramItemLike,
  card: LessonCardLike | undefined,
  index: number,
  currentMinutes: number
): WidgetLesson {
  const start = hmToMinutes(item.startTime);
  const end = hmToMinutes(item.endTime);
  const active = currentMinutes >= start && currentMinutes < end;

  return {
    id: item.id,
    order: index + 1,
    orderLabel: `${index + 1}. Ders`,
    classLabel: card ? `${card.grade}/${card.section}` : "-",
    lesson: card ? card.shortName || "DERS" : "BOŞ",
    startTime: item.startTime,
    endTime: item.endTime,
    active,
    isPast: currentMinutes >= end,
    isFuture: currentMinutes < start,
    note: item.note || "",
    lessonType: card ? typeLabel(card.type) : "",
    lessonCardId: card?.id ?? null,
    dayKey: item.day,
  };
}

export function buildWidgetSummary(data: AppDataLike): WidgetLesson[] {
  const current = new Date().getHours() * 60 + new Date().getMinutes();
  const todayKey = getTodayKey();

  return (data.program || [])
    .filter((p) => p.day === todayKey)
    .sort((a, b) => hmToMinutes(a.startTime) - hmToMinutes(b.startTime))
    .map((item, index) => {
      const card = (data.lessonCards || []).find((c) => c.id === item.lessonCardId);
      return buildLesson(item, card, index, current);
    });
}

export function buildCompactWidgetSummary(data: AppDataLike, maxVisible = 8): WidgetLesson[] {
  const full = buildWidgetSummary(data);

  if (full.length <= maxVisible) return full;

  const activeIndex = full.findIndex((item) => item.active);

  if (activeIndex === -1) {
    return full.slice(Math.max(0, full.length - maxVisible), full.length);
  }

  let start = Math.max(0, activeIndex - 1);
  let end = start + maxVisible;

  if (end > full.length) {
    end = full.length;
    start = Math.max(0, end - maxVisible);
  }

  return full.slice(start, end);
}

export function buildWeeklyWidgetSummary(data: AppDataLike): WidgetDaySummary[] {
  const current = new Date().getHours() * 60 + new Date().getMinutes();
  const todayKey = getTodayKey();
  const orderedDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return orderedDays.map((dayKey) => {
    const lessons: WidgetLesson[] = (data.program || [])
      .filter((p) => p.day === dayKey)
      .sort((a, b) => hmToMinutes(a.startTime) - hmToMinutes(b.startTime))
      .map((item, index) => {
        const card = (data.lessonCards || []).find((c) => c.id === item.lessonCardId);

        if (dayKey === todayKey) {
          return buildLesson(item, card, index, current);
        }

        return {
          id: item.id,
          order: index + 1,
          orderLabel: `${index + 1}. Ders`,
          classLabel: card ? `${card.grade}/${card.section}` : "-",
          lesson: card ? card.shortName || "DERS" : "BOŞ",
          startTime: item.startTime,
          endTime: item.endTime,
          active: false,
          isPast: false,
          isFuture: false,
          note: item.note || "",
          lessonType: card ? typeLabel(card.type) : "",
          lessonCardId: card?.id ?? null,
          dayKey,
        };
      });

    return {
      dayKey,
      dayLabel: SHORT_DAY_LABELS[dayKey] || DAY_LABELS[dayKey] || dayKey,
      lessons,
    };
  });
}

export function getActiveLessonDetail(data: AppDataLike): {
  homework: string;
  achievement: string;
  note: string;
} {
  const lessons = buildWidgetSummary(data);
  const active = lessons.find((l) => l.active) ?? lessons[0];

  if (!active) {
    return {
      homework: "Ödev yok",
      achievement: "Kazanım yok",
      note: "",
    };
  }

  const lessonCard = (data.lessonCards || []).find((c) => c.id === active.lessonCardId);
  const homework = (data.homeworks || []).find((h) => h.lessonCardId === lessonCard?.id);
  const achievement = (data.achievements || []).find((a) => a.lessonCardId === lessonCard?.id);
  const programRow = (data.program || []).find((p) => p.id === active.id);

  return {
    homework: homework?.title || "Ödev yok",
    achievement: achievement?.text || "Kazanım yok",
    note: programRow?.note || "",
  };
}

function hashString(value: string) {
  let hash = 0;
  const input = value || "empty";

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp >= 1 && hp < 2) {
    r = x;
    g = c;
  } else if (hp >= 2 && hp < 3) {
    g = c;
    b = x;
  } else if (hp >= 3 && hp < 4) {
    g = x;
    b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const WIDGET_HUES = [192, 206, 222, 244, 158, 34];

export function getWidgetSurface(mode: WidgetThemeMode) {
  if (mode === "light") {
    return {
      rootBg: "#F4F7FA",
      rootBorder: "#D9E4EC",
      cardBg: "#FFFFFF",
      cardBorder: "#BCC9D5",
      text: "#0F172A",
      sub: "#64748B",
    };
  }

  return {
    rootBg: "#0A1220",
    rootBorder: "#243448",
    cardBg: "#121B2A",
    cardBorder: "#334155",
    text: "#E8EEF5",
    sub: "#8CA0B3",
  };
}

export function getLessonColors(
  lessonCardId: string | null,
  active: boolean,
  isEmptyLesson: boolean,
  mode: WidgetThemeMode
) {
  if (isEmptyLesson) {
    if (mode === "light") {
      return active
        ? {
            bg: "#DFF6FF",
            border: "#0891B2",
            text: "#0F172A",
            sub: "#0F766E",
            glow: "#22C7D6",
          }
        : {
            bg: "#FFFFFF",
            border: "#CBD5E1",
            text: "#334155",
            sub: "#64748B",
            glow: "#94A3B8",
          };
    }

    return active
      ? {
          bg: "#223246",
          border: "#38BDF8",
          text: "#F8FAFC",
          sub: "#D3E0EA",
          glow: "#67E8F9",
        }
      : {
          bg: "#121A27",
          border: "#334155",
          text: "#CBD5E1",
          sub: "#94A3B8",
          glow: "#64748B",
        };
  }

  const seed = hashString(lessonCardId || "default");
  const hue = WIDGET_HUES[seed % WIDGET_HUES.length];
  const offset = (seed % 5) - 2;

  if (mode === "light") {
    if (active) {
      return {
        bg: hslToHex(hue + offset, 70, 86),
        border: hslToHex(hue, 82, 42),
        text: "#0F172A",
        sub: hslToHex(hue, 42, 34),
        glow: hslToHex(hue, 90, 54),
      };
    }

    return {
      bg: hslToHex(hue + offset, 54, 95),
      border: hslToHex(hue, 32, 74),
      text: "#1E293B",
      sub: hslToHex(hue, 18, 42),
      glow: hslToHex(hue, 52, 58),
    };
  }

  if (active) {
    return {
      bg: hslToHex(hue + offset, 62, 26),
      border: hslToHex(hue, 86, 66),
      text: "#F8FAFC",
      sub: hslToHex(hue, 48, 84),
      glow: hslToHex(hue, 92, 72),
    };
  }

  return {
    bg: hslToHex(hue + offset, 24, 18),
    border: hslToHex(hue, 24, 34),
    text: hslToHex(hue, 36, 88),
    sub: hslToHex(hue, 12, 72),
    glow: hslToHex(hue, 52, 58),
  };
}

export function getTypeAccent(typeLabelValue: string) {
  if (typeLabelValue === "DYK") return "#F59E0B";
  if (typeLabelValue === "ÖZEL") return "#A855F7";
  return "#38BDF8";
}