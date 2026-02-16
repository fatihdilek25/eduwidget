import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Linking from "expo-linking";

export default function WidgetConfigurationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Widget Ayarları</Text>
      <Text style={styles.p}>
        Bu sürümde widget düzenleme ekranı basit tutuldu. Uygulamadan ders/not
        güncelleyebilirsin.
      </Text>

      <Pressable
        style={styles.btn}
        onPress={() => {
          // Uygulamayı aç (Home’a düşer)
          Linking.openURL("eduwidget://home").catch(() => {});
        }}
      >
        <Text style={styles.btnText}>Uygulamayı Aç</Text>
      </Pressable>

      <Text style={styles.small}>
        Not: İleride buraya “1x4 / 4x4 widget tasarımı seç” ayarlarını koyacağız.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  p: { fontSize: 14, opacity: 0.8, marginBottom: 18 },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnText: { fontSize: 15, fontWeight: "700" },
  small: { marginTop: 14, fontSize: 12, opacity: 0.6, textAlign: "center" },
});
