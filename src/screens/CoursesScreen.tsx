import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { theme } from "../ui/theme";
import { Card } from "../ui/Card";
import { PrimaryButton } from "../ui/PrimaryButton";
import { getState, updateState } from "../storage/repository";
import type { AppState, CourseType } from "../domain/types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

const TYPES: { label: string; value: CourseType }[] = [
  { label: "Ders", value: "lesson" },
  { label: "DYK", value: "dyk" },
  { label: "Özel", value: "private" },
  { label: "Etüt", value: "study" },
];

export default function CoursesScreen({ navigation }: any) {
  const [state, setState] = useState<AppState | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CourseType>("lesson");
  const [defaultNote, setDefaultNote] = useState("");

  async function refresh() {
    const s = await getState();
    setState(s);
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  const selectedClass = useMemo(() => {
    if (!state?.selectedClassGroupId) return null;
    return state.classGroups.find(cg => cg.id === state.selectedClassGroupId) ?? null;
  }, [state]);

  const courses = useMemo(() => {
    if (!state?.selectedClassGroupId) return [];
    return state.courses.filter(c => c.classGroupId === state.selectedClassGroupId);
  }, [state]);

  async function addCourse() {
    if (!state?.selectedClassGroupId) return;
    const t = title.trim();
    if (!t) return;

    await updateState(prev => {
      const next = { ...prev };
      next.courses = [
        ...next.courses,
        {
          id: uid("course"),
          classGroupId: next.selectedClassGroupId!,
          title: t,
          type,
          defaultNote: defaultNote.trim() ? defaultNote.trim() : undefined,
        },
      ];
      return next;
    });

    setTitle("");
    setDefaultNote("");
    setType("lesson");
    await refresh();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Dersler</Text>
      <Text style={styles.p}>{selectedClass ? `Sınıf: ${selectedClass.label}` : "Önce sınıf seç"}</Text>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.h2}>Yeni ders</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder='Örn: "Fen Bilimleri"'
          placeholderTextColor={theme.colors.subtext}
        />

        <View style={{ height: 10 }} />

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {TYPES.map(x => {
            const active = x.value === type;
            return (
              <Pressable
                key={x.value}
                onPress={() => setType(x.value)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.colors.text : theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <Text style={{ color: active ? "#fff" : theme.colors.text, fontWeight: "700" }}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 10 }} />
        <Text style={styles.h3}>Haftalık sabit not (opsiyonel)</Text>
        <TextInput
          style={[styles.input, { height: 84 }]}
          value={defaultNote}
          onChangeText={setDefaultNote}
          placeholder="Örn: Deney malzemeleri getir"
          placeholderTextColor={theme.colors.subtext}
          multiline
        />

        <View style={{ height: 10 }} />
        <PrimaryButton title="Ders Ekle" onPress={addCourse} />
      </View>

      <View style={{ marginTop: 16, flex: 1 }}>
        <Text style={styles.h2}>Liste</Text>
        <ScrollView style={{ marginTop: 10 }}>
          {courses.map(c => (
            <View key={c.id} style={{ marginBottom: 10 }}>
              <Card title={c.title} subtitle={c.defaultNote || ""} right={c.type === "lesson" ? "" : c.type.toUpperCase()} />
            </View>
          ))}
        </ScrollView>
      </View>

      <PrimaryButton
        title="Program →"
        variant="secondary"
        onPress={() => navigation.navigate("Schedule")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl },
  h1: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  p: { marginTop: 6, color: theme.colors.subtext },
  h2: { marginTop: 6, fontSize: 14, fontWeight: "800", color: theme.colors.text },
  h3: { marginTop: 2, fontSize: 12, fontWeight: "700", color: theme.colors.subtext },
  input: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
