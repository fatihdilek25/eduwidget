import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "./theme";

export function Card(props: {
  title: string;
  subtitle?: string;
  right?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, props.style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{props.title}</Text>
        {!!props.subtitle && <Text style={styles.subtitle}>{props.subtitle}</Text>}
      </View>
      {!!props.right && <Text style={styles.right}>{props.right}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    flexDirection: "row",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  subtitle: { fontSize: 13, marginTop: 6, color: theme.colors.subtext },
  right: { marginLeft: 12, fontWeight: "700", color: theme.colors.text },
});
