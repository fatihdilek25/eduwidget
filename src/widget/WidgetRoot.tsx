import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function WidgetRoot(props: {
  headline: string;
  subline: string;
  version: string;
  clickUri?: string;
}) {
  const hasUri = !!props.clickUri;

  return (
    <FlexWidget
      clickAction={hasUri ? "OPEN_URI" : "OPEN_APP"}
      clickActionData={hasUri ? { uri: props.clickUri! } : undefined}
      style={{
        flexDirection: "column",
        padding: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#111111",
      }}
    >
      <TextWidget
        text={props.headline || "—"}
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: "#111111",
          marginBottom: 4,
        }}
      />
      <TextWidget
        text={props.subline || ""}
        style={{
          fontSize: 12,
          color: "#333333",
        }}
      />

      {/* redraw */}
      <TextWidget text={props.version} style={{ fontSize: 1, opacity: 0 }} />
    </FlexWidget>
  );
}
