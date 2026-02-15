import React from "react";
import { View, Button, StyleSheet, Text } from "react-native";
import { updateState } from "../storage/repository";
import type { UserMode } from "../domain/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ModeSelect">;

function ModeSelectScreen({ navigation }: Props) {
  async function setMode(mode: UserMode) {
    await updateState(prev => ({ ...prev, mode }));
    navigation.replace("Home");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>İlk kurulum</Text>
      <Text style={styles.p}>Lütfen modunu seç:</Text>
      <View style={styles.gap} />
      <Button title="Öğretmen" onPress={() => setMode("teacher")} />
      <View style={styles.gap} />
      <Button title="Öğrenci" onPress={() => setMode("student")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  p: { opacity: 0.75 },
  gap: { height: 12 },
});

export default ModeSelectScreen;