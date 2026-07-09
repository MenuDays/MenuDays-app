import { Stack } from "expo-router";

export default function ProvinceLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "fade",
                gestureEnabled: false,
                contentStyle: {
                    backgroundColor: "#F8F8F8",
                },
            }}
        />
    );
}