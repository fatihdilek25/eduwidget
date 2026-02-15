import React, { useEffect, useState } from "react";
import { View, Button, StyleSheet, Text, Alert } from "react-native";
import { getState, setState, createEmptyState, updateState } from "../storage/repository";
import type { UserMode } from "../domain/types";
import { updateEduWidget } from "../widget/update";

function SettingsScreen() {
  const [mode, setMode] = useState<UserMode | "">("");

  async function refresh() {
    const state = await getState();
    setMode((state.mode as UserMode) ?? "");
  }

  useEffect(() => {
    refresh();
  }, []);

  async function changeMode(nextMode: UserMode) {
    await updateState(prev => ({ ...prev, mode: nextMode }));
    setMode(nextMode);
    await updateEduWidget();
    Alert.alert("Tamam", `Mod değişti: ${nextMode === "teacher" ? "Öğretmen" : "Öğrenci"}`);
  }

  async function resetAll() {
    Alert.alert(
      "Verileri Sıfırla",
      "Tüm dersler, ödevler ve seçimler silinecek. Emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            const empty = createEmptyState();
            await setState(empty);
            setMode("");
            await updateEduWidget();
            Alert.alert("Tamam", "Tüm veriler sıfırlandı.");
          },
        },
      ]
    );
  }

  async function forceWidgetUpdate() {
    await updateEduWidget();
    Alert.alert("Tamam", "Widget güncellemesi tetiklendi.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Ayarlar</Text>
      <Text style={styles.label}>Mevcut mod:</Text>
      <Text style={styles.value}>
        {mode === "teacher" ? "Öğretmen" : mode === "student" ? "Öğrenci" : "Seçilmedi"}
      </Text>

      <View style={styles.gap} />

      <Text style={styles.h2}>Mod Değiştir</Text>
      <View style={styles.gapSmall} />
      <Button title="Öğretmen yap" onPress={() => changeMode("teacher")} />
      <View style={styles.gapSmall} />
      <Button title="Öğrenci yap" onPress={() => changeMode("student")} />

      <View style={styles.hr} />

      <Text style={styles.h2}>Widget</Text>
      <View style={styles.gapSmall} />
      <Button title="Widget’ı şimdi güncelle" onPress={forceWidgetUpdate} />

      <View style={styles.hr} />

      <Text style={styles.h2}>Gelişmiş</Text>
      <View style={styles.gapSmall} />
      <Button title="Tüm verileri sıfırla" onPress={resetAll} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: "800" },
  label: { opacity: 0.7 },
  value: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  gap: { height: 14 },
  gapSmall: { height: 10 },
  hr: { height: 18 },
});
export default SettingsScreen;
