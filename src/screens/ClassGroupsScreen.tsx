import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { theme } from "../ui/theme";
import { Card } from "../ui/Card";
import { PrimaryButton } from "../ui/PrimaryButton";
import { getState, updateState } from "../storage/repository";
import type { AppState } from "../domain/types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export default function ClassGroupsScreen({ navigation }: any) {
  const [state, setState] = useState<AppState | null>(null);
  const [label, setLabel] = useState("");

  async function refresh() {
    const s = await getState();
    setState(s);
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  async function addClass() {
    const v = label.trim();
    if (!v) return;

    // ID’yi dışarıda üret: eklenenle seçilen kesin aynı olsun
    const newId = uid("cg");

    await updateState(prev => {
      const next: AppState = { ...prev };
      next.classGroups = [...next.classGroups, { id: newId, label: v }];
      next.selectedClassGroupId = newId; // ✅ KESİN seç
      return next;
    });

    setLabel("");
    await refresh();
  }

  async function selectClass(id: string) {
    await updateState(prev => ({ ...prev, selectedClassGroupId: id }));
    await refresh();
  }

  if (!state) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Yükleniyor…</Text>
      </View>
    );
  }

  const list = state.classGroups.filter(
    cg => cg.id !== "cg-default" || state.classGroups.length === 1
  );

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Sınıflarım</Text>
      <Text style={styles.p}>Sınıf/şube ekle ve seç</Text>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.h2}>Yeni sınıf</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder='Örn: "5/A"'
          placeholderTextColor={theme.colors.subtext}
        />
        <View style={{ height: 10 }} />
        <PrimaryButton title="Sınıf Ekle" onPress={addClass} />
      </View>

      <View style={{ marginTop: 16, flex: 1 }}>
        <Text style={styles.h2}>Mevcut sınıflar</Text>
        <ScrollView style={{ marginTop: 10 }}>
          {list.map(cg => {
            const active = state.selectedClassGroupId === cg.id;
            return (
              <View key={cg.id} style={{ marginBottom: 12 }}>
                <Card title={cg.label} subtitle={active ? "Seçili ✅" : ""} />
                <View style={{ height: 8 }} />
                <PrimaryButton
                  title={active ? "Seçili" : "Seç"}
                  variant="secondary"
                  onPress={() => selectClass(cg.id)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryButton
          title="Dersler"
          variant="secondary"
          onPress={() => navigation.navigate("Courses")}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          title="Program"
          variant="secondary"
          onPress={() => navigation.navigate("Schedule")}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl },
  h1: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  p: { marginTop: 6, color: theme.colors.subtext },
  h2: { marginTop: 6, fontSize: 14, fontWeight: "800", color: theme.colors.text },
  input: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
});
