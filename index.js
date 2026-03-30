import React from "react";
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";

import App from "./App";
import SimpleWidget from "./src/widget/SimpleWidget";
import DetailWidget from "./src/widget/DetailWidget";
import WeeklyWidget from "./src/widget/WeeklyWidget";
import {
  buildWidgetSummary,
  buildWeeklyWidgetSummary,
  getActiveLessonDetail,
} from "./src/widget/widgetData";

const STORAGE_KEY = "eduwidget_v6_data";

registerRootComponent(App);

registerWidgetTaskHandler(async (props) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    const data = raw
      ? JSON.parse(raw)
      : {
          lessonCards: [],
          program: [],
          homeworks: [],
          achievements: [],
        };

    const lessons = buildWidgetSummary(data);
    const weekly = buildWeeklyWidgetSummary(data);
    const detail = getActiveLessonDetail(data);

    if (props.widgetInfo.widgetName === "SimpleWidget") {
      props.renderWidget(<SimpleWidget lessons={lessons} />);
      return;
    }

    if (props.widgetInfo.widgetName === "DetailWidget") {
      props.renderWidget(<DetailWidget lessons={lessons} detail={detail} />);
      return;
    }

    if (props.widgetInfo.widgetName === "WeeklyWidget") {
      props.renderWidget(<WeeklyWidget weekly={weekly} />);
    }
  } catch (e) {
    console.log("Widget render error:", e);
  }
});