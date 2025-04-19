import { Platform } from "react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

export async function askPermission() {
  if (Platform.OS === "ios") {
    const { status } = await getTrackingPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await requestTrackingPermissionsAsync();
      console.log("Tracking permission status:", newStatus);
    }
  }
}
