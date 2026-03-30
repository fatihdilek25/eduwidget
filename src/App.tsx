import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { requestWidgetUpdate } from "react-native-android-widget";

import SimpleWidget from "./widget/SimpleWidget";
import DetailWidget from "./widget/DetailWidget";
import WeeklyWidget from "./widget/WeeklyWidget";
import {
  buildCompactWidgetSummary,
  buildWeeklyWidgetSummary,
  getActiveLessonDetail,
} from "./widget/widgetData";

type TabKey = "today" | "program" | "homework" | "achievement" | "settings";
type FontSizeMode = "small" | "medium" | "large";
type ThemeMode = "dark" | "light";
type LessonType = "normal" | "dyk" | "private";

type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type LessonCard = {
  id: string;
  lessonName: string;
  shortName: string;
  grade: string;
  section: string;
  weeklyHours: number;
  type: LessonType;
};

type ProgramItem = {
  id: string;
  day: Weekday;
  startTime: string;
  endTime: string;
  lessonCardId: string | null;
  note: string;
};

type HomeworkItem = {
  id: string;
  lessonCardId: string;
  date: string;
  title: string;
  note: string;
};

type AchievementItem = {
  id: string;
  lessonCardId: string;
  date: string;
  unit: string;
  text: string;
};

type AppData = {
  lessonCards: LessonCard[];
  program: ProgramItem[];
  homeworks: HomeworkItem[];
  achievements: AchievementItem[];
};

type AppSettings = {
  fontSize: FontSizeMode;
  themeMode: ThemeMode;
};

type AchievementCatalogItem = {
  id: string;
  unit: string;
  text: string;
};

type AchievementCatalog = {
  [grade: string]: {
    [lessonShortName: string]: AchievementCatalogItem[];
  };
};

type ThemeColors = {
  mode: ThemeMode;
  bg: string;
  card: string;
  card2: string;
  border: string;
  borderSoft: string;
  text: string;
  textSoft: string;
  muted: string;
  inputBg: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  danger: string;
  dangerBorder: string;
  overlay: string;
  white: string;
  success: string;
  warning: string;
  info: string;
  iconSurface: string;
};

const STORAGE_KEY = "eduwidget_v6_data";
const SETTINGS_KEY = "eduwidget_v6_settings";

const FONT_SCALE: Record<FontSizeMode, number> = {
  small: 0.88,
  medium: 1,
  large: 1.14,
};

const weekDays: { key: Weekday; label: string }[] = [
  { key: "monday", label: "Pazartesi" },
  { key: "tuesday", label: "Salı" },
  { key: "wednesday", label: "Çarşamba" },
  { key: "thursday", label: "Perşembe" },
  { key: "friday", label: "Cuma" },
  { key: "saturday", label: "Cumartesi" },
  { key: "sunday", label: "Pazar" },
];

const tabs: { key: TabKey; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "program", label: "Program" },
  { key: "homework", label: "Ödev" },
  { key: "achievement", label: "Kazanım" },
  { key: "settings", label: "Ayarlar" },
];

const initialData: AppData = {
  lessonCards: [],
  program: [],
  homeworks: [],
  achievements: [],
};

const initialSettings: AppSettings = {
  fontSize: "medium",
  themeMode: "dark",
};

const achievementCatalogSeed: AchievementCatalog = {
  "5": {
    FEN: [
      { id: "5_fen_1", unit: "Canlılar", text: "Canlıların temel özelliklerini açıklar." },
      { id: "5_fen_2", unit: "Madde", text: "Maddenin ayırt edici özelliklerini açıklar." },
    ],
    BİLŞ: [
      { id: "5_bils_1", unit: "Dijital Okuryazarlık", text: "Dijital araçları güvenli kullanır." },
    ],
  },
  "6": {
    BİLŞ: [
      { id: "6_bils_1", unit: "Bilgisayar Sistemleri", text: "Temel bilgisayar bileşenlerini tanır." },
    ],
  },
  "7": {
    FEN: [
      { id: "7_fen_1", unit: "Kuvvet ve Enerji", text: "Kuvvet, iş ve enerji arasındaki ilişkiyi açıklar." },
      { id: "7_fen_2", unit: "Güneş Sistemi", text: "Güneş sistemi elemanlarını karşılaştırır." },
    ],
  },
  "8": {
    FEN: [
      { id: "8_fen_1", unit: "Mevsimler", text: "Mevsimlerin oluşumunu açıklar." },
      { id: "8_fen_2", unit: "Basınç", text: "Katı, sıvı ve gaz basıncını karşılaştırır." },
    ],
  },
  DYK: {
    DYK: [
      { id: "dyk_1", unit: "Destekleme", text: "Destekleme ve yetiştirme çalışmalarına düzenli katılır." },
    ],
  },
  OZL: {
    OZL: [
      { id: "ozl_1", unit: "Bireysel Çalışma", text: "Bireysel öğrenme ihtiyacına uygun çalışma yürütür." },
    ],
  },
};

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayWeekday(): Weekday {
  const day = new Date().getDay();
  if (day === 1) return "monday";
  if (day === 2) return "tuesday";
  if (day === 3) return "wednesday";
  if (day === 4) return "thursday";
  if (day === 5) return "friday";
  if (day === 6) return "saturday";
  return "sunday";
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function isCurrentLesson(item: ProgramItem) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(item.startTime);
  const end = timeToMinutes(item.endTime);
  return current >= start && current < end;
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function getLessonTypeLabel(type: LessonType) {
  if (type === "dyk") return "DYK";
  if (type === "private") return "Özel";
  return "Normal";
}

function getLessonTypeBadgeColor(type: LessonType) {
  if (type === "dyk") return "#D97706";
  if (type === "private") return "#7C3AED";
  return "#0891B2";
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

const APP_HUES = [192, 206, 222, 244, 158, 34];

function getLessonCardColors(cardId: string, active = false) {
  const seed = hashString(cardId);
  const hue = APP_HUES[seed % APP_HUES.length];
  const offset = (seed % 5) - 2;

  if (active) {
    return {
      bg: hslToHex(hue + offset, 62, 26),
      border: hslToHex(hue, 86, 66),
      soft: hslToHex(hue, 42, 20),
      text: "#F8FAFC",
      subText: hslToHex(hue, 48, 84),
      glow: hslToHex(hue, 92, 72),
    };
  }

  return {
    bg: hslToHex(hue + offset, 24, 18),
    border: hslToHex(hue, 24, 34),
    soft: hslToHex(hue, 20, 14),
    text: hslToHex(hue, 36, 88),
    subText: hslToHex(hue, 12, 72),
    glow: hslToHex(hue, 52, 58),
  };
}

function getEmptySlotColors(active = false) {
  if (active) {
    return {
      bg: "#223246",
      border: "#38BDF8",
      soft: "#162235",
      text: "#F8FAFC",
      subText: "#D3E0EA",
      glow: "#67E8F9",
    };
  }

  return {
    bg: "#121A27",
    border: "#334155",
    soft: "#0F172A",
    text: "#CBD5E1",
    subText: "#94A3B8",
    glow: "#64748B",
  };
}

function getThemeColors(mode: ThemeMode): ThemeColors {
  if (mode === "light") {
    return {
      mode,
      bg: "#F4F7FA",
      card: "#FFFFFF",
      card2: "#F8FBFD",
      border: "#D9E4EC",
      borderSoft: "#BCC9D5",
      text: "#0F172A",
      textSoft: "#334155",
      muted: "#64748B",
      inputBg: "#FFFFFF",
      primary: "#14B8C4",
      primaryDark: "#0F94A3",
      secondary: "#EAF2F7",
      danger: "#FEE2E2",
      dangerBorder: "#EF4444",
      overlay: "rgba(15, 23, 42, 0.35)",
      white: "#FFFFFF",
      success: "#059669",
      warning: "#D97706",
      info: "#0284C7",
      iconSurface: "#EEF4F8",
    };
  }

  return {
    mode,
    bg: "#0A1220",
    card: "#121B2A",
    card2: "#0F1724",
    border: "#243448",
    borderSoft: "#334B63",
    text: "#E8EEF5",
    textSoft: "#C5D1DE",
    muted: "#8CA0B3",
    inputBg: "#0E1623",
    primary: "#22C7D6",
    primaryDark: "#1297A7",
    secondary: "#172334",
    danger: "#7F1D1D",
    dangerBorder: "#B91C1C",
    overlay: "rgba(2, 6, 23, 0.82)",
    white: "#FFFFFF",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#38BDF8",
    iconSurface: "#162235",
  };
}

function createStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor: COLORS.bg,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    headerTitle: {
      color: COLORS.text,
      fontWeight: "800",
    },
    headerSubTitle: {
      color: COLORS.muted,
      marginTop: 2,
    },
    topTabWrap: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      backgroundColor: COLORS.bg,
    },
    topTabRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    topTabButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      marginRight: 8,
    },
    topTabButtonActive: {
      backgroundColor: COLORS.primaryDark,
      borderColor: COLORS.primary,
    },
    topTabButtonText: {
      color: COLORS.textSoft,
      fontWeight: "700",
    },
    topTabButtonTextActive: {
      color: COLORS.white,
    },
    body: {
      flex: 1,
    },
    content: {
      padding: 14,
      paddingBottom: 28,
      gap: 12,
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 14,
      marginBottom: 12,
    },
    cardTitle: {
      color: COLORS.text,
      fontWeight: "800",
      marginBottom: 12,
    },
    bigText: {
      color: COLORS.text,
      fontWeight: "800",
    },
    mutedText: {
      color: COLORS.muted,
    },
    label: {
      color: COLORS.textSoft,
      fontWeight: "700",
      marginBottom: 6,
      marginTop: 8,
    },
    input: {
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      backgroundColor: COLORS.inputBg,
      color: COLORS.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
    button: {
      minHeight: 46,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
      marginTop: 10,
    },
    primaryButton: {
      backgroundColor: COLORS.primaryDark,
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    primaryButtonText: {
      color: COLORS.white,
      fontWeight: "800",
    },
    secondaryButton: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
    },
    secondaryButtonText: {
      color: COLORS.text,
      fontWeight: "700",
    },
    dangerButton: {
      backgroundColor: COLORS.danger,
      borderWidth: 1,
      borderColor: COLORS.dangerBorder,
    },
    dangerButtonText: {
      color: COLORS.mode === "light" ? "#991B1B" : COLORS.white,
      fontWeight: "800",
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    listItem: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
    },
    thinCard: {
      paddingVertical: 12,
    },
    slimListItem: {
      paddingVertical: 10,
    },
    activeListItem: {
      borderWidth: 2,
      shadowOpacity: 0.45,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
    },
    rowTitle: {
      color: COLORS.text,
      fontWeight: "800",
    },
    rowSub: {
      color: COLORS.textSoft,
      marginTop: 3,
    },
    typeBadge: {
      minWidth: 58,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    typeBadgeText: {
      color: COLORS.white,
      fontWeight: "800",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 10,
    },
    actionIconButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: COLORS.iconSurface,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    actionIconText: {
      fontSize: 15,
    },
    dayRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    dayButton: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginRight: 8,
      marginBottom: 8,
    },
    dayButtonActive: {
      backgroundColor: COLORS.primaryDark,
      borderColor: COLORS.primary,
    },
    dayButtonText: {
      color: COLORS.textSoft,
      fontWeight: "700",
    },
    dayButtonTextActive: {
      color: COLORS.white,
    },
    iconActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginLeft: 8,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: COLORS.iconSurface,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    iconText: {
      fontSize: 14,
    },
    cardPickerRow: {
      flexDirection: "row",
      paddingVertical: 4,
    },
    cardPickerButton: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginRight: 8,
    },
    cardPickerButtonActive: {
      transform: [{ scale: 1.02 }],
    },
    cardPickerText: {
      fontWeight: "700",
    },
    cardPickerTextActive: {
      color: COLORS.white,
    },
    achievementOption: {
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      borderRadius: 14,
      padding: 12,
      marginTop: 10,
    },
    achievementOptionActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.mode === "light" ? "#E4F8FB" : "#0E2B35",
    },
    achievementOptionUnit: {
      color: COLORS.mode === "light" ? "#0F766E" : "#67E8F9",
      fontWeight: "800",
      marginBottom: 4,
    },
    achievementOptionText: {
      color: COLORS.text,
      lineHeight: 19,
    },
    achievementOptionTextActive: {
      color: COLORS.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: COLORS.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 22,
      maxHeight: "90%",
    },
    modalTitle: {
      color: COLORS.text,
      fontWeight: "800",
      marginBottom: 8,
    },
    modalListItem: {
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    fullCardOption: {
      opacity: 0.55,
    },
    copyOption: {
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 8,
    },
    copyOptionDisabled: {
      opacity: 0.45,
    },
    copyOptionActive: {
      backgroundColor: COLORS.primaryDark,
      borderColor: COLORS.primary,
    },
    copyOptionText: {
      color: COLORS.text,
      fontWeight: "700",
    },
    copyOptionTextActive: {
      color: COLORS.white,
    },
    coloredPanel: {
      borderWidth: 2,
      borderRadius: 16,
      padding: 12,
      shadowOpacity: 0.5,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
    forceBrightText: {
      color: COLORS.white,
    },
    detailBlock: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card2,
      padding: 12,
      marginBottom: 10,
    },
    sectionTitle: {
      color: COLORS.text,
      fontWeight: "800",
      marginBottom: 8,
    },
    miniInfoRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 4,
    },
    miniChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: COLORS.borderSoft,
      backgroundColor: COLORS.secondary,
    },
    miniChipText: {
      color: COLORS.textSoft,
      fontWeight: "700",
    },
  });
}

type AppStyles = ReturnType<typeof createStyles>;
type FsFn = (base: number) => { fontSize: number };

type AppModalProps = {
  visible: boolean;
  children: React.ReactNode;
};

function AppModal({ visible, children }: AppModalProps) {
  if (!visible) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 1000,
          elevation: 1000,
        },
      ]}
      pointerEvents="box-none"
    >
      {children}
    </View>
  );
}


function ModalShell({
  children,
  styles,
}: {
  children: React.ReactNode;
  styles: AppStyles;
}) {
  return (
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ width: "100%" }}
      >
        <View style={styles.modalCard}>{children}</View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Card({
  title,
  children,
  styles,
  fs,
}: {
  title: string;
  children: React.ReactNode;
  styles: AppStyles;
  fs: FsFn;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardTitle, fs(16)]}>{title}</Text>
      {children}
    </View>
  );
}

function Label({
  text,
  styles,
  fs,
}: {
  text: string;
  styles: AppStyles;
  fs: FsFn;
}) {
  return <Text style={[styles.label, fs(13)]}>{text}</Text>;
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  multiline,
  styles,
  fs,
  mutedColor,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  maxLength?: number;
  multiline?: boolean;
  styles: AppStyles;
  fs: FsFn;
  mutedColor: string;
}) {
  return (
    <TextInput
      style={[
        styles.input,
        fs(14),
        multiline ? { minHeight: 88, textAlignVertical: "top" } : null,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={mutedColor}
      maxLength={maxLength}
      multiline={multiline}
    />
  );
}

function PrimaryButton({
  title,
  onPress,
  styles,
  fs,
}: {
  title: string;
  onPress: () => void;
  styles: AppStyles;
  fs: FsFn;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.button, styles.primaryButton]}>
      <Text style={[styles.primaryButtonText, fs(14)]}>{title}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  title,
  onPress,
  styles,
  fs,
}: {
  title: string;
  onPress: () => void;
  styles: AppStyles;
  fs: FsFn;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.button, styles.secondaryButton]}>
      <Text style={[styles.secondaryButtonText, fs(14)]}>{title}</Text>
    </Pressable>
  );
}

function DangerButton({
  title,
  onPress,
  styles,
  fs,
}: {
  title: string;
  onPress: () => void;
  styles: AppStyles;
  fs: FsFn;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.button, styles.dangerButton]}>
      <Text style={[styles.dangerButtonText, fs(14)]}>{title}</Text>
    </Pressable>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("today");
  const [data, setData] = useState<AppData>(initialData);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedDay, setSelectedDay] = useState<Weekday>("monday");
  const [pickerProgramId, setPickerProgramId] = useState<string | null>(null);
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [showLessonDetailModal, setShowLessonDetailModal] = useState(false);
  const [selectedLessonProgramId, setSelectedLessonProgramId] = useState<string | null>(null);

  const [cardForm, setCardForm] = useState({
    lessonName: "",
    shortName: "",
    grade: "7",
    section: "A",
    weeklyHours: "1",
    type: "normal" as LessonType,
  });

  const [editCardForm, setEditCardForm] = useState({
    lessonName: "",
    shortName: "",
    grade: "",
    section: "",
    weeklyHours: "",
    type: "normal" as LessonType,
  });

  const [programForm, setProgramForm] = useState({
    startTime: "08:20",
    endTime: "09:00",
    note: "",
  });

  const [editProgramForm, setEditProgramForm] = useState({
    startTime: "",
    endTime: "",
    note: "",
  });

  const [homeworkForm, setHomeworkForm] = useState({
    lessonCardId: "",
    date: getTodayDateString(),
    title: "",
    note: "",
  });

  const [achievementForm, setAchievementForm] = useState({
    lessonCardId: "",
    date: getTodayDateString(),
    unit: "",
    text: "",
  });

  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);

  const [detailNote, setDetailNote] = useState("");
  const [detailHomeworkTitle, setDetailHomeworkTitle] = useState("");
  const [detailHomeworkNote, setDetailHomeworkNote] = useState("");
  const [detailAchievementUnit, setDetailAchievementUnit] = useState("");
  const [detailAchievementText, setDetailAchievementText] = useState("");

  const [copyTargets, setCopyTargets] = useState<Record<Weekday, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });

  const COLORS = useMemo(() => getThemeColors(settings.themeMode), [settings.themeMode]);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const deepLinkHandledRef = useRef(false);
  const lastWidgetDateRef = useRef(getTodayDateString());
  const lastWidgetSignatureRef = useRef("");
  const widgetTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayDay = getTodayWeekday();

  const todayLessons = useMemo(() => {
    return [...data.program]
      .filter((item) => item.day === todayDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [data.program, todayDay]);

  const selectedDayLessons = useMemo(() => {
    return [...data.program]
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [data.program, selectedDay]);

  const selectedProgram = useMemo(
    () => data.program.find((p) => p.id === selectedLessonProgramId) ?? null,
    [data.program, selectedLessonProgramId]
  );

  const selectedProgramCard = useMemo(
    () => (selectedProgram ? getCardById(selectedProgram.lessonCardId) : null),
    [selectedProgram, data.lessonCards]
  );

  const selectedCardAchievements = useMemo(() => {
    if (!selectedProgramCard) return [];
    return getAchievementsByCard(selectedProgramCard);
  }, [selectedProgramCard, data.lessonCards]);

  const selectedAchievementOptions = useMemo(() => {
    const card = getCardById(achievementForm.lessonCardId);
    return getAchievementsByCard(card);
  }, [achievementForm.lessonCardId, data.lessonCards]);

  async function refreshWidgets() {
    try {
      const lessons = buildCompactWidgetSummary(data, 8);
      const weekly = buildWeeklyWidgetSummary(data);
      const detail = getActiveLessonDetail(data);
      const mode = settings.themeMode === "light" ? "light" : "dark";

      await requestWidgetUpdate({
        widgetName: "SimpleWidget",
        renderWidget: () => <SimpleWidget lessons={lessons} mode={mode} />,
      });

      await requestWidgetUpdate({
        widgetName: "DetailWidget",
        renderWidget: () => <DetailWidget lessons={lessons} detail={detail} mode={mode} />,
      });

      await requestWidgetUpdate({
        widgetName: "WeeklyWidget",
        renderWidget: () => <WeeklyWidget weekly={weekly} mode={mode} />,
      });
    } catch (error) {
      console.log("Widget refresh error:", error);
    }
  }
function getNextLesson(items: ProgramItem[]) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  return (
    items
      .filter((item) => timeToMinutes(item.startTime) > current)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] ?? null
  );
}

function buildWidgetRefreshSignature() {
  const today = getTodayDateString();
  const activeLesson = todayLessons.find(isCurrentLesson) ?? null;
  const nextLesson = getNextLesson(todayLessons);
  const detail = getActiveLessonDetail(data);

  return JSON.stringify({
  today,
  activeId: activeLesson?.id ?? "none",
  activeStart: activeLesson?.startTime ?? "",
  activeEnd: activeLesson?.endTime ?? "",
  nextId: nextLesson?.id ?? "none",
  nextStart: nextLesson?.startTime ?? "",
  nextEnd: nextLesson?.endTime ?? "",
  detailHomework: detail?.homework ?? "",
  detailAchievement: detail?.achievement ?? "",
  detailNote: detail?.note ?? "",
  themeMode: settings.themeMode,
  programSize: data.program.length,
  homeworkSize: data.homeworks.length,
  achievementSize: data.achievements.length,
});
}

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveAll();
  }, [data, settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      refreshWidgets();
    }, 250);

    return () => clearTimeout(timer);
  }, [data, settings.themeMode, isLoaded]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleIncomingUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url && !deepLinkHandledRef.current) {
        deepLinkHandledRef.current = true;
        handleIncomingUrl(url);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!pendingProgramId) return;

    const exists = data.program.find((p) => p.id === pendingProgramId);
    if (!exists) return;

    setTab("today");
    setSelectedLessonProgramId(pendingProgramId);
    setShowLessonDetailModal(true);
    setPendingProgramId(null);
  }, [pendingProgramId, isLoaded, data.program]);

  useEffect(() => {
    const selected = data.program.find((p) => p.id === selectedLessonProgramId);
    if (!selected) return;

    setDetailNote(selected.note || "");

    const hw = data.homeworks.find((h) => h.lessonCardId === selected.lessonCardId);
    setDetailHomeworkTitle(hw?.title || "");
    setDetailHomeworkNote(hw?.note || "");

    const ach = data.achievements.find((a) => a.lessonCardId === selected.lessonCardId);
    setDetailAchievementUnit(ach?.unit || "");
    setDetailAchievementText(ach?.text || "");
  }, [selectedLessonProgramId, data.program, data.homeworks, data.achievements]);

  function fs(base: number) {
    return { fontSize: base * FONT_SCALE[settings.fontSize] };
  }

  async function loadAll() {
    try {
      const rawData = await AsyncStorage.getItem(STORAGE_KEY);
      const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);

      if (rawData) setData(JSON.parse(rawData));

      if (rawSettings) {
        const parsedSettings = JSON.parse(rawSettings);
        setSettings({
          fontSize: parsedSettings.fontSize ?? "medium",
          themeMode: parsedSettings.themeMode ?? "dark",
        });
      }
    } catch {
      Alert.alert("Hata", "Kayıtlı veriler okunamadı.");
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveAll() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      Alert.alert("Hata", "Veriler kaydedilemedi.");
    }
  }

  function handleIncomingUrl(url: string) {
    const match = url.match(/eduwidget:\/\/lesson\/(.+)$/);
    if (!match) return;
    const programId = decodeURIComponent(match[1] || "");
    setPendingProgramId(programId);
  }

  function getCardById(id: string | null) {
    if (!id) return null;
    return data.lessonCards.find((item) => item.id === id) ?? null;
  }

  function getUsedCount(cardId: string) {
    return data.program.filter((item) => item.lessonCardId === cardId).length;
  }

  function getRemainingCount(card: LessonCard) {
    return Math.max(0, card.weeklyHours - getUsedCount(card.id));
  }

  function getAchievementsByCard(card: LessonCard | null): AchievementCatalogItem[] {
    if (!card) return [];
    if (card.type === "dyk") return achievementCatalogSeed.DYK?.DYK ?? [];
    if (card.type === "private") return achievementCatalogSeed.OZL?.OZL ?? [];
    return achievementCatalogSeed[card.grade]?.[card.shortName] ?? [];
  }

  function getProgramItemColors(item: ProgramItem) {
    const card = getCardById(item.lessonCardId);
    const active = isCurrentLesson(item);
    if (!card) return getEmptySlotColors(active);
    return getLessonCardColors(card.id, active);
  }

  function addLessonCard() {
    if (!cardForm.lessonName.trim() || !cardForm.shortName.trim()) {
      Alert.alert("Eksik bilgi", "Ders adı ve kısaltma zorunludur.");
      return;
    }

    const newCard: LessonCard = {
      id: generateId("card"),
      lessonName: cardForm.lessonName.trim(),
      shortName: cardForm.shortName.trim().toUpperCase(),
      grade: cardForm.grade.trim(),
      section: cardForm.section.trim().toUpperCase(),
      weeklyHours: Number(cardForm.weeklyHours) || 1,
      type: cardForm.type,
    };

    setData((prev) => ({
      ...prev,
      lessonCards: [...prev.lessonCards, newCard],
    }));

    setCardForm({
      lessonName: "",
      shortName: "",
      grade: "7",
      section: "A",
      weeklyHours: "1",
      type: "normal",
    });

    setShowCardModal(false);
  }

  function openEditLessonCard(card: LessonCard) {
    setEditingCardId(card.id);
    setEditCardForm({
      lessonName: card.lessonName,
      shortName: card.shortName,
      grade: card.grade,
      section: card.section,
      weeklyHours: String(card.weeklyHours),
      type: card.type,
    });
    setShowEditCardModal(true);
  }

  function saveEditedLessonCard() {
    if (!editingCardId) return;
    if (!editCardForm.lessonName.trim() || !editCardForm.shortName.trim()) {
      Alert.alert("Eksik bilgi", "Ders adı ve kısaltma zorunludur.");
      return;
    }

    setData((prev) => ({
      ...prev,
      lessonCards: prev.lessonCards.map((card) =>
        card.id === editingCardId
          ? {
            ...card,
            lessonName: editCardForm.lessonName.trim(),
            shortName: editCardForm.shortName.trim().toUpperCase(),
            grade: editCardForm.grade.trim(),
            section: editCardForm.section.trim().toUpperCase(),
            weeklyHours: Number(editCardForm.weeklyHours) || 1,
            type: editCardForm.type,
          }
          : card
      ),
    }));

    setShowEditCardModal(false);
    setEditingCardId(null);
  }

  function deleteLessonCard(id: string) {
    Alert.alert("Kart sil", "Bu ders kartı silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          setData((prev) => ({
            ...prev,
            lessonCards: prev.lessonCards.filter((item) => item.id !== id),
            program: prev.program.map((item) =>
              item.lessonCardId === id ? { ...item, lessonCardId: null } : item
            ),
            homeworks: prev.homeworks.filter((item) => item.lessonCardId !== id),
            achievements: prev.achievements.filter((item) => item.lessonCardId !== id),
          }));
        },
      },
    ]);
  }

  function deleteHomework(id: string) {
    setData((prev) => ({
      ...prev,
      homeworks: prev.homeworks.filter((item) => item.id !== id),
    }));
  }

  function deleteAchievement(id: string) {
    setData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((item) => item.id !== id),
    }));
  }

  function startEditHomework(item: HomeworkItem) {
    setHomeworkForm({
      lessonCardId: item.lessonCardId,
      date: item.date,
      title: item.title,
      note: item.note ?? "",
    });
    setEditingHomeworkId(item.id);
    setTab("homework");
  }

  function saveHomework() {
    if (!homeworkForm.lessonCardId || !homeworkForm.title.trim()) {
      Alert.alert("Eksik bilgi", "Ders kartı ve ödev başlığı zorunludur.");
      return;
    }

    if (editingHomeworkId) {
      setData((prev) => ({
        ...prev,
        homeworks: prev.homeworks.map((item) =>
          item.id === editingHomeworkId
            ? {
              ...item,
              lessonCardId: homeworkForm.lessonCardId,
              date: homeworkForm.date,
              title: homeworkForm.title.trim(),
              note: homeworkForm.note.trim(),
            }
            : item
        ),
      }));
    } else {
      const newHomework: HomeworkItem = {
        id: generateId("hw"),
        lessonCardId: homeworkForm.lessonCardId,
        date: homeworkForm.date,
        title: homeworkForm.title.trim(),
        note: homeworkForm.note.trim(),
      };

      setData((prev) => ({
        ...prev,
        homeworks: [newHomework, ...prev.homeworks],
      }));
    }

    setHomeworkForm({
      lessonCardId: "",
      date: getTodayDateString(),
      title: "",
      note: "",
    });
    setEditingHomeworkId(null);
  }

  function cancelEditHomework() {
    setHomeworkForm({
      lessonCardId: "",
      date: getTodayDateString(),
      title: "",
      note: "",
    });
    setEditingHomeworkId(null);
  }

  function startEditAchievement(item: AchievementItem) {
    setAchievementForm({
      lessonCardId: item.lessonCardId,
      date: item.date,
      unit: item.unit ?? "",
      text: item.text,
    });
    setEditingAchievementId(item.id);
    setTab("achievement");
  }

  function saveAchievement() {
    if (!achievementForm.lessonCardId || !achievementForm.text.trim()) {
      Alert.alert("Eksik bilgi", "Ders kartı ve kazanım seçimi zorunludur.");
      return;
    }

    if (editingAchievementId) {
      setData((prev) => ({
        ...prev,
        achievements: prev.achievements.map((item) =>
          item.id === editingAchievementId
            ? {
              ...item,
              lessonCardId: achievementForm.lessonCardId,
              date: achievementForm.date,
              unit: achievementForm.unit,
              text: achievementForm.text,
            }
            : item
        ),
      }));
    } else {
      const newItem: AchievementItem = {
        id: generateId("ach"),
        lessonCardId: achievementForm.lessonCardId,
        date: achievementForm.date,
        unit: achievementForm.unit,
        text: achievementForm.text,
      };

      setData((prev) => ({
        ...prev,
        achievements: [newItem, ...prev.achievements],
      }));
    }

    setAchievementForm({
      lessonCardId: "",
      date: getTodayDateString(),
      unit: "",
      text: "",
    });
    setEditingAchievementId(null);
  }

  function cancelEditAchievement() {
    setAchievementForm({
      lessonCardId: "",
      date: getTodayDateString(),
      unit: "",
      text: "",
    });
    setEditingAchievementId(null);
  }

  function addProgramItem() {
    if (!programForm.startTime.trim() || !programForm.endTime.trim()) {
      Alert.alert("Eksik bilgi", "Başlangıç ve bitiş saati zorunludur.");
      return;
    }

    const newItem: ProgramItem = {
      id: generateId("program"),
      day: selectedDay,
      startTime: programForm.startTime,
      endTime: programForm.endTime,
      lessonCardId: null,
      note: programForm.note,
    };

    setData((prev) => ({
      ...prev,
      program: [...prev.program, newItem],
    }));

    setProgramForm({
      startTime: "08:20",
      endTime: "09:00",
      note: "",
    });

    setShowProgramModal(false);
  }

  function openEditProgramItem(item: ProgramItem) {
    setEditingProgramId(item.id);
    setEditProgramForm({
      startTime: item.startTime,
      endTime: item.endTime,
      note: item.note,
    });
  }

  function saveEditedProgramItem() {
    if (!editingProgramId) return;

    setData((prev) => ({
      ...prev,
      program: prev.program.map((item) =>
        item.id === editingProgramId
          ? {
            ...item,
            startTime: editProgramForm.startTime,
            endTime: editProgramForm.endTime,
            note: editProgramForm.note,
          }
          : item
      ),
    }));

    setEditingProgramId(null);
  }

  function deleteProgramItem(id: string) {
    setData((prev) => ({
      ...prev,
      program: prev.program.filter((item) => item.id !== id),
    }));
  }

  function assignCardToProgram(programId: string, lessonCardId: string | null) {
    const currentProgram = data.program.find((item) => item.id === programId);
    if (!currentProgram) return;

    if (!lessonCardId) {
      setData((prev) => ({
        ...prev,
        program: prev.program.map((item) =>
          item.id === programId ? { ...item, lessonCardId: null } : item
        ),
      }));
      setPickerProgramId(null);
      return;
    }

    const selectedCard = data.lessonCards.find((item) => item.id === lessonCardId);
    if (!selectedCard) return;

    const currentSame = currentProgram.lessonCardId === lessonCardId;
    const remaining = getRemainingCount(selectedCard);

    if (!currentSame && remaining <= 0) {
      Alert.alert(
        "Saat sınırı doldu",
        `${selectedCard.lessonName} ${selectedCard.grade}/${selectedCard.section} için kalan ders saati yok.`
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      program: prev.program.map((item) =>
        item.id === programId ? { ...item, lessonCardId } : item
      ),
    }));

    setPickerProgramId(null);
  }

  function openLessonDetail(programId: string) {
    setSelectedLessonProgramId(programId);
    setShowLessonDetailModal(true);
  }

  function saveLessonDetailAll() {
    if (!selectedProgram) return;
    const lessonCardId = selectedProgram.lessonCardId;

    if (!lessonCardId) {
      Alert.alert("Ders yok", "Bu satıra henüz ders kartı atanmadı.");
      return;
    }

    setData((prev) => {
      const updatedProgram = prev.program.map((item) =>
        item.id === selectedProgram.id ? { ...item, note: detailNote.trim() } : item
      );

      let updatedHomeworks = [...prev.homeworks];
      const existingHwIndex = updatedHomeworks.findIndex((h) => h.lessonCardId === lessonCardId);

      if (detailHomeworkTitle.trim()) {
        const hwItem: HomeworkItem = {
          id: existingHwIndex >= 0 ? updatedHomeworks[existingHwIndex].id : generateId("hw"),
          lessonCardId,
          date: getTodayDateString(),
          title: detailHomeworkTitle.trim(),
          note: detailHomeworkNote.trim(),
        };

        if (existingHwIndex >= 0) updatedHomeworks[existingHwIndex] = hwItem;
        else updatedHomeworks = [hwItem, ...updatedHomeworks];
      }

      let updatedAchievements = [...prev.achievements];
      const existingAchIndex = updatedAchievements.findIndex((a) => a.lessonCardId === lessonCardId);

      if (detailAchievementText.trim()) {
        const achItem: AchievementItem = {
          id: existingAchIndex >= 0 ? updatedAchievements[existingAchIndex].id : generateId("ach"),
          lessonCardId,
          date: getTodayDateString(),
          unit: detailAchievementUnit.trim(),
          text: detailAchievementText.trim(),
        };

        if (existingAchIndex >= 0) updatedAchievements[existingAchIndex] = achItem;
        else updatedAchievements = [achItem, ...updatedAchievements];
      }

      return {
        ...prev,
        program: updatedProgram,
        homeworks: updatedHomeworks,
        achievements: updatedAchievements,
      };
    });

    Alert.alert("Tamam", "Ders bilgileri kaydedildi.");
    setShowLessonDetailModal(false);
  }

  function copyDayTimesToSelectedDays() {
    const sourceItems = [...data.program]
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (sourceItems.length === 0) {
      Alert.alert("Kopyalama yok", "Önce bu güne ders saati eklemelisin.");
      return;
    }

    const targetDays = weekDays
      .map((x) => x.key)
      .filter((day) => copyTargets[day] && day !== selectedDay);

    if (targetDays.length === 0) {
      Alert.alert("Gün seç", "Kopyalamak için en az bir hedef gün seç.");
      return;
    }

    setData((prev) => {
      const cleanedProgram = prev.program.filter((item) => !targetDays.includes(item.day));

      const copiedItems: ProgramItem[] = targetDays.flatMap((day) =>
        sourceItems.map((item) => ({
          id: generateId("program"),
          day,
          startTime: item.startTime,
          endTime: item.endTime,
          lessonCardId: null,
          note: "",
        }))
      );

      return {
        ...prev,
        program: [...cleanedProgram, ...copiedItems],
      };
    });

    setCopyTargets({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });

    setShowCopyModal(false);
    Alert.alert("Tamam", "Ders saatleri seçilen günlere kopyalandı.");
  }

  async function importJsonData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri);
      const parsed = JSON.parse(content);
      const payload = parsed.appData ? parsed.appData : parsed;

      if (
        !payload ||
        !Array.isArray(payload.lessonCards) ||
        !Array.isArray(payload.program) ||
        !Array.isArray(payload.homeworks) ||
        !Array.isArray(payload.achievements)
      ) {
        Alert.alert("Hatalı dosya", "Seçilen JSON EduWidget veri yapısına uymuyor.");
        return;
      }

      setData(payload);
      Alert.alert("Tamam", "Veri dosyası uygulamaya yüklendi.");
    } catch {
      Alert.alert("Hata", "Dosya içe aktarılamadı.");
    }
  }

  async function exportJsonData() {
    try {
      const fileUri = `${FileSystem.cacheDirectory}eduwidget-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Paylaşım yok", "Bu cihazda paylaşım kullanılamıyor.");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "EduWidget verisini dışa aktar",
      });
    } catch {
      Alert.alert("Hata", "Veri dışa aktarılamadı.");
    }
  }

  function resetAllData() {
    Alert.alert("Tüm verileri sil", "Bütün kayıtlar silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setData(initialData);
        },
      },
    ]);
  }


  function renderTodayTab() {
    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Bugün" styles={styles} fs={fs}>
          <Text style={[styles.bigText, fs(20)]}>{getTodayDateString()}</Text>
          <Text style={[styles.mutedText, fs(14)]}>
            {weekDays.find((item) => item.key === todayDay)?.label}
          </Text>
        </Card>

        <Card title="Aktif Ders" styles={styles} fs={fs}>
          {todayLessons.find(isCurrentLesson) ? (
            (() => {
              const activeLesson = todayLessons.find(isCurrentLesson)!;
              const card = getCardById(activeLesson.lessonCardId);
              const colors = card ? getLessonCardColors(card.id, true) : getEmptySlotColors(true);

              return (
                <Pressable
                  onPress={() => openLessonDetail(activeLesson.id)}
                  style={[
                    styles.coloredPanel,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      shadowColor: colors.glow,
                    },
                  ]}
                >
                  <Text style={[styles.rowTitle, styles.forceBrightText, fs(15)]}>
                    {card?.lessonName ?? "Ders seçilmemiş"}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                    {activeLesson.startTime} - {activeLesson.endTime}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.text }, fs(12)]}>
                    {card ? `${card.grade}/${card.section} - ${card.shortName}` : activeLesson.note || "Boş"}
                  </Text>
                </Pressable>
              );
            })()
          ) : (
            <Text style={[styles.mutedText, fs(14)]}>Şu anda aktif ders yok.</Text>
          )}
        </Card>

        <Card title="Bugünkü Dersler" styles={styles} fs={fs}>
          {todayLessons.length === 0 ? (
            <Text style={[styles.mutedText, fs(14)]}>Bugün için ders programı yok.</Text>
          ) : (
            todayLessons.map((item, index) => {
              const card = getCardById(item.lessonCardId);
              const colors = getProgramItemColors(item);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => openLessonDetail(item.id)}
                  style={[
                    styles.listItem,
                    styles.thinCard,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      shadowColor: colors.glow,
                    },
                    isCurrentLesson(item) && styles.activeListItem,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                        {index + 1}. Ders • {card?.lessonName ?? "Boş Ders"}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.startTime} - {item.endTime}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {card ? `${card.grade}/${card.section} - ${card.shortName}` : item.note || "Boş"}
                      </Text>
                    </View>
                    {card ? (
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: getLessonTypeBadgeColor(card.type) },
                        ]}
                      >
                        <Text style={[styles.typeBadgeText, fs(11)]}>
                          {getLessonTypeLabel(card.type)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </ScrollView>
    );
  }

  function renderProgramTab() {
    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Program Araçları" styles={styles} fs={fs}>
          <PrimaryButton title="Ders Kartı Ekle" onPress={() => setShowCardModal(true)} styles={styles} fs={fs} />
          <SecondaryButton title="Program Satırı Ekle" onPress={() => setShowProgramModal(true)} styles={styles} fs={fs} />
          <SecondaryButton
            title="Bu Günün Saatlerini Diğer Günlere Kopyala"
            onPress={() => setShowCopyModal(true)}
            styles={styles}
            fs={fs}
          />
        </Card>

        <Card title="Kayıtlı Ders Kartları" styles={styles} fs={fs}>
          {data.lessonCards.length === 0 ? (
            <Text style={[styles.mutedText, fs(14)]}>Henüz ders kartı yok.</Text>
          ) : (
            data.lessonCards.map((item) => {
              const used = getUsedCount(item.id);
              const remaining = getRemainingCount(item);
              const colors = getLessonCardColors(item.id, false);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.listItem,
                    styles.slimListItem,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowBetween}>
                        <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                          {item.lessonName} ({item.shortName})
                        </Text>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: getLessonTypeBadgeColor(item.type) },
                          ]}
                        >
                          <Text style={[styles.typeBadgeText, fs(11)]}>
                            {getLessonTypeLabel(item.type)}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.grade}/{item.section} • Toplam {item.weeklyHours} • Kullanılan {used} • Kalan {remaining}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => openEditLessonCard(item)}
                        style={styles.actionIconButton}
                      >
                        <Text style={styles.actionIconText}>✏️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteLessonCard(item.id)}
                        style={styles.actionIconButton}
                      >
                        <Text style={styles.actionIconText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card title="Gün Seç" styles={styles} fs={fs}>
          <View style={styles.dayRow}>
            {weekDays.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setSelectedDay(item.key)}
                style={[styles.dayButton, selectedDay === item.key && styles.dayButtonActive]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    fs(13),
                    selectedDay === item.key && styles.dayButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Seçili Gün Programı" styles={styles} fs={fs}>
          {selectedDayLessons.length === 0 ? (
            <Text style={[styles.mutedText, fs(14)]}>Bu gün için program yok.</Text>
          ) : (
            selectedDayLessons.map((item, index) => {
              const card = getCardById(item.lessonCardId);
              const colors = getProgramItemColors(item);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPickerProgramId(item.id)}
                  style={[
                    styles.listItem,
                    styles.thinCard,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      shadowColor: colors.glow,
                    },
                    isCurrentLesson(item) && styles.activeListItem,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                        {index + 1}. Ders • {item.startTime} - {item.endTime}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {card
                          ? `${card.grade}/${card.section} - ${card.lessonName} (${card.shortName})`
                          : item.note || "Boş Ders"}
                      </Text>
                    </View>

                    {card ? (
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: getLessonTypeBadgeColor(card.type) },
                        ]}
                      >
                        <Text style={[styles.typeBadgeText, fs(11)]}>
                          {getLessonTypeLabel(card.type)}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.iconActions}>
                      <Pressable onPress={() => openEditProgramItem(item)} style={styles.iconButton}>
                        <Text style={styles.iconText}>✏️</Text>
                      </Pressable>
                      <Pressable onPress={() => openLessonDetail(item.id)} style={styles.iconButton}>
                        <Text style={styles.iconText}>📘</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </ScrollView>
    );
  }

  function renderHomeworkTab() {
    const sortedHomeworks = [...data.homeworks].sort((a, b) =>
      b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );

    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Yeni Ödev" styles={styles} fs={fs}>
          <Label text="Ders kartı" styles={styles} fs={fs} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.cardPickerRow}>
              {data.lessonCards.map((item) => {
                const colors = getLessonCardColors(item.id, homeworkForm.lessonCardId === item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setHomeworkForm((prev) => ({ ...prev, lessonCardId: item.id }))}
                    style={[
                      styles.cardPickerButton,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      homeworkForm.lessonCardId === item.id && styles.cardPickerButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardPickerText,
                        { color: colors.text },
                        fs(12),
                        homeworkForm.lessonCardId === item.id && styles.cardPickerTextActive,
                      ]}
                    >
                      {item.shortName} {item.grade}/{item.section}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Label text="Tarih" styles={styles} fs={fs} />
          <Input
            value={homeworkForm.date}
            onChangeText={(text) => setHomeworkForm((prev) => ({ ...prev, date: text }))}
            placeholder="2026-03-26"
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          <Label text="Ödev başlığı" styles={styles} fs={fs} />
          <Input
            value={homeworkForm.title}
            onChangeText={(text) => setHomeworkForm((prev) => ({ ...prev, title: text }))}
            placeholder="Sayfa 42 çöz"
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          <Label text="Not" styles={styles} fs={fs} />
          <Input
            value={homeworkForm.note}
            onChangeText={(text) => setHomeworkForm((prev) => ({ ...prev, note: text }))}
            placeholder="Ek not"
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          <PrimaryButton
            title={editingHomeworkId ? "Ödevi Güncelle" : "Ödev Ekle"}
            onPress={saveHomework}
            styles={styles}
            fs={fs}
          />

          {editingHomeworkId ? (
            <SecondaryButton
              title="Düzenlemeyi İptal Et"
              onPress={cancelEditHomework}
              styles={styles}
              fs={fs}
            />
          ) : null}
        </Card>

        <Card title="Kayıtlı Ödevler" styles={styles} fs={fs}>
          {sortedHomeworks.length === 0 ? (
            <Text style={[styles.mutedText, fs(14)]}>Henüz ödev yok.</Text>
          ) : (
            sortedHomeworks.map((item) => {
              const card = getCardById(item.lessonCardId);
              const colors = card
                ? getLessonCardColors(card.id, false)
                : getEmptySlotColors(false);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.date} • {card ? `${card.grade}/${card.section} - ${card.shortName}` : "Ders yok"}
                      </Text>
                      {!!item.note && (
                        <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                          {item.note}
                        </Text>
                      )}
                    </View>

                    <View style={styles.iconActions}>
                      <Pressable onPress={() => startEditHomework(item)} style={styles.iconButton}>
                        <Text style={styles.iconText}>✏️</Text>
                      </Pressable>
                      <Pressable onPress={() => deleteHomework(item.id)} style={styles.iconButton}>
                        <Text style={styles.iconText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    );
  }

  function renderAchievementTab() {
    const sortedAchievements = [...data.achievements].sort((a, b) =>
      b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );

    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Yeni Kazanım" styles={styles} fs={fs}>
          <Label text="Ders kartı" styles={styles} fs={fs} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.cardPickerRow}>
              {data.lessonCards.map((item) => {
                const isSelected = achievementForm.lessonCardId === item.id;
                const colors = getLessonCardColors(item.id, isSelected);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      setAchievementForm((prev) => ({
                        ...prev,
                        lessonCardId: item.id,
                        unit: "",
                        text: "",
                      }))
                    }
                    style={[
                      styles.cardPickerButton,
                      { backgroundColor: colors.bg, borderColor: colors.border },
                      isSelected && styles.cardPickerButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardPickerText,
                        { color: colors.text },
                        fs(12),
                        isSelected && styles.cardPickerTextActive,
                      ]}
                    >
                      {item.shortName} {item.grade}/{item.section}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Label text="Tarih" styles={styles} fs={fs} />
          <Input
            value={achievementForm.date}
            onChangeText={(text) => setAchievementForm((prev) => ({ ...prev, date: text }))}
            placeholder="2026-03-26"
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          {selectedAchievementOptions.length > 0 ? (
            <View>
              <Label text="Hazır kazanımlar" styles={styles} fs={fs} />
              {selectedAchievementOptions.map((option) => {
                const active =
                  achievementForm.unit === option.unit && achievementForm.text === option.text;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      setAchievementForm((prev) => ({
                        ...prev,
                        unit: option.unit,
                        text: option.text,
                      }))
                    }
                    style={[
                      styles.achievementOption,
                      active && styles.achievementOptionActive,
                    ]}
                  >
                    <Text style={[styles.achievementOptionUnit, fs(12)]}>{option.unit}</Text>
                    <Text
                      style={[
                        styles.achievementOptionText,
                        fs(13),
                        active && styles.achievementOptionTextActive,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Label text="Ünite" styles={styles} fs={fs} />
          <Input
            value={achievementForm.unit}
            onChangeText={(text) => setAchievementForm((prev) => ({ ...prev, unit: text }))}
            placeholder="Kuvvet ve Enerji"
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          <Label text="Kazanım metni" styles={styles} fs={fs} />
          <Input
            value={achievementForm.text}
            onChangeText={(text) => setAchievementForm((prev) => ({ ...prev, text: text }))}
            placeholder="Kazanım metni"
            multiline
            styles={styles}
            fs={fs}
            mutedColor={COLORS.muted}
          />

          <PrimaryButton
            title={editingAchievementId ? "Kazanımı Güncelle" : "Kazanım Ekle"}
            onPress={saveAchievement}
            styles={styles}
            fs={fs}
          />

          {editingAchievementId ? (
            <SecondaryButton
              title="Düzenlemeyi İptal Et"
              onPress={cancelEditAchievement}
              styles={styles}
              fs={fs}
            />
          ) : null}
        </Card>

        <Card title="Kayıtlı Kazanımlar" styles={styles} fs={fs}>
          {sortedAchievements.length === 0 ? (
            <Text style={[styles.mutedText, fs(14)]}>Henüz kazanım yok.</Text>
          ) : (
            sortedAchievements.map((item) => {
              const card = getCardById(item.lessonCardId);
              const colors = card
                ? getLessonCardColors(card.id, false)
                : getEmptySlotColors(false);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                        {item.unit || "Kazanım"}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.date} • {card ? `${card.grade}/${card.section} - ${card.shortName}` : "Ders yok"}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.text}
                      </Text>
                    </View>

                    <View style={styles.iconActions}>
                      <Pressable onPress={() => startEditAchievement(item)} style={styles.iconButton}>
                        <Text style={styles.iconText}>✏️</Text>
                      </Pressable>
                      <Pressable onPress={() => deleteAchievement(item.id)} style={styles.iconButton}>
                        <Text style={styles.iconText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    );
  }

  function renderSettingsTab() {
    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Tema" styles={styles} fs={fs}>
          <View style={styles.dayRow}>
            {(["dark", "light"] as ThemeMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setSettings((prev) => ({ ...prev, themeMode: mode }))}
                style={[styles.dayButton, settings.themeMode === mode && styles.dayButtonActive]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    fs(13),
                    settings.themeMode === mode && styles.dayButtonTextActive,
                  ]}
                >
                  {mode === "dark" ? "Koyu Mod" : "Açık Mod"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Dosya İşlemleri" styles={styles} fs={fs}>
          <PrimaryButton title="JSON Dosyası Seçip İçe Aktar" onPress={importJsonData} styles={styles} fs={fs} />
          <SecondaryButton title="Uygulama Verisini JSON Dışa Aktar" onPress={exportJsonData} styles={styles} fs={fs} />
        </Card>

        <Card title="Yazı Boyutu" styles={styles} fs={fs}>
          <View style={styles.dayRow}>
            {(["small", "medium", "large"] as FontSizeMode[]).map((size) => (
              <Pressable
                key={size}
                onPress={() => setSettings((prev) => ({ ...prev, fontSize: size }))}
                style={[styles.dayButton, settings.fontSize === size && styles.dayButtonActive]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    fs(13),
                    settings.fontSize === size && styles.dayButtonTextActive,
                  ]}
                >
                  {size === "small" ? "Küçük" : size === "medium" ? "Orta" : "Büyük"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card title="Veri" styles={styles} fs={fs}>
          <SecondaryButton title="Boş Veriye Dön" onPress={() => setData(initialData)} styles={styles} fs={fs} />
          <DangerButton title="Tüm Verileri Sil" onPress={resetAllData} styles={styles} fs={fs} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={settings.themeMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={COLORS.bg}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, fs(24)]}>EduWidget</Text>
        <Text style={[styles.headerSubTitle, fs(13)]}>Öğretmen paneli</Text>
      </View>

      <View style={styles.topTabWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTabRow}
        >
          {tabs.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.topTabButton, tab === item.key && styles.topTabButtonActive]}
            >
              <Text
                style={[
                  styles.topTabButtonText,
                  fs(13),
                  tab === item.key && styles.topTabButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {tab === "today" && renderTodayTab()}
        {tab === "program" && renderProgramTab()}
        {tab === "homework" && renderHomeworkTab()}
        {tab === "achievement" && renderAchievementTab()}
        {tab === "settings" && renderSettingsTab()}
      </View>

      <AppModal visible={showCardModal}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>Ders Kartı Ekle</Text>

            <Label text="Ders adı" styles={styles} fs={fs} />
            <Input
              value={cardForm.lessonName}
              onChangeText={(text) => setCardForm((p) => ({ ...p, lessonName: text }))}
              placeholder="Fen Bilimleri"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Kısaltma" styles={styles} fs={fs} />
            <Input
              value={cardForm.shortName}
              onChangeText={(text) => setCardForm((p) => ({ ...p, shortName: text }))}
              placeholder="FEN"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Sınıf" styles={styles} fs={fs} />
            <Input
              value={cardForm.grade}
              onChangeText={(text) => setCardForm((p) => ({ ...p, grade: text.replace(/\D/g, "") }))}
              placeholder="7"
              keyboardType="number-pad"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Şube" styles={styles} fs={fs} />
            <Input
              value={cardForm.section}
              onChangeText={(text) => setCardForm((p) => ({ ...p, section: text }))}
              placeholder="A"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Haftalık ders saati" styles={styles} fs={fs} />
            <Input
              value={cardForm.weeklyHours}
              onChangeText={(text) =>
                setCardForm((p) => ({ ...p, weeklyHours: text.replace(/\D/g, "").slice(0, 2) }))
              }
              placeholder="1"
              keyboardType="number-pad"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Ders tipi" styles={styles} fs={fs} />
            <View style={styles.dayRow}>
              {(["normal", "dyk", "private"] as LessonType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setCardForm((p) => ({ ...p, type }))}
                  style={[styles.dayButton, cardForm.type === type && styles.dayButtonActive]}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      fs(13),
                      cardForm.type === type && styles.dayButtonTextActive,
                    ]}
                  >
                    {getLessonTypeLabel(type)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton title="Kartı Kaydet" onPress={addLessonCard} styles={styles} fs={fs} />
            <SecondaryButton title="Kapat" onPress={() => setShowCardModal(false)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={showEditCardModal}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>Ders Kartını Düzenle</Text>

            <Label text="Ders adı" styles={styles} fs={fs} />
            <Input
              value={editCardForm.lessonName}
              onChangeText={(text) => setEditCardForm((p) => ({ ...p, lessonName: text }))}
              placeholder="Fen Bilimleri"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Kısaltma" styles={styles} fs={fs} />
            <Input
              value={editCardForm.shortName}
              onChangeText={(text) => setEditCardForm((p) => ({ ...p, shortName: text }))}
              placeholder="FEN"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Sınıf" styles={styles} fs={fs} />
            <Input
              value={editCardForm.grade}
              onChangeText={(text) => setEditCardForm((p) => ({ ...p, grade: text.replace(/\D/g, "") }))}
              placeholder="7"
              keyboardType="number-pad"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Şube" styles={styles} fs={fs} />
            <Input
              value={editCardForm.section}
              onChangeText={(text) => setEditCardForm((p) => ({ ...p, section: text }))}
              placeholder="A"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Haftalık ders saati" styles={styles} fs={fs} />
            <Input
              value={editCardForm.weeklyHours}
              onChangeText={(text) =>
                setEditCardForm((p) => ({ ...p, weeklyHours: text.replace(/\D/g, "").slice(0, 2) }))
              }
              placeholder="1"
              keyboardType="number-pad"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Ders tipi" styles={styles} fs={fs} />
            <View style={styles.dayRow}>
              {(["normal", "dyk", "private"] as LessonType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setEditCardForm((p) => ({ ...p, type }))}
                  style={[styles.dayButton, editCardForm.type === type && styles.dayButtonActive]}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      fs(13),
                      editCardForm.type === type && styles.dayButtonTextActive,
                    ]}
                  >
                    {getLessonTypeLabel(type)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton title="Kaydet" onPress={saveEditedLessonCard} styles={styles} fs={fs} />
            <SecondaryButton title="Kapat" onPress={() => setShowEditCardModal(false)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={showProgramModal}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>Program Satırı Ekle</Text>

            <Label text="Başlangıç saati" styles={styles} fs={fs} />
            <Input
              value={programForm.startTime}
              onChangeText={(text) => setProgramForm((p) => ({ ...p, startTime: normalizeTimeInput(text) }))}
              placeholder="08:20"
              keyboardType="number-pad"
              maxLength={5}
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Bitiş saati" styles={styles} fs={fs} />
            <Input
              value={programForm.endTime}
              onChangeText={(text) => setProgramForm((p) => ({ ...p, endTime: normalizeTimeInput(text) }))}
              placeholder="09:00"
              keyboardType="number-pad"
              maxLength={5}
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Not" styles={styles} fs={fs} />
            <Input
              value={programForm.note}
              onChangeText={(text) => setProgramForm((p) => ({ ...p, note: text }))}
              placeholder="Not"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <PrimaryButton title="Satırı Ekle" onPress={addProgramItem} styles={styles} fs={fs} />
            <SecondaryButton title="Kapat" onPress={() => setShowProgramModal(false)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={showCopyModal}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>
              {weekDays.find((x) => x.key === selectedDay)?.label} gününün saatlerini kopyala
            </Text>

            {weekDays.map((item) => (
              <Pressable
                key={item.key}
                disabled={item.key === selectedDay}
                onPress={() =>
                  setCopyTargets((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
                style={[
                  styles.copyOption,
                  item.key === selectedDay && styles.copyOptionDisabled,
                  copyTargets[item.key] && styles.copyOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.copyOptionText,
                    fs(13),
                    copyTargets[item.key] && styles.copyOptionTextActive,
                  ]}
                >
                  {item.label}
                  {item.key === selectedDay ? " (kaynak gün)" : ""}
                </Text>
              </Pressable>
            ))}

            <PrimaryButton title="Seçili Günlere Kopyala" onPress={copyDayTimesToSelectedDays} styles={styles} fs={fs} />
            <SecondaryButton title="Kapat" onPress={() => setShowCopyModal(false)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={!!editingProgramId}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>Ders Satırını Düzenle</Text>

            <Label text="Başlangıç saati" styles={styles} fs={fs} />
            <Input
              value={editProgramForm.startTime}
              onChangeText={(text) => setEditProgramForm((p) => ({ ...p, startTime: normalizeTimeInput(text) }))}
              placeholder="08:20"
              keyboardType="number-pad"
              maxLength={5}
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Bitiş saati" styles={styles} fs={fs} />
            <Input
              value={editProgramForm.endTime}
              onChangeText={(text) => setEditProgramForm((p) => ({ ...p, endTime: normalizeTimeInput(text) }))}
              placeholder="09:00"
              keyboardType="number-pad"
              maxLength={5}
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <Label text="Not" styles={styles} fs={fs} />
            <Input
              value={editProgramForm.note}
              onChangeText={(text) => setEditProgramForm((p) => ({ ...p, note: text }))}
              placeholder="Not"
              styles={styles}
              fs={fs}
              mutedColor={COLORS.muted}
            />

            <PrimaryButton title="Kaydet" onPress={saveEditedProgramItem} styles={styles} fs={fs} />
            <DangerButton
              title="Satırı Sil"
              onPress={() => {
                if (!editingProgramId) return;
                deleteProgramItem(editingProgramId);
                setEditingProgramId(null);
              }}
              styles={styles}
              fs={fs}
            />
            <SecondaryButton title="Kapat" onPress={() => setEditingProgramId(null)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={!!pickerProgramId}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(18)]}>Ders Kartı Seç</Text>

            <Pressable
              onPress={() => {
                if (pickerProgramId) assignCardToProgram(pickerProgramId, null);
              }}
              style={styles.modalListItem}
            >
              <Text style={[styles.rowTitle, fs(14)]}>Seçimi Kaldır</Text>
            </Pressable>

            {data.lessonCards.map((item) => {
              const remaining = getRemainingCount(item);
              const disabled = remaining <= 0;
              const colors = getLessonCardColors(item.id, false);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (pickerProgramId) assignCardToProgram(pickerProgramId, item.id);
                  }}
                  style={[
                    styles.modalListItem,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                    disabled && styles.fullCardOption,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }, fs(14)]}>
                        {item.lessonName} ({item.shortName})
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.subText }, fs(12)]}>
                        {item.grade}/{item.section} • Kalan {remaining}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: getLessonTypeBadgeColor(item.type) },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, fs(11)]}>
                        {getLessonTypeLabel(item.type)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <SecondaryButton title="Kapat" onPress={() => setPickerProgramId(null)} styles={styles} fs={fs} />
          </ScrollView>
        </ModalShell>
      </AppModal>

      <AppModal visible={showLessonDetailModal}>
        <ModalShell styles={styles}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, fs(19)]}>Ders Detayı</Text>

            {!selectedProgram ? (
              <Text style={[styles.mutedText, fs(14)]}>Ders bulunamadı.</Text>
            ) : (
              <>
                <View
                  style={[
                    styles.detailBlock,
                    {
                      backgroundColor: (selectedProgramCard
                        ? getLessonCardColors(selectedProgramCard.id, true)
                        : getEmptySlotColors(true)
                      ).bg,
                      borderColor: (selectedProgramCard
                        ? getLessonCardColors(selectedProgramCard.id, true)
                        : getEmptySlotColors(true)
                      ).border,
                    },
                  ]}
                >
                  <Text style={[styles.rowTitle, styles.forceBrightText, fs(16)]}>
                    {selectedProgramCard?.lessonName ?? "Ders atanmadı"}
                  </Text>
                  <Text style={[styles.rowSub, { color: "#D5EEF5" }, fs(12)]}>
                    {selectedProgram.startTime} - {selectedProgram.endTime}
                  </Text>
                  <Text style={[styles.rowSub, { color: "#E2E8F0" }, fs(12)]}>
                    {selectedProgramCard
                      ? `${selectedProgramCard.grade}/${selectedProgramCard.section} - ${selectedProgramCard.shortName}`
                      : "Boş satır"}
                  </Text>

                  {selectedProgramCard ? (
                    <View style={styles.miniInfoRow}>
                      <View style={styles.miniChip}>
                        <Text style={[styles.miniChipText, fs(11)]}>
                          {getLessonTypeLabel(selectedProgramCard.type)}
                        </Text>
                      </View>
                      <View style={styles.miniChip}>
                        <Text style={[styles.miniChipText, fs(11)]}>
                          Haftalık {selectedProgramCard.weeklyHours}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.detailBlock}>
                  <Text style={[styles.sectionTitle, fs(14)]}>Not</Text>
                  <Input
                    value={detailNote}
                    onChangeText={setDetailNote}
                    placeholder="Bu derse ait notu yaz"
                    multiline
                    styles={styles}
                    fs={fs}
                    mutedColor={COLORS.muted}
                  />
                </View>

                <View style={styles.detailBlock}>
                  <Text style={[styles.sectionTitle, fs(14)]}>Ödev</Text>
                  <Input
                    value={detailHomeworkTitle}
                    onChangeText={setDetailHomeworkTitle}
                    placeholder="Ödev başlığı"
                    styles={styles}
                    fs={fs}
                    mutedColor={COLORS.muted}
                  />
                  <Input
                    value={detailHomeworkNote}
                    onChangeText={setDetailHomeworkNote}
                    placeholder="Ödev notu"
                    multiline
                    styles={styles}
                    fs={fs}
                    mutedColor={COLORS.muted}
                  />
                </View>

                <View style={styles.detailBlock}>
                  <Text style={[styles.sectionTitle, fs(14)]}>Kazanım</Text>

                  {selectedCardAchievements.length > 0 ? (
                    selectedCardAchievements.map((item: AchievementCatalogItem) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setDetailAchievementUnit(item.unit);
                          setDetailAchievementText(item.text);
                        }}
                        style={[
                          styles.achievementOption,
                          detailAchievementText === item.text && styles.achievementOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.achievementOptionUnit,
                            fs(12),
                            detailAchievementText === item.text && styles.achievementOptionTextActive,
                          ]}
                        >
                          {item.unit}
                        </Text>
                        <Text
                          style={[
                            styles.achievementOptionText,
                            fs(13),
                            detailAchievementText === item.text && styles.achievementOptionTextActive,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={[styles.mutedText, fs(13)]}>Bu ders için hazır kazanım listesi yok.</Text>
                  )}

                  <Input
                    value={detailAchievementUnit}
                    onChangeText={setDetailAchievementUnit}
                    placeholder="Ünite"
                    styles={styles}
                    fs={fs}
                    mutedColor={COLORS.muted}
                  />
                  <Input
                    value={detailAchievementText}
                    onChangeText={setDetailAchievementText}
                    placeholder="Kazanım metni"
                    multiline
                    styles={styles}
                    fs={fs}
                    mutedColor={COLORS.muted}
                  />
                </View>

                <PrimaryButton title="Kaydet" onPress={saveLessonDetailAll} styles={styles} fs={fs} />
                <SecondaryButton title="Kapat" onPress={() => setShowLessonDetailModal(false)} styles={styles} fs={fs} />
              </>
            )}
          </ScrollView>
        </ModalShell>
      </AppModal>
    </SafeAreaView>
  );
}