import "./src/widget/register";

import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";

import App from "./App";
import WidgetConfigurationScreen from "./src/widget/WidgetConfigurationScreen";

// Normal uygulama entry
registerRootComponent(App);

// Widget "Düzenle" ekranı (opsiyonel)
AppRegistry.registerComponent(
  "RNWidgetConfigurationScreen",
  () => WidgetConfigurationScreen
);