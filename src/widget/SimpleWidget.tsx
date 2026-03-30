'use no memo';

import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import {
  getFormattedDateLabel,
  getLessonColors,
  getTypeAccent,
  getWidgetSurface,
  WidgetLesson,
  WidgetThemeMode,
} from "./widgetData";

type SimpleWidgetProps = {
  lessons?: WidgetLesson[];
  mode?: WidgetThemeMode;
};

export default function SimpleWidget({
  lessons = [],
  mode = "dark",
}: SimpleWidgetProps) {
  const dateLabel = getFormattedDateLabel();
  const surface = getWidgetSurface(mode);

  const count = lessons.length || 1;
  const cardWidth = count >= 10 ? 34 : count >= 9 ? 36 : count >= 8 ? 38 : 44;
  const cardHeight = 56;

  if (!lessons.length) {
    return (
      <FlexWidget
        style={{
          paddingVertical: 6,
          paddingHorizontal: 8,
          backgroundColor: surface.rootBg as any,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: surface.rootBorder as any,
        }}
      >
        <TextWidget
          text={dateLabel}
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: surface.text as any,
            marginBottom: 4,
          }}
        />
        <FlexWidget
          style={{
            height: 46,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: surface.cardBg as any,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: surface.cardBorder as any,
          }}
        >
          <TextWidget
            text="Bugün için ders verisi yok"
            style={{ fontSize: 9, color: surface.sub as any }}
          />
        </FlexWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: surface.rootBg as any,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: surface.rootBorder as any,
      }}
    >
      <TextWidget
        text={dateLabel}
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: surface.text as any,
          marginBottom: 4,
        }}
      />

      <FlexWidget style={{ flexDirection: "row" }}>
        {lessons.map((l) => {
          const colors = getLessonColors(l.lessonCardId, l.active, l.lesson === "BOŞ", mode);

          return (
            <FlexWidget
              key={l.id}
              style={{
                width: cardWidth,
                height: cardHeight,
                marginRight: 3,
                paddingVertical: 3,
                paddingHorizontal: 2,
                borderRadius: 11,
                backgroundColor: colors.bg as any,
                borderWidth: l.active ? 2 : 1,
                borderColor: colors.border as any,
                justifyContent: "center",
                alignItems: "center",
              }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: `eduwidget://lesson/${l.id}` }}
            >
              <TextWidget
                text={l.orderLabel}
                style={{
                  fontSize: 5,
                  fontWeight: "700",
                  color: colors.sub as any,
                  marginBottom: 1,
                }}
              />
              <TextWidget
                text={l.classLabel}
                style={{
                  fontSize: 7,
                  fontWeight: "700",
                  color: colors.sub as any,
                  marginBottom: 1,
                }}
              />
              <TextWidget
                text={l.lesson}
                style={{
                  fontSize: 7,
                  fontWeight: "700",
                  color: colors.text as any,
                  marginBottom: 1,
                }}
              />
              <TextWidget
                text={l.startTime}
                style={{
                  fontSize: 6,
                  fontWeight: "700",
                  color: colors.sub as any,
                  marginBottom: l.lessonType ? 1 : 0,
                }}
              />
              {!!l.lessonType && (
                <TextWidget
                  text={l.lessonType}
                  style={{
                    fontSize: 6,
                    fontWeight: "700",
                    color: getTypeAccent(l.lessonType) as any,
                  }}
                />
              )}
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}