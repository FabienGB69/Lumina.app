import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { colors } from "../../src/theme";

const renderIcon = (name: keyof typeof Ionicons.glyphMap) =>
  function Icon({ color }: { color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
  };

export default function TabsLayout() {
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
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: renderIcon("moon-outline"),
          tabBarButtonTestID: "nav-tab-home",
        }}
      />
      <Tabs.Screen
        name="tarot"
        options={{
          title: "Tarot",
          tabBarIcon: renderIcon("albums-outline"),
          tabBarButtonTestID: "nav-tab-tarot",
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: renderIcon("people-outline"),
          tabBarButtonTestID: "nav-tab-friends",
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: renderIcon("book-outline"),
          tabBarButtonTestID: "nav-tab-journal",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: renderIcon("ellipse-outline"),
          tabBarButtonTestID: "nav-tab-profile",
        }}
      />
    </Tabs>
  );
}
