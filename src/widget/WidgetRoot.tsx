import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function WidgetRoot(props: { 
  headline: string; 
  subline: string; 
  version: string;
}) {
  return (
    <FlexWidget
  clickAction="OPEN_URI"
  clickActionData={{ uri: "eduwidget://home" }}
  style={{
    flexDirection: "column",
    padding: 16,
    borderRadius: 16,
  }}
>

      <TextWidget
        text={props.headline}
        style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}
      />
      <TextWidget text={props.subline} style={{ fontSize: 14 }} />

      {/* Launcher'ı redraw zorlamak için görünmez versiyon */}
      <TextWidget 
        text={props.version} 
        style={{ fontSize: 1, opacity: 0 }} 
      />
    </FlexWidget>
  );
}
