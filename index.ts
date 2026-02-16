import "./src/widget/register";

import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";

import App from "./App";
import { name as appName } from "./app.json";

import WidgetConfigurationScreen from "./src/widget/WidgetConfigurationScreen";

// Normal uygulama entry
registerRootComponent(App);

// ✅ Widget "Düzenle" ekranı için gerekli kayıt
AppRegistry.registerComponent("RNWidgetConfigurationScreen", () => WidgetConfigurationScreen);

// (opsiyonel ama güvenli) appName register: bazı ortamlarda faydalı
AppRegistry.registerComponent(appName, () => App);
