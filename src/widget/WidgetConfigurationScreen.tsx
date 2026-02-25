import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Linking from "expo-linking";

import { getWidgetPrefs, setWidgetPrefs, type WidgetLayout } from "./prefs";

function Chip(props: { title: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.chip,
        { backgroundColor: props.active ? "#111" : "#fff" },
      ]}
    >
      <Text style={{ color: props.active ? "#fff" : "#111", fontWeight: "700" }}>
        {props.title}
      </Text>
    </Pressable>
  );
}

export default function WidgetConfigurationScreen() {
  const [layout, setLayout] = useState<WidgetLayout>("compact");
  const [savedMsg, setSavedMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await getWidgetPrefs();
      setLayout(p.layout);
    })();
  }, []);

  async function save(nextLayout: WidgetLayout) {
    setLayout(nextLayout);
    await setWidgetPrefs({ layout: nextLayout });
    setSavedMsg("Kaydedildi ✅ Widget’ı uygulamadan ‘Şimdi Güncelle’ ile yenileyebilirsin.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Widget Tasarımı</Text>
      <Text style={styles.p}>İstediğin düzeni seç:</Text>

      <View style={styles.row}>
        <Chip title="1x4 Şerit" active={layout === "compact"} onPress={() => save("compact")} />
        <Chip title="4x4 Detay" active={layout === "large"} onPress={() => save("large")} />
        <Chip title="Dikey" active={layout === "vertical"} onPress={() => save("vertical")} />
      </View>

      {!!savedMsg && <Text style={styles.msg}>{savedMsg}</Text>}

      <Pressable
        style={styles.btn}
        onPress={() => Linking.openURL("eduwidget://home").catch(() => {})}
      >
        <Text style={styles.btnText}>Uygulamayı Aç</Text>
      </Pressable>

      <Text style={styles.small}>
        Not: Bu sürümde görünümü değiştirmek için widget güncellemesi gerekir
        (Uygulamadaki “Widget’ı Şimdi Güncelle” veya widget’ı kaldır/ekle).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 10, color: "#111" },
  p: { fontSize: 14, opacity: 0.75, marginBottom: 18, color: "#111" },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#111",
    margin: 6,
  },
  msg: { marginTop: 14, fontSize: 13, color: "#111", textAlign: "center", opacity: 0.85 },
  btn: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 15, fontWeight: "700", color: "#111" },
  small: { marginTop: 14, fontSize: 12, opacity: 0.6, textAlign: "center", color: "#111" },
});
