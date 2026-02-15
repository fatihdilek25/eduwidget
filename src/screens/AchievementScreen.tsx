import { updateEduWidget } from "../widget/update";

import React, { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text } from "react-native";
import { getState, updateState } from "../storage/repository";
import { Card } from "../ui/Card";

 function AchievementScreen() {
  const [mode, setMode] = useState<"teacher" | "student" | "">("");
  const [items, setItems] = useState<{ id: string; title: string; subtitle: string }[]>([]);
  const [lastId, setLastId] = useState<string>("");

  async function refresh() {
    const state = await getState();
    setMode((state.mode as any) ?? "");
    setLastId(state.lastStuck?.achievementId ?? "");
    setItems(
      state.achievements.map(a => ({
        id: a.id,
        title: `${a.courseTitle}: ${a.unitTitle}`,
        subtitle: a.outcomeTitle,
      }))
    );
  }

  useEffect(() => {
    refresh();
  }, []);

  async function markStuck(id: string) {
    if (mode !== "teacher") return;
    await updateState(prev => ({
      ...prev,
      lastStuck: { atISO: new Date().toISOString(), achievementId: id },
    }));
    await updateEduWidget();

    await refresh();
  }

  return (
    <View style={styles.container}>
      {mode !== "teacher" && (
        <Text style={styles.note}>Bu ekran öğretmen odaklıdır. Öğrenci modunda sadece liste görünebilir.</Text>
      )}
      {items.map(x => (
        <View key={x.id} style={{ marginBottom: 10 }}>
          <Card title={x.title} subtitle={x.subtitle} right={x.id === lastId ? "⭐" : ""} />
          {mode === "teacher" && <Button title="Bu kazanımda kaldım" onPress={() => markStuck(x.id)} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  note: { opacity: 0.75, marginBottom: 12 },
});
export default AchievementScreen;
