import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { WidgetRoot } from "./WidgetRoot";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (
    props.widgetAction !== "WIDGET_ADDED" &&
    props.widgetAction !== "WIDGET_UPDATE" &&
    props.widgetAction !== "WIDGET_RESIZED"
  ) {
    return;
  }

  // ✅ HİÇ async/state/prefs yok: bu görünmüyorsa handler hiç çalışmıyor demektir.
  props.renderWidget(
    <WidgetRoot
      layout="vertical"
      nowTitle="TEST: Widget Render ✅"
      nowSub="Handler çalışıyor"
      nowNote="Eğer bunu görüyorsan sorun state/prefs tarafında"
      nextTitle="Sonraki: —"
      nextSub=""
      version={String(Date.now())}
      clickUri="eduwidget://home"
    />
  );
}