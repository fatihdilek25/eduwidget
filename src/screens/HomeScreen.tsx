import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";

import { getState } from "../storage/repository";
import { Card } from "../ui/Card";
import { PrimaryButton } from "../ui/PrimaryButton";
import { theme } from "../ui/theme";
import { updateEduWidget } from "../widget/update";
import {
  buildWidgetSummaryText,
  selectTodayLessons,
  selectDueTodayHomeworkCount,
} from "../domain/selectors";

type ModeLabel = "Öğretmen" | "Öğrenci" | "Seçilmedi";

function HomeScreen({ navigation }: any) {
  const [modeLabel, setModeLabel] = useState<ModeLabel>("Seçilmedi");
  const [headline, setHeadline] = useState<string>("—");
  const [subline, setSubline] = useState<string>("");
  const [todayLessonCount, setTodayLessonCount] = useState<number>(0);
  const [dueCount, setDueCount] = useState<number>(0);

  async function refresh() {
    const state = await getState();

    const mode = state.mode;
    setModeLabel(mode === "teacher" ? "Öğretmen" : mode === "student" ? "Öğrenci" : "Seçilmedi");

    const w = buildWidgetSummaryText(state);
    setHeadline(w.headline || "—");
    setSubline(w.subline || "");

    setTodayLessonCount(selectTodayLessons(state).length);
    setDueCount(selectDueTodayHomeworkCount(state));
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  async function updateWidgetNow() {
    await updateEduWidget();
    await refresh();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Ana Sayfa</Text>
      <Text style={styles.p}>Bugün için hızlı özet</Text>

      <View style={{ marginTop: 16 }}>
        <Card title={`Mod: ${modeLabel}`} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.h2}>Widget Önizleme</Text>
        <View style={{ height: 10 }} />
        <Card title={headline} subtitle={subline} />
      </View>

      <View style={styles.grid}>
        <View style={{ flex: 1 }}>
          <Card title="Bugünkü ders" right={String(todayLessonCount)} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Card title="Teslim ödev" right={String(dueCount)} />
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <Text style={styles.h2}>Hızlı İşlemler</Text>
        <View style={{ height: 10 }} />
        <PrimaryButton title="Ders Programı" onPress={() => navigation.navigate("Schedule")} />
        <View style={{ height: 10 }} />
        <PrimaryButton title="Ödevler" variant="secondary" onPress={() => navigation.navigate("Homework")} />
        <View style={{ height: 10 }} />
        <PrimaryButton title="Kazanımlar" variant="secondary" onPress={() => navigation.navigate("Achievement")} />
        <View style={{ height: 10 }} />
        <PrimaryButton title="Ayarlar" variant="secondary" onPress={() => navigation.navigate("Settings")} />
        <View style={{ height: 18 }} />
        <PrimaryButton title="Widget’ı Şimdi Güncelle" variant="secondary" onPress={updateWidgetNow} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.xl, paddingBottom: 40 },
  h1: { fontSize: 28, fontWeight: "800", color: theme.colors.text },
  p: { marginTop: 6, color: theme.colors.subtext },
  h2: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  grid: { flexDirection: "row", marginTop: 14 },
});

export default HomeScreen;
