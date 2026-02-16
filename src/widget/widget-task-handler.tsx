import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { getState } from "../storage/repository";
import { buildWidgetSummaryText, selectCurrentAndNextLesson } from "../domain/selectors";
import { WidgetRoot } from "./WidgetRoot";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  try {
    const state = await getState();

    const { headline, subline } = buildWidgetSummaryText(state);
    const { current, next } = selectCurrentAndNextLesson(state);
    const targetId = current?.scheduleItem?.id ?? next?.scheduleItem?.id;
    const clickUri = targetId ? `eduwidget://lesson/${targetId}` : undefined;

    // ✅ DEBUG: handler çalışıyor mu?
    const debugHeadline = `HANDLER OK ✅ ${new Date().toLocaleTimeString()}`;

    switch (props.widgetAction) {
      case "WIDGET_ADDED":
      case "WIDGET_UPDATE":
      case "WIDGET_RESIZED":
      props.renderWidget(
  <WidgetRoot
    headline={headline}
    subline={subline}
    version={String(Date.now())}
    clickUri={clickUri}
  />
);

        break;

      case "WIDGET_CLICK":
        break;

      default:
        break;
    }
  } catch (e: any) {
    // ✅ Hata olursa bile ekranda yazı göster
    props.renderWidget(
      <WidgetRoot
        headline="WIDGET ERROR ❌"
        subline={String(e?.message ?? e)}
        version={String(Date.now())}
      />
    );
  }
}
