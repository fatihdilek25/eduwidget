import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { getState } from "../storage/repository";
import { buildWidgetSummaryText } from "../domain/selectors";
import { WidgetRoot } from "./WidgetRoot";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const state = await getState();
  const { headline, subline } = buildWidgetSummaryText(state);

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      props.renderWidget(
  <WidgetRoot 
    headline={headline} 
    subline={subline}
    version={String(Date.now())}
  />
);

      break;

    case "WIDGET_CLICK":
      // clickAction="OPEN_APP" olduğu için burada ek iş yapmak zorunda değilsin. :contentReference[oaicite:7]{index=7}
      break;

    case "WIDGET_DELETED":
    default:
      break;
  }
}
