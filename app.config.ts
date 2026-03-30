import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "EduWidget",
  slug: "eduwidget",
  scheme: "eduwidget",
  version: "1.0.0",
  android: {
    package: "com.fatihdilek.eduwidget",
  },
  plugins: [
    "expo-dev-client",
    [
      "react-native-android-widget",
      {
        widgets: [
          {
            name: "SimpleWidget",
            label: "Günlük Dersler",
            minWidth: "320dp",
            minHeight: "120dp",
          },
          {
            name: "DetailWidget",
            label: "Detaylı Widget",
            minWidth: "320dp",
            minHeight: "200dp",
          },
          {
            name: "WeeklyWidget",
            label: "Haftalık Widget",
            minWidth: "320dp",
            minHeight: "300dp",
          },
        ],
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "7a6b9efd-c203-4aee-b345-f4b6bfeab7e7",
    },
  },
});