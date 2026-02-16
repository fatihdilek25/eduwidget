import { updateEduWidget } from "../widget/update";

import React, { useState } from "react";
import { View, Button, TextInput, StyleSheet, Text } from "react-native";
import { updateState } from "../storage/repository";
import type { Lesson } from "../domain/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { getTodayDayIndex } from "../domain/date";

type Props = NativeStackScreenProps<RootStackParamList, "AddLesson">;

function uid() {
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function AddLessonScreen({ navigation }: Props) {
  const [time, setTime] = useState("08:30");
  const [title, setTitle] = useState("Fen Bilimleri");
  const [note, setNote] = useState("");

  async function save() {
    const lesson: Lesson = {
      id: uid(),
      dayIndex: getTodayDayIndex(), // MVP: bugüne ekliyoruz (sonra haftalık edit yapılır)
      time,
      title,
      note: note.trim() || undefined,
      color: "blue",
    };

    await updateState((prev) => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));
    await updateEduWidget();

    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saat (örn: 08:30)</Text>
      <TextInput style={styles.input} value={time} onChangeText={setTime} />
      <Text style={styles.label}>Ders adı</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Not (opsiyonel)</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} />
      <View style={styles.gap} />
      <Button title="Kaydet" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  label: { fontWeight: "700", marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 12 },
  gap: { height: 16 },
});

export default AddLessonScreen;
