// import "react-native-get-random-values";
// import { Buffer } from "buffer";
// global.Buffer = global.Buffer || Buffer;

// import "../src/polyfills";

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                // hide the header - we'll add our own in each screen
                headerShown: false,
                // tab bar styling
                tabBarStyle: {
                    backgroundColor: "#16161D",
                    borderTopColor: "#2A2A35",
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 12,
                    height: 70,
                },
                // active/inactive colors
                tabBarActiveTintColor: "#14F195",
                tabBarInactiveTintColor: "#6B7280",
            }}
        >
        <Tabs.Screen
            name="index"
            options={{
                title: "Wallet",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="wallet" size={size} color={color} />
                ),
            }}
        />
        <Tabs.Screen
            name="swap"
            options={{
                title: "Swap",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="swap-horizontal" size={size} color={color} />
                ),
            }}
        />
        <Tabs.Screen
            name="send"
            options={{
                title: "Send",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="send" size={size} color={color} />
                ),
            }}
        />
        <Tabs.Screen
            name="settings"
            options={{
                title: "Settings",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="settings" size={size} color={color} />
                ),
            }}
        />
        </Tabs>
    );
} 