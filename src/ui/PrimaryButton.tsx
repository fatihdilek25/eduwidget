import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "./theme";

export function PrimaryButton(props: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
}) {
  const variant = props.variant ?? "primary";
  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "danger"
      ? theme.colors.danger
      : theme.colors.card;

  const textColor = variant === "secondary" ? theme.colors.text : "#fff";
  const borderColor = variant === "secondary" ? theme.colors.border : "transparent";

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, opacity: pressed ? 0.85 : 1 },
        props.style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{props.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: { fontSize: 15, fontWeight: "700" },
});
