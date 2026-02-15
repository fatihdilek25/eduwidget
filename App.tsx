import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";

import RootNavigator from "./src/navigation/RootNavigator";

const linking = {
  prefixes: ["eduwidget://"],
  config: {
    screens: {
      LessonDetail: "lesson/:scheduleItemId",
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
