import React, { useEffect, useState } from 'react';
import supabase from './utils/supabase';
import LoginScreen from '../components/LoginScreen';
import TrackingScreen from '../components/TrackingScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import PrivacyPolicyScreen from '../components/PrivacyPolicyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppRegistry, ActivityIndicator, StatusBar, View } from 'react-native'; // Import AppRegistry
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as TaskManager from 'expo-task-manager';
import * as Font from 'expo-font'; // Import Font API from Expo

const App = () => {

  const [session, setSession] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false); // Új állapot

  useEffect(() => {
    StatusBar.setBarStyle('light-content'); // White text/icons for both iOS and Android
  }, []);

  useEffect(() => {
    const handleSession = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        if (rememberMe === 'false') {
          await supabase.auth.signOut();
        } else {
          // Ellenőrizzük az aktív session-t
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        console.error('Error checking rememberMe state or session:', error);
      }
    };

    handleSession();

    // Listen for auth state changes with a 1-second delay
    setTimeout(() => {
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_OUT") {
            setSession(false);
          } else {
            setSession(session);
          }
        }
      );
    }, 1000); // Delay of 1 second
  }, []);

  useEffect(() => {
    const checkPrivacy = async () => {
      try {
        if (session) {
          // Adatvédelmi nyilatkozat elfogadásának ellenőrzése
          if (session?.user) {
            const { data, error } = await supabase
              .from('users')
              .select('privacy_policy_accepted')
              .eq('email', session.user.email)
              .single();

            if (error) {
              console.error('Error checking privacy policy status:', error);
            } else {
              setPrivacyAccepted(data?.privacy_policy_accepted || false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking privacy policy:', error);
      }
    }
    checkPrivacy()

  }, [session])

  // Objektum a hibakódok magyar nyelvű fordításához
  const locationErrorMessages = {
    E_LOCATION_UNAVAILABLE: "A helyszolgáltatás nem elérhető. Lehet, hogy nincs GPS jel, vagy a helymeghatározás ki van kapcsolva.",
    E_LOCATION_PERMISSION_DENIED: "A felhasználó megtagadta a helymeghatározási engedélyt.",
    E_LOCATION_SETTINGS_UNSATISFIED: "A helymeghatározási beállítások nem megfelelőek (például a GPS ki van kapcsolva).",
    E_LOCATION_TIMEOUT: "A helymeghatározás időtúllépés miatt nem sikerült.",
    E_LOCATION_UNKNOWN: "Ismeretlen hiba történt a helymeghatározás során."
  };

  // Hibakezelő függvény
  function getLocationErrorMessage(errorCode) {
    return locationErrorMessages[errorCode] || "Ismeretlen hibakód.";
  }

  let lastUpdateTimestamp = 0; // Initialize a timestamp to track last update

  // Függvény a Supabase-ben való hibák naplózására
  async function logErrorToSupabase(code, message) {
    try {
      const user = await supabase.auth.getUser();
      const email = user.data.user?.email;
      if (!email) {
        console.error("User not authenticated.");
        return;
      }

      const error_time = getCurrentTimestamp();

      await supabase.from('location_errors').insert({
        email,
        error_message_hun: getLocationErrorMessage(code),
        error_message: message,
        error_code: code,
        error_time,
      });
    } catch (backendError) {
      console.error("Error logging GPS issue to Supabase: ", backendError);
    }
  }

  // Függvény a helyadatok mentésére a Supabase-be
  async function saveLocationToSupabase(latitude, longitude) {
    try {
      const user = await supabase.auth.getUser();
      const email = user.data.user?.email;
      if (!email) {
        console.error("User not authenticated.");
        return;
      }

      const device_time = getCurrentTimestamp();

      await supabase.from('locations').insert({
        latitude,
        longitude,
        email,
        device_time,
      });

      await sendCachedLocationsToDB(); // Tárolt adatok küldése
    } catch (backendError) {
      console.error("Error saving location to Supabase: ", backendError);
      await cacheLocation({ latitude, longitude, device_time });
    }
  }

  // Aktuális időbélyeg formázott lekérése
  function getCurrentTimestamp() {
    return new Date().toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, '.').replace(',', '');
  }

  // TaskManager definíció
  TaskManager.defineTask('LOCATION_TASK', async ({ data, error }) => {
    if (error) {
      const { code, message } = error;
      await logErrorToSupabase(code, message); // Hibák naplózása
      return;
    }

    if (data) {
      const { locations } = data;
      const { latitude, longitude } = locations[0].coords;

      // Ellenőrizze, hogy eltelt-e 1 perc az utolsó frissítés óta
      if (Date.now() - lastUpdateTimestamp >= 60000) {
        await saveLocationToSupabase(latitude, longitude); // Helyadatok mentése
        lastUpdateTimestamp = Date.now(); // Időbélyeg frissítése
      }
    }
  });


  /**
   * Cache the location in AsyncStorage if it cannot be sent to the DB.
   * @param {Object} location The location object containing latitude, longitude, and device_time.
   */
  async function cacheLocation(location) {
    try {
      const cachedLocations = await AsyncStorage.getItem('cachedLocations');
      const locationsArray = cachedLocations ? JSON.parse(cachedLocations) : [];
      locationsArray.push(location);
      await AsyncStorage.setItem('cachedLocations', JSON.stringify(locationsArray));
      console.log("Location cached.");
    } catch (error) {
      console.error("Error caching location: ", error);
    }
  }

  /**
   * Send all cached locations to the database.
   */
  async function sendCachedLocationsToDB() {
    try {
      const cachedLocations = await AsyncStorage.getItem('cachedLocations');
      if (!cachedLocations) return;

      const locationsArray = JSON.parse(cachedLocations);
      if (locationsArray.length === 0) return;

      const user = await supabase.auth.getUser();
      const email = user.data.user?.email;

      if (!email) {
        console.error("User not authenticated.");
        return;
      }

      // Attempt to send all cached locations in bulk
      await supabase.from('locations').insert(
        locationsArray.map(location => ({
          ...location,
          email: email,
        }))
      );

      // Clear the cache if the data was successfully sent
      await AsyncStorage.removeItem('cachedLocations');
      console.log("Cached locations successfully sent to the DB.");
    } catch (error) {
      console.error("Error sending cached locations to Supabase: ", error);
    }

  }
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load fonts using useEffect
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Lexend-Bold': require('../assets/fonts/Lexend-Bold.ttf'),
      });
      setFontsLoaded(true); // Set state to true once fonts are loaded
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        {showWelcomeScreen && !session ? (
          <WelcomeScreen
            onContinue={() => setShowWelcomeScreen(false)}
          />
        ) : session ? (
          privacyAccepted ? (
            <TrackingScreen
              setPrivacyAccepted={setPrivacyAccepted}
              setSession={setSession}
            />
          ) : (
            <PrivacyPolicyScreen
              email={session.user.email}
              setPrivacyAccepted={setPrivacyAccepted}
            />
          )
        ) : (
          <LoginScreen />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Register the root component
AppRegistry.registerComponent('main', () => App);

export default App;