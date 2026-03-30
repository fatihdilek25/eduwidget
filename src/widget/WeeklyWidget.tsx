'use no memo';

import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import {
  getFormattedDateLabel,
  getLessonColors,
  getTypeAccent,
  getWidgetSurface,
  WidgetDaySummary,
  WidgetThemeMode,
} from "./widgetData";

type WeeklyWidgetProps = {
  weekly?: WidgetDaySummary[];
  mode?: WidgetThemeMode;
};

export default function WeeklyWidget({
  weekly = [],
  mode = "dark",
}: WeeklyWidgetProps) {
  const dateLabel = getFormattedDateLabel();
  const surface = getWidgetSurface(mode);

  return (
    <FlexWidget
      style={{
        padding: 8,
        backgroundColor: surface.rootBg as any,
        borderRadius: 22,
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
          marginBottom: 6,
        }}
      />

      {!weekly.length ? (
        <TextWidget
          text="Haftalık veri yok"
          style={{ fontSize: 9, color: surface.sub as any }}
        />
      ) : (
        <FlexWidget>
          {weekly.map((day) => {
            const dayCount = day.lessons.length || 1;
            const cellWidth = dayCount >= 10 ? 31 : dayCount >= 9 ? 32 : 34;

            return (
              <FlexWidget
                key={day.dayKey}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <FlexWidget
                  style={{
                    width: 28,
                    justifyContent: "center",
                  }}
                >
                  <TextWidget
                    text={day.dayLabel}
                    style={{
                      fontSize: 8,
                      fontWeight: "700",
                      color: surface.text as any,
                    }}
                  />
                </FlexWidget>

                <FlexWidget style={{ flexDirection: "row" }}>
                  {day.lessons.map((l) => {
                    const colors = getLessonColors(l.lessonCardId, l.active, l.lesson === "BOŞ", mode);

                    return (
                      <FlexWidget
                        key={l.id}
                        style={{
                          width: cellWidth,
                          height: 48,
                          marginRight: 2,
                          paddingVertical: 2,
                          paddingHorizontal: 2,
                          borderRadius: 10,
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
                          text={`${l.order}.D`}
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
                            fontSize: 5,
                            fontWeight: "700",
                            color: colors.sub as any,
                            marginBottom: 1,
                          }}
                        />
                        <TextWidget
                          text={l.lesson}
                          style={{
                            fontSize: 6,
                            fontWeight: "700",
                            color: colors.text as any,
                            marginBottom: 1,
                          }}
                        />
                        <TextWidget
                          text={l.startTime}
                          style={{
                            fontSize: 4,
                            fontWeight: "700",
                            color: colors.sub as any,
                            marginBottom: l.lessonType ? 1 : 0,
                          }}
                        />
                        {!!l.lessonType && (
                          <TextWidget
                            text={l.lessonType}
                            style={{
                              fontSize: 4,
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
          })}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}