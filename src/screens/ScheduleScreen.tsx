import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";

import { theme } from "../ui/theme";
import { Card } from "../ui/Card";
import { PrimaryButton } from "../ui/PrimaryButton";

import { getState, updateState } from "../storage/repository";
import type { AppState, Course, ScheduleItem, TimeSlot } from "../domain/types";
import { getTodayDayIndex } from "../domain/selectors";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

type PickerContext = {
  dayIndex: number;
  slotIndex: number;
  existingScheduleItemId?: string;
};

function courseLabel(c: Course) {
  const typeTag =
    c.type === "dyk"
      ? " (DYK)"
      : c.type === "private"
        ? " (Özel)"
        : c.type === "study"
          ? " (Etüt)"
          : "";
  return `${c.title}${typeTag}`;
}

export default function ScheduleScreen() {
  const [state, setState] = useState<AppState | null>(null);

  // Gün seçimi (üstte)
  const [dayIndex, setDayIndex] = useState<number>(getTodayDayIndex());

  // Kopyala/yapıştır buffer
  const [clipboard, setClipboard] = useState<{
    courseId: string;
    noteOverride?: string;
  } | null>(null);

  // Ders seçme modalı
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCtx, setPickerCtx] = useState<PickerContext | null>(null);

  async function refresh() {
    const s = await getState();
    setState(s);
  }

  useEffect(() => {
    refresh();
  }, []);

  const selectedClassGroup = useMemo(() => {
    if (!state?.selectedClassGroupId) return null;
    return (
      state.classGroups.find((cg) => cg.id === state.selectedClassGroupId) ??
      null
    );
  }, [state]);

  const coursesForSelectedClass = useMemo(() => {
    if (!state?.selectedClassGroupId) return [];
    return state.courses.filter(
      (c) => c.classGroupId === state.selectedClassGroupId,
    );
  }, [state]);

  // Bu sınıfa ait scheduleItem’ları hızlı bulmak için map
  const scheduleMap = useMemo(() => {
    const m = new Map<string, ScheduleItem>();
    if (!state) return m;

    // seçili sınıfın courseId seti
    const courseIds = new Set(coursesForSelectedClass.map((c) => c.id));
    for (const si of state.scheduleItems) {
      if (!courseIds.has(si.courseId)) continue;
      m.set(`${si.dayIndex}-${si.slotIndex}`, si);
    }
    return m;
  }, [state, coursesForSelectedClass]);

  const timeSlots: TimeSlot[] = useMemo(() => state?.timeSlots ?? [], [state]);

  function openPicker(ctx: PickerContext) {
    setPickerCtx(ctx);
    setPickerOpen(true);
  }

  async function assignCourse(courseId: string) {
    if (!state || !pickerCtx) return;

    const { dayIndex, slotIndex } = pickerCtx;
    const key = `${dayIndex}-${slotIndex}`;
    const existing = scheduleMap.get(key);

    await updateState((prev) => {
      // prev üzerinden çalış
      const next = { ...prev };
      const items = [...next.scheduleItems];

      if (existing) {
        // var olanı güncelle
        const idx = items.findIndex((x) => x.id === existing.id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], courseId };
        }
      } else {
        // yeni ekle
        items.push({
          id: uid("sched"),
          courseId,
          dayIndex,
          slotIndex,
        });
      }

      next.scheduleItems = items;
      return next;
    });

    setPickerOpen(false);
    setPickerCtx(null);
    await refresh();
  }

  async function clearSlot(day: number, slot: number) {
    await updateState((prev) => {
      const next = { ...prev };
      const courseIds = new Set(
        next.courses
          .filter((c) => c.classGroupId === next.selectedClassGroupId)
          .map((c) => c.id),
      );

      next.scheduleItems = next.scheduleItems.filter((si) => {
        const belongsToSelectedClass = courseIds.has(si.courseId);
        if (!belongsToSelectedClass) return true;
        return !(si.dayIndex === day && si.slotIndex === slot);
      });

      return next;
    });

    await refresh();
  }

  function onLongPressSlot(day: number, slot: number) {
    const si = scheduleMap.get(`${day}-${slot}`);
    if (!si) return;

    setClipboard({
      courseId: si.courseId,
      noteOverride: si.noteOverride,
    });
  }

  async function pasteIntoSlot(day: number, slot: number) {
    if (!clipboard) return;

    await updateState((prev) => {
      const next = { ...prev };

      // seçili sınıfın courseId seti
      const courseIds = new Set(
        next.courses
          .filter((c) => c.classGroupId === next.selectedClassGroupId)
          .map((c) => c.id),
      );

      // hedefte varsa güncelle, yoksa ekle
      const items = [...next.scheduleItems];
      const existing = items.find(
        (si) =>
          courseIds.has(si.courseId) &&
          si.dayIndex === day &&
          si.slotIndex === slot,
      );

      if (existing) {
        const idx = items.findIndex((x) => x.id === existing.id);
        items[idx] = {
          ...items[idx],
          courseId: clipboard.courseId,
          noteOverride: clipboard.noteOverride,
        };
      } else {
        items.push({
          id: uid("sched"),
          courseId: clipboard.courseId,
          dayIndex: day,
          slotIndex: slot,
          noteOverride: clipboard.noteOverride,
        });
      }

      next.scheduleItems = items;
      return next;
    });

    await refresh();
  }

  if (!state) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Ders Programı</Text>
      <Text style={styles.p}>
        {selectedClassGroup
          ? `Sınıf: ${selectedClassGroup.label}`
          : "Sınıf seçilmedi"}
      </Text>
      <Text style={[styles.p, { marginTop: 4 }]}>
        selectedClassGroupId: {String(state.selectedClassGroupId)}
      </Text>

      {/* Gün sekmeleri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DAY_LABELS.map((lbl, idx) => {
            const active = idx === dayIndex;
            return (
              <Pressable
                key={lbl}
                onPress={() => setDayIndex(idx)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: active
                      ? theme.colors.text
                      : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#fff" : theme.colors.text,
                    fontWeight: "700",
                  }}
                >
                  {lbl}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Kopyala buffer bilgisi */}
      <View style={{ marginTop: 12 }}>
        <Card
          title={clipboard ? "Kopyalandı ✅" : "Kopyala/Yapıştır"}
          subtitle={
            clipboard
              ? "Şimdi hedef slota dokun: Yapıştır • Uzun bas: Yeni kopya"
              : "Bir slota uzun bas: Kopyala • Sonra hedef slota dokun: Yapıştır"
          }
        />
      </View>

      {/* Slot listesi */}
      <ScrollView style={{ marginTop: 12 }}>
        {timeSlots.map((ts) => {
          const si = scheduleMap.get(`${dayIndex}-${ts.slotIndex}`);
          const course = si
            ? coursesForSelectedClass.find((c) => c.id === si.courseId)
            : undefined;

          const classLabel = selectedClassGroup?.label ?? "";
          const title = course
            ? `${classLabel ? classLabel + " • " : ""}${courseLabel(course)}`
            : "Boş";
          const subtitle = `${ts.slotIndex}. ders • ${si?.timeOverride?.start ?? ts.start}–${si?.timeOverride?.end ?? ts.end}`;

          return (
            <Pressable
              key={ts.slotIndex}
              onPress={() => {
                if (clipboard) {
                  pasteIntoSlot(dayIndex, ts.slotIndex);
                } else {
                  openPicker({
                    dayIndex,
                    slotIndex: ts.slotIndex,
                    existingScheduleItemId: si?.id,
                  });
                }
              }}
              onLongPress={() => onLongPressSlot(dayIndex, ts.slotIndex)}
              style={{ marginBottom: 12 }}
            >
              <Card title={title} subtitle={subtitle} right={si ? "⋯" : ""} />
              {si && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <PrimaryButton
                    title="Ders Seç"
                    variant="secondary"
                    onPress={() =>
                      openPicker({
                        dayIndex,
                        slotIndex: ts.slotIndex,
                        existingScheduleItemId: si.id,
                      })
                    }
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    title="Sil"
                    variant="secondary"
                    onPress={() => clearSlot(dayIndex, ts.slotIndex)}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Ders seçme modalı */}
      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ders Seç</Text>
            <Text style={styles.modalSub}>
              {selectedClassGroup ? selectedClassGroup.label : ""} •{" "}
              {DAY_LABELS[dayIndex]}
              {pickerCtx ? ` • ${pickerCtx.slotIndex}. ders` : ""}
            </Text>

            <ScrollView style={{ marginTop: 12, maxHeight: 360 }}>
              {coursesForSelectedClass.length === 0 ? (
                <Text style={{ color: theme.colors.subtext }}>
                  Bu sınıf için henüz ders yok. (Bir sonraki adımda “Dersler”
                  ekranı ekleyeceğiz.)
                </Text>
              ) : (
                coursesForSelectedClass.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => assignCourse(c.id)}
                    style={styles.courseRow}
                  >
                    <Text
                      style={{ fontWeight: "700", color: theme.colors.text }}
                    >
                      {courseLabel(c)}
                    </Text>
                    {!!c.defaultNote && (
                      <Text
                        style={{ marginTop: 6, color: theme.colors.subtext }}
                        numberOfLines={2}
                      >
                        {c.defaultNote}
                      </Text>
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <PrimaryButton
                title={clipboard ? "Yapıştır modunu kapat" : "Kapat"}
                variant="secondary"
                onPress={() => {
                  setPickerOpen(false);
                  setPickerCtx(null);
                }}
                style={{ flex: 1 }}
              />
              {clipboard && (
                <PrimaryButton
                  title="Kopyayı Temizle"
                  variant="secondary"
                  onPress={() => setClipboard(null)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.xl,
  },
  h1: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  p: { marginTop: 6, color: theme.colors.subtext },

  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  modalSub: { marginTop: 6, color: theme.colors.subtext },

  courseRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});
