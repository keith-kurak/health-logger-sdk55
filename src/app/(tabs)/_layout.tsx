import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { useTheme } from "@/hooks/use-theme";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundElement,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Log",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "list.bullet", android: "list", web: "list" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: "Trends",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{
                ios: "chart.bar.fill",
                android: "bar_chart",
                web: "bar_chart",
              }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "gear", android: "settings", web: "settings" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
