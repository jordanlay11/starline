import { Tabs } from "expo-router";
import { colors } from "../globalStyles";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
        }}
      />
    </Tabs>
  );
}
