import AsyncStorage from "@react-native-async-storage/async-storage";

export type WidgetLayout = "compact" | "large" | "vertical";

const KEY = "edu_widget_prefs_v1";

export type WidgetPrefs = {
  layout: WidgetLayout;
};

const DEFAULT_PREFS: WidgetPrefs = { layout: "compact" };

export async function getWidgetPrefs(): Promise<WidgetPrefs> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<WidgetPrefs>;
    return {
      layout: parsed.layout ?? DEFAULT_PREFS.layout,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setWidgetPrefs(next: WidgetPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
