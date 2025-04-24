import React, { useEffect, useState } from "react";
import supabase from "./utils/supabase";
import LoginScreen from "../components/LoginScreen";
import TrackingScreen from "../components/TrackingScreen";
import WelcomeScreen from "../components/WelcomeScreen";
import PrivacyPolicyScreen from "../components/PrivacyPolicyScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppRegistry,
  ActivityIndicator,
  StatusBar,
  View,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";
import { Session } from "@supabase/supabase-js";
import * as SplashScreen from "expo-splash-screen";

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  //This is an alternative maybe cleaner solution

  /*
  // Execute a task about every 15 minutes:
BackgroundFetch.configure({
  minimumFetchInterval: 15
}, async (taskId) => { // <-- This is your periodic-task callback  
  const location = await BackgroundGeolocation.getCurrentPosition({
    samples: 3,
    extras: {   // <-- your own arbitrary meta-data
      "event": "getCurrentPosition"
    }
  });
  console.log('[getCurrentPosition]', location);
  BackgroundFetch.finish(taskId);   // <-- signal that your task is complete
})
  */

  useEffect(() => {
    if (Platform.OS === "ios") {
      StatusBar.setBarStyle("light-content"); // White text/icons for iOS
    }
  }, []);

  useEffect(() => {
    const handleSession = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem("rememberMe");
        if (rememberMe === "false") {
          await supabase.auth.signOut();
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        console.error("SBOX Error checking session:", error);
      }
    };

    handleSession();

    setTimeout(() => {
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_OUT") {
            setSession(null);
          } else {
            setSession(session);
          }
        }
      );
    }, 1000); // Delay of 1 second
  }, []);

  useEffect(() => {
    const checkPrivacy = async () => {
      if (session && session?.user) {
        const { data, error } = await supabase
          .from("users")
          .select("privacy_policy_accepted")
          .eq("email", session.user.email)
          .single();

        if (!error) {
          setPrivacyAccepted(data?.privacy_policy_accepted || false);
        } else {
          console.error("SBOX Error checking privacy policy:", error);
        }
      }
    };
    checkPrivacy();
  }, [session]);

  async function sendLocation(location: {
    coords: { latitude: number; longitude: number };
  }) {
    const { latitude, longitude } = location.coords;
    const device_time = new Date()
      .toLocaleString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ".")
      .replace(",", "");

    try {
      // Insert the location into the database
      await supabase.from("locations").insert({
        latitude,
        longitude,
        email: await getUserEmail(),
        device_time,
      });

      // Send cached locations to the database if available
      await sendCachedLocationsToDB();
    } catch (error) {
      console.error("SBOX Error saving location to Supabase:", error);

      // Cache the location if saving fails
      await cacheLocation({ latitude, longitude, device_time });
    }
  }

  async function getUserEmail() {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;
    if (!email) {
      console.error("SBOX User not authenticated.");
      return;
    }
    return email;
  }

  /**
   * Cache the location in AsyncStorage if it cannot be sent to the DB.
   * @param {Object} location The location object containing latitude, longitude, and device_time.
   */
  async function cacheLocation(location: object) {
    try {
      const cachedLocations = await AsyncStorage.getItem("cachedLocations");
      const locationsArray = cachedLocations ? JSON.parse(cachedLocations) : [];
      locationsArray.push(location);
      await AsyncStorage.setItem(
        "cachedLocations",
        JSON.stringify(locationsArray)
      );
      console.log("SBOX Location cached.");
    } catch (error) {
      console.error("SBOX Error caching location:", error);
    }
  }

  /**
   * Send all cached locations to the database.
   */
  async function sendCachedLocationsToDB() {
    try {
      const cachedLocations = await AsyncStorage.getItem("cachedLocations");
      if (!cachedLocations) return;

      const locationsArray = JSON.parse(cachedLocations);
      if (locationsArray.length === 0) return;

      const email = await getUserEmail();
      if (!email) return;

      await supabase.from("locations").insert(
        locationsArray.map(
          (location: {
            latitude: number;
            longitude: number;
            device_time: string;
          }) => ({
            ...location,
            email,
          })
        )
      );

      await AsyncStorage.removeItem("cachedLocations");
      console.log("SBOX Cached locations successfully sent to the DB.");
    } catch (error) {
      console.error("SBOX Error sending cached locations to Supabase:", error);
    }
  }

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          "Lexend-Bold": require("../assets/fonts/Lexend-Bold.ttf"),
        });
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        Alert.alert(
          "Initialization Error",
          `An error occurred during app initialization: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
    initializeApp();
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        {showWelcomeScreen && !session ? (
          <WelcomeScreen onContinue={() => setShowWelcomeScreen(false)} />
        ) : session ? (
          privacyAccepted ? (
            <TrackingScreen
              isTracking={isTracking}
              setPrivacyAccepted={setPrivacyAccepted}
              setSession={setSession}
              setIsTracking={setIsTracking}
            />
          ) : (
            <PrivacyPolicyScreen
              email={session.user.email || ""}
              setPrivacyAccepted={setPrivacyAccepted}
            />
          )
        ) : (
          <LoginScreen />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
