import { requestWidgetUpdate } from "react-native-android-widget";

export async function updateEduWidget() {
  try {
    await requestWidgetUpdate({ widgetName: "EduWidget" });
  } catch (e) {
    // console.log(e);
  }
}
