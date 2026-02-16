import * as Linking from "expo-linking";

export const linking = {
  prefixes: [Linking.createURL("/"), "eduwidget://"],
  config: {
    screens: {
      ModeSelect: "mode",
      Home: "home",
      Schedule: "schedule",
      AddLesson: "add-lesson",
      Homework: "homework",
      Achievement: "achievement",
      LessonDetail: "lesson/:scheduleItemId",
    },
  },
};
