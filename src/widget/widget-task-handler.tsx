import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import SimpleWidget from "./SimpleWidget";
import DetailWidget from "./DetailWidget";
import WeeklyWidget from "./WeeklyWidget";
import {
  buildWidgetSummary,
  buildWeeklyWidgetSummary,
  getActiveLessonDetail,
  WidgetThemeMode,
} from "./widgetData";

const STORAGE_KEY = "eduwidget_v6_data";
const SETTINGS_KEY = "eduwidget_v6_settings";

type AppDataLike = {
  lessonCards?: any[];
  program?: any[];
  homeworks?: any[];
  achievements?: any[];
};

type SettingsLike = {
  themeMode?: WidgetThemeMode;
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);

    const data: AppDataLike = raw
      ? JSON.parse(raw)
      : { lessonCards: [], program: [], homeworks: [], achievements: [] };

    const settings: SettingsLike = rawSettings ? JSON.parse(rawSettings) : {};
    const mode: WidgetThemeMode = settings.themeMode === "light" ? "light" : "dark";

    const lessons = buildWidgetSummary(data);
    const weekly = buildWeeklyWidgetSummary(data);
    const detail = getActiveLessonDetail(data);
    const widgetName = props.widgetInfo.widgetName;

    switch (props.widgetAction) {
      case "WIDGET_ADDED":
      case "WIDGET_UPDATE":
      case "WIDGET_RESIZED":
      case "WIDGET_CLICK": {
        if (widgetName === "SimpleWidget") {
          props.renderWidget(<SimpleWidget lessons={lessons} mode={mode} />);
          return;
        }

        if (widgetName === "DetailWidget") {
          props.renderWidget(
            <DetailWidget lessons={lessons} detail={detail} mode={mode} />
          );
          return;
        }

        if (widgetName === "WeeklyWidget") {
          props.renderWidget(<WeeklyWidget weekly={weekly} mode={mode} />);
          return;
        }

        return;
      }

      default:
        return;
    }
  } catch (error) {
    console.log("widgetTaskHandler error:", error);
  }
}