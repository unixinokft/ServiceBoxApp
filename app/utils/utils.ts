import { Platform, Alert } from "react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

export async function askPermission() {
  try {
    const { status } = await getTrackingPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await requestTrackingPermissionsAsync();
      console.log("Tracking permission status:", newStatus);
    }
  } catch (error) {
    Alert.alert(
      "Error",
      `Error requesting tracking permission: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
