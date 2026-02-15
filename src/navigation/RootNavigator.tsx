import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ModeSelectScreen from "../screens/ModeSelectScreen";
import HomeScreen from "../screens/HomeScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import AddLessonScreen from "../screens/AddLessonScreen";
import HomeworkScreen from "../screens/HomeworkScreen";
import AchievementScreen from "../screens/AchievementScreen";
import SettingsScreen from "../screens/SettingsScreen";
import LessonDetailScreen from "../screens/LessonDetailScreen";


import { getState } from "../storage/repository";

export type RootStackParamList = {
  ModeSelect: undefined;
  Home: undefined;
  Schedule: undefined;
  AddLesson: undefined;
  Homework: undefined;
  Achievement: undefined;
  Settings: undefined;
  LessonDetail: { scheduleItemId: string };

};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      const state = await getState();
      setInitialRoute(state.mode ? "Home" : "ModeSelect");
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="ModeSelect" component={ModeSelectScreen} options={{ title: "Mod Seçimi" }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Ana Sayfa" }} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: "Ders Programı" }} />
      <Stack.Screen name="AddLesson" component={AddLessonScreen} options={{ title: "Ders Ekle" }} />
      <Stack.Screen name="Homework" component={HomeworkScreen} options={{ title: "Ödevler" }} />
      <Stack.Screen name="Achievement" component={AchievementScreen} options={{ title: "Kazanımlar" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Ayarlar" }} />
      <Stack.Screen
  name="LessonDetail"
  component={LessonDetailScreen}
  options={{ presentation: "modal", title: "Ders Detayı" }}
/>

    </Stack.Navigator>
  );
}
