import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "../../src/i18n";
import { colors } from "../../src/theme";

const renderIcon = (name: keyof typeof Ionicons.glyphMap) =>
  function Icon({ color }: { color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
  };

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.today"),
          tabBarIcon: renderIcon("moon-outline"),
          tabBarButtonTestID: "nav-tab-home",
        }}
      />
      <Tabs.Screen
        name="tarot"
        options={{
          title: t("tabs.tarot"),
          tabBarIcon: renderIcon("albums-outline"),
          tabBarButtonTestID: "nav-tab-tarot",
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t("tabs.friends"),
          tabBarIcon: renderIcon("people-outline"),
          tabBarButtonTestID: "nav-tab-friends",
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t("tabs.journal"),
          tabBarIcon: renderIcon("book-outline"),
          tabBarButtonTestID: "nav-tab-journal",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: renderIcon("ellipse-outline"),
          tabBarButtonTestID: "nav-tab-profile",
        }}
      />
    </Tabs>
  );
}
