import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetLayout } from "./prefs";

const C = (v: string) => v as any;

function truncate(s: string, n: number) {
  const t = (s ?? "").trim();
  if (t.length <= n) return t;
  return t.slice(0, Math.max(0, n - 1)) + "…";
}

export function WidgetRoot(props: {
  layout: WidgetLayout;

  nowTitle: string;
  nowSub: string;
  nowNote?: string;

  nextTitle?: string;
  nextSub?: string;

  version: string;
  clickUri?: string;
}) {
  const uri = props.clickUri ?? "eduwidget://home";

  const base: any = {
  
  flexDirection: "column" as const,
  padding: 10,
  backgroundColor: C("#FFFFFF"),
  borderWidth: 2,
  borderColor: C("#FF0000"), // test için kırmızı
};

  if (props.layout === "compact") {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri }}
        style={{ ...base, flexDirection: "row" as const, padding: 10 }}
      >
        <TextWidget
          text="COMPACT"
          style={{ fontSize: 10, fontWeight: "800", color: C("#111") }}
        />

        <FlexWidget style={{ flex: 1, flexDirection: "column" as const }}>
          <TextWidget
            text={truncate(props.nowTitle, 28)}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: C("#111111"),
              marginBottom: 4,
            }}
          />
          <TextWidget
            text={truncate(props.nowSub, 34)}
            style={{ fontSize: 12, color: C("#444444") }}
          />
        </FlexWidget>

        <FlexWidget style={{ width: 10 }} />

        <FlexWidget style={{ flex: 1, flexDirection: "column" as const }}>
          <TextWidget
            text={truncate(props.nextTitle ?? "Sonraki: —", 28)}
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: C("#111111"),
              marginBottom: 4,
            }}
          />
          <TextWidget
            text={truncate(props.nextSub ?? "", 34)}
            style={{ fontSize: 12, color: C("#444444") }}
          />
        </FlexWidget>

        <TextWidget text={" "} style={{ fontSize: 1 }} />
      </FlexWidget>
    );
  }

  if (props.layout === "vertical") {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri }}
        style={{ ...base, padding: 10 }}
      >
        <TextWidget
          text="VERTICAL"
          style={{ fontSize: 10, fontWeight: "800", color: C("#111") }}
        />

        <TextWidget
          text={truncate(props.nowTitle, 34)}
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: C("#111111"),
            marginBottom: 4,
          }}
        />
        <TextWidget
          text={truncate(props.nowSub, 40)}
          style={{ fontSize: 12, color: C("#444444"), marginBottom: 10 }}
        />

        <TextWidget
          text={truncate(props.nextTitle ?? "Sonraki: —", 34)}
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: C("#111111"),
            marginBottom: 4,
          }}
        />
        <TextWidget
          text={truncate(props.nextSub ?? "", 40)}
          style={{ fontSize: 12, color: C("#444444") }}
        />

        <TextWidget text={" "} style={{ fontSize: 1 }} />
      </FlexWidget>
    );
  }

  // large

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{ ...base, padding: 12 }}
    >
      {/* ÜST: büyük başlık */}
      <TextWidget
        text="LARGE"
        style={{ fontSize: 10, fontWeight: "800", color: C("#111") }}
      />

      <TextWidget
        text={truncate(props.nowTitle, 44)}
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: C("#111111"),
          marginBottom: 6,
        }}
      />
      <TextWidget
        text={truncate(props.nowSub, 60)}
        style={{ fontSize: 12, color: C("#444444"), marginBottom: 12 }}
      />

      {/* NOT BLOĞU */}
      <FlexWidget
        style={{
          flexDirection: "column" as const,
          padding: 10,
          backgroundColor: C("#F3F4F6"),
          borderWidth: 1,
          borderColor: C("#E5E7EB"),
        }}
      >
        <TextWidget
          text="Not"
          style={{
            fontSize: 12,
            fontWeight: "800",
            color: C("#111111"),
            marginBottom: 4,
          }}
        />
        <TextWidget
          text={truncate(props.nowNote ?? "—", 120)}
          style={{ fontSize: 12, color: C("#444444") }}
        />
      </FlexWidget>

      {/* ALT: sonraki */}
      <FlexWidget style={{ height: 10 }} />

      <TextWidget
        text={truncate(props.nextTitle ?? "Sonraki: —", 44)}
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C("#111111"),
          marginBottom: 4,
        }}
      />
      <TextWidget
        text={truncate(props.nextSub ?? "", 60)}
        style={{ fontSize: 12, color: C("#444444") }}
      />

      <TextWidget text={" "} style={{ fontSize: 1 }} />
    </FlexWidget>
  );
}
