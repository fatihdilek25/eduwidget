import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { theme } from "../ui/theme";
import { PrimaryButton } from "../ui/PrimaryButton";
import { Card } from "../ui/Card";
import { getState, updateState } from "../storage/repository";
import type { AppState, ScheduleItem, Course } from "../domain/types";

export default function LessonDetailScreen({ route, navigation }: any) {
  const scheduleItemId: string = route?.params?.scheduleItemId;

  const [state, setState] = useState<AppState | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [si, setSi] = useState<ScheduleItem | null>(null);

  const [defaultNote, setDefaultNote] = useState("");
  const [overrideNote, setOverrideNote] = useState("");

  useEffect(() => {
    (async () => {
      const s = await getState();
      const found = s.scheduleItems.find(x => x.id === scheduleItemId) ?? null;
      const foundCourse = found ? s.courses.find(c => c.id === found.courseId) ?? null : null;
      if (!found) {
  setState(s);
  
  setSi(null);
  setCourse(null);
  return;
}


      setState(s);
      setSi(found);
      setCourse(foundCourse);

      setDefaultNote(foundCourse?.defaultNote ?? "");
      setOverrideNote(found?.noteOverride ?? "");
    })();
  }, [scheduleItemId]);

  const headerTitle = useMemo(() => {
    if (!course || !state) return "Ders Detayı";
    const cg = state.classGroups.find(x => x.id === course.classGroupId);
    return `${cg?.label ?? ""} • ${course.title}`.trim();
  }, [course, state]);

  async function save() {
    if (!si || !course) return;

    await updateState(prev => {
      const next = { ...prev };

      // course defaultNote update
      next.courses = next.courses.map(c =>
        c.id === course.id ? { ...c, defaultNote: defaultNote.trim() ? defaultNote : undefined } : c
      );

      // schedule item override note update
      next.scheduleItems = next.scheduleItems.map(x =>
        x.id === si.id ? { ...x, noteOverride: overrideNote.trim() ? overrideNote : undefined } : x
      );

      return next;
    });

    navigation.goBack();
  }

  if (!scheduleItemId) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>scheduleItemId yok</Text>
      </View>
    );
  }

  if (!state) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text>Yükleniyor…</Text>
    </View>
  );
}

if (!si || !course) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Ders bulunamadı</Text>
      <Text style={{ marginTop: 8, color: theme.colors.subtext, textAlign: "center" }}>
        Bu bağlantı test amaçlıydı. Gerçek ders için widget veya programdan açılacak.
      </Text>
      <View style={{ height: 14 }} />
      <PrimaryButton title="Geri Dön" variant="secondary" onPress={() => navigation.goBack()} />
    </View>
  );
}


  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.h1}>{headerTitle || "Ders Detayı"}</Text>

      <View style={{ marginTop: 12 }}>
        <Card
          title="Not Mantığı"
          subtitle="Haftaya yayılan not = Ders Notu • Bu güne özel not = Slot Notu"
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.h2}>Ders Notu (Haftaya yayılır)</Text>
        <TextInput
          style={styles.input}
          value={defaultNote}
          onChangeText={setDefaultNote}
          placeholder="Örn: Deney yapılacak / materyal getir"
          placeholderTextColor={theme.colors.subtext}
          multiline
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.h2}>Slot Notu (Sadece bu ders)</Text>
        <TextInput
          style={styles.input}
          value={overrideNote}
          onChangeText={setOverrideNote}
          placeholder="Örn: Bugün şu kısımda kaldık"
          placeholderTextColor={theme.colors.subtext}
          multiline
        />
      </View>

      {/* Kazanım seçimi (MVP placeholder) */}
      <View style={{ marginTop: 16 }}>
        <Card
          title="Kazanım"
          subtitle="Bir sonraki adımda burada kazanım seçme/ değiştirme ekleyeceğiz (dailyStuck)."
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        <PrimaryButton title="Vazgeç" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
        <PrimaryButton title="Kaydet" onPress={save} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, paddingBottom: 30 },
  h1: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  h2: { fontSize: 14, fontWeight: "800", color: theme.colors.text, marginBottom: 8 },
  input: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
});
