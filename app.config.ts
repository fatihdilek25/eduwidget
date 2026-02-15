import type { ConfigContext, ExpoConfig } from "expo/config";
import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: "EduWidget",
      label: "Eğitim Widget",
      minWidth: "320dp",
      minHeight: "120dp",
      targetCellWidth: 5,
      targetCellHeight: 2,
      description: "Bugünkü dersler, ödevler ve kazanım",
      previewImage: "./assets/widget-preview/edu.png",
      // 0 = sistem periyodik güncellemesin (manuel)
      // istersen 1800000 (30 dk) gibi ver, ama Android 30dk'dan sık vermez. :contentReference[oaicite:5]{index=5}
      updatePeriodMillis: 0,
      widgetFeatures: "reconfigurable|configuration_optional",
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Edu Widget App",
  slug: "edu-widget-app",
  scheme: "eduwidget",
  plugins: [["react-native-android-widget", widgetConfig]],
  android: {
    package: "com.fatihdilek.eduwidget",
  },
});
