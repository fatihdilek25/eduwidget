'use no memo';

import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

type WidgetMode = "dark" | "light";

type DetailData = {
  title?: string;
  homeworkTitle?: string;
  homework?: string;
  achievement?: string;
  note?: string;
};

type RawLesson = Record<string, any>;

type Props = {
  lessons?: RawLesson[];
  detail?: DetailData | null;
  mode?: WidgetMode;
};

function pickString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function pickNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function normalizeLesson(item: RawLesson, index: number) {
  return {
    id: pickString(item.id, String(index)),
    order: pickNumber(item.order, index + 1),
    classLabel: pickString(item.classLabel, pickString(item.fullLabel, "-")),
    lessonLabel: pickString(
      item.lessonLabel,
      pickString(item.subjectLabel, pickString(item.shortLabel, "-"))
    ),
    start: pickString(
      item.start,
      pickString(item.timeLabel, "")
    ),
    active: Boolean(item.active),
    empty: Boolean(item.empty),
  };
}

export default function DetailWidget({
  lessons = [],
  detail = null,
  mode = "dark",
}: Props) {
  const isLight = mode === "light";

  const bg = isLight ? "#F4F8FF" : "#061224";
  const cardBg = isLight ? "#FFFFFF" : "#0B1730";
  const border = isLight ? "#D6E1F3" : "#20314F";
  const text = isLight ? "#10233F" : "#F5F8FF";
  const subText = isLight ? "#4C607C" : "#A9B7D0";
  const accent = isLight ? "#2E6BFF" : "#67B7FF";

  const chips =
    lessons.length > 0
      ? lessons.slice(0, 8).map(normalizeLesson)
      : Array.from({ length: 8 }, (_, i) => ({
          id: String(i),
          order: i + 1,
          classLabel: "-",
          lessonLabel: "-",
          start: "",
          active: false,
          empty: true,
        }));

  const homeworkLine =
    detail?.homeworkTitle?.trim() ||
    detail?.homework?.trim() ||
    "Ödev yok";

  const achievementLine =
    detail?.achievement?.trim() || "Kazanım yok";

  const noteLine =
    detail?.note?.trim() || "Not yok";

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: "match_parent",
        height: "match_parent",
        padding: 14,
        borderRadius: 26,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        justifyContent: "space-between",
      }}
    >
      <TextWidget
        text={detail?.title?.trim() || "Bugünkü Dersler"}
        style={{
          color: text,
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 10,
        }}
      />

      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {chips.map((item, index) => {
          const chipBg = item.active
            ? isLight
              ? "#E7F0FF"
              : "#173358"
            : cardBg;

          const chipBorder = item.active ? accent : border;

          return (
            <FlexWidget
              key={item.id}
              style={{
                flex: 1,
                marginRight: index === chips.length - 1 ? 0 : 6,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: chipBorder,
                backgroundColor: chipBg,
                paddingHorizontal: 6,
                paddingVertical: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextWidget
                text={`${item.order}. Ders`}
                style={{
                  color: subText,
                  fontSize: 10,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              />
              <TextWidget
                text={item.classLabel || "-"}
                style={{
                  color: text,
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                  marginTop: 4,
                }}
              />
              <TextWidget
                text={item.lessonLabel || "-"}
                style={{
                  color: text,
                  fontSize: 18,
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 2,
                }}
              />
              <TextWidget
                text={item.start || ""}
                style={{
                  color: item.active ? accent : subText,
                  fontSize: 13,
                  fontWeight: "700",
                  textAlign: "center",
                  marginTop: 4,
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: cardBg,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <TextWidget
            text={`Ödev: ${homeworkLine}`}
            style={{
              color: text,
              fontSize: 16,
              fontWeight: "700",
            }}
          />
          <TextWidget
            text={`Kazanım: ${achievementLine}`}
            style={{
              color: subText,
              fontSize: 14,
              fontWeight: "500",
              marginTop: 6,
            }}
          />
          <TextWidget
            text={`Not: ${noteLine}`}
            style={{
              color: subText,
              fontSize: 14,
              fontWeight: "500",
              marginTop: 6,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}