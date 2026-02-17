// These MUST be at the very top, before any other imports
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

import "../src/polyfills";

import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="token/[mint]" />
                {/* <Stack.Screen
                    name="send"
                    options={{
                        presentation: "modal",  // slides up from bottom like a sheet
                    }}
                /> */}
            </Stack>
        </SafeAreaProvider>
    )
}