import React, { useEffect, useState } from "react";
import BackgroundGeolocation from "react-native-background-geolocation";
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
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";
import { Session } from "@supabase/supabase-js";

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

  BackgroundGeolocation.ready(
    {
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: Platform.OS === "android" ? 0 : 1,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      reset: true,
      locationUpdateInterval: 60000,
      debug: true,
      heartbeatInterval: Platform.OS === "ios" ? 60 : undefined,
      preventSuspend: true, // <-- Required for iOS
      backgroundPermissionRationale: {
        title: "Helymeghatározás szükséges",
        message:
          "Az alkalmazás működéséhez szükséges a helyadatok gyűjtése háttérben is. Kérjük, engedélyezd a hozzáférést.",
        positiveAction: "Engedélyezem",
        negativeAction: "Elutasítom",
      },
      //Stuff to try out
      //locationAuthorizationRequest:"Always" //cross platform
      /**
       * locationAuthorizationAlert: { //iOS
      titleWhenNotEnabled: "A szükséges helymeghatározás nincs engedélyezve",
    titleWhenOff: "A helymeghatározás KI van kapcsolva",
    instructions: "Be kell állítanod az 'Mindig' opciót a helymeghatározásban",
    cancelButton: "Mégse",
    settingsButton: "Beállítások"
  }
       */
    },
    (state) => {
      //alert("sztét: " + JSON.stringify(state));
      /*if (!state.enabled) {
        alert("start tracking from index");
        BackgroundGeolocation.start(); // Start tracking
      }*/
    },
    (error) => {
      alert("error: " + JSON.stringify(error));
    }
  );

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

  useEffect(() => {
    // Start or stop background geolocation based on isTracking
    if (isTracking) {
      BackgroundGeolocation.start();

      const subscription = BackgroundGeolocation.onHeartbeat((event) => {
        console.log("[onHeartbeat] ", event);

        // You could request a new location if you wish.
        BackgroundGeolocation.getCurrentPosition({
          samples: 1,
          persist: true,
        }).then(async (location) => {
          console.log("[getCurrentPosition] ", location);
          await sendLocation(location);
          console.log("Location sent from heartbeat");
        });
      });

      // Set up the location listener when tracking starts
      BackgroundGeolocation.onLocation(async (location) => {
        console.log("SBOX Location:", location);

        await sendLocation(location);
      });
    } else {
      // Stop background geolocation if tracking is stopped
      BackgroundGeolocation.stop();
    }

    // Cleanup listeners when the component unmounts or isTracking changes
    return () => {
      BackgroundGeolocation.removeListeners();
    };
  }, [isTracking]); // Dependency array will trigger this useEffect when isTracking changes

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
    async function loadFonts() {
      await Font.loadAsync({
        "Lexend-Bold": require("../assets/fonts/Lexend-Bold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
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

AppRegistry.registerComponent("main", () => App);

export default App;
