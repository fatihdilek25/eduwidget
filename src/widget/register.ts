import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./widget-task-handler";

// ✅ Bu satır çok kritik: Widget arkaplan task’ını kaydeder
registerWidgetTaskHandler(widgetTaskHandler);
