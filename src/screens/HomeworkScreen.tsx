import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { getState } from "../storage/repository";
import {
  buildWidgetSummaryText,
  selectTodayLessons,
  selectDueTodayHomeworkCount,
} from "../domain/selectors";

import { Card } from "../ui/Card";
import { PrimaryButton } from "../ui/PrimaryButton";
import { theme } from "../ui/theme";
import { updateEduWidget } from "../widget/update";

type Props = NativeStackScreenProps<RootStackParamList, "Homework">;

  function HomeScreen({ navigation }: Props) {
  const [modeLabel, setModeLabel] = useState<string>("Seçilmedi");
  const [headline, setHeadline] = useState<string>("");
  const [subline, setSubline] = useState<string>("");
  const [todayLessonCount, setTodayLessonCount] = useState<number>(0);
  const [dueCount, setDueCount] = useState<number>(0);

  async function refresh() {
    const state = await getState();

    const mode = state.mode;
    setModeLabel(mode === "teacher" ? "Öğretmen" : mode === "student" ? "Öğrenci" : "Seçilmedi");

    const w = buildWidgetSummaryText(state);
    setHeadline(w.headline);
    setSubline(w.subline);

    setTodayLessonCount(selectTodayLessons(state).length);
    setDueCount(selectDueTodayHomeworkCount(state));
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      refresh();
    });
    refresh();
    return unsub;
  }, [navigation]);

  async function updateWidgetNow() {
    await updateEduWidget();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.h1}>Ana Sayfa</Text>
      <Text style={styles.p}>Bugün için hızlı özet</Text>

      <View style={styles.section}>
        <Card title={`Mod: ${modeLabel}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Widget İçeriği</Text>
        <View style={{ height: 10 }} />
        <Card title={headline || "—"} subtitle={subline || ""} />
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

      <View style={styles.section}>
        <Text style={styles.h2}>Hızlı İşlemler</Text>
        <View style={{ height: 10 }} />

        <PrimaryButton title="Ders Programı" onPress={() => navigation.navigate("Schedule")} />
        <View style={{ height: 10 }} />

        <PrimaryButton
          title="Ödevler"
          variant="secondary"
          onPress={() => navigation.navigate("Homework")}
        />
        <View style={{ height: 10 }} />

        <PrimaryButton
          title="Kazanımlar"
          variant="secondary"
          onPress={() => navigation.navigate("Achievement")}
        />
        <View style={{ height: 18 }} />

        <PrimaryButton
          title="Widget’ı Şimdi Güncelle"
          variant="secondary"
          onPress={updateWidgetNow}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
  },
  p: {
    marginTop: 6,
    color: theme.colors.subtext,
  },
  h2: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  section: {
    marginTop: 18,
  },
  grid: {
    flexDirection: "row",
    marginTop: 14,
  },
});

export default HomeScreen;