import React, { useEffect, useState } from 'react';
import supabase from './utils/supabase';
import LoginScreen from '../components/LoginScreen';
import TrackingScreen from '../components/TrackingScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import PrivacyPolicyScreen from '../components/PrivacyPolicyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppRegistry, ActivityIndicator, StatusBar, View, Platform } from 'react-native'; // Import AppRegistry
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as TaskManager from 'expo-task-manager';
import * as Font from 'expo-font'; // Import Font API from Expo

const App = () => {

  const [session, setSession] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false); // Új állapot

  useEffect(() => {
    if (Platform.OS === "ios") {
      StatusBar.setBarStyle('light-content'); // White text/icons for iOS
    }
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

  let lastUpdateTimestamp = 0; // Initialize a timestamp to track last update

  // Függvény a Supabase-ben való hibák naplózására, és cache-elés, ha sikertelen
  /*async function logErrorToSupabase(code, message) {
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
        error_message: message,
        error_code: code,
        error_time,
      });

      // Ha a küldés sikeres, küldjük el a cache-elt hibákat is
      await sendCachedErrorsToDB();

    } catch (backendError) {
      console.error("Error logging GPS issue to Supabase: ", backendError);

      // Cache-eljük a hibát, ha nem sikerül elküldeni
      await cacheError({ code, message, error_time: getCurrentTimestamp() });
    }
  }*/

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

      // Ha a küldés sikeres, küldjük el a cache-elt helyadatokat és hibákat is
      await sendCachedLocationsToDB();
      //await sendCachedErrorsToDB();

    } catch (backendError) {
      console.error("Error saving location to Supabase: ", backendError);

      // Cache-eljük a helyadatokat, ha nem sikerül elküldeni
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

  // Cache-eljük a hibákat AsyncStorage-ben
  /*async function cacheError(error) {
    try {
      const cachedErrors = await AsyncStorage.getItem('cachedErrors');
      const errorsArray = cachedErrors ? JSON.parse(cachedErrors) : [];
      errorsArray.push(error);
      await AsyncStorage.setItem('cachedErrors', JSON.stringify(errorsArray));
      console.log("Error cached.");
    } catch (error) {
      console.error("Error caching GPS error: ", error);
    }
  }*/

  // Küldje el az összes cache-elt hibát a Supabase-be
  /*async function sendCachedErrorsToDB() {
    try {
      const cachedErrors = await AsyncStorage.getItem('cachedErrors');
      if (!cachedErrors) return;

      const errorsArray = JSON.parse(cachedErrors);
      if (errorsArray.length === 0) return;

      const user = await supabase.auth.getUser();
      const email = user.data.user?.email;

      if (!email) {
        console.error("User not authenticated.");
        return;
      }

      // Küldje el az összes cache-elt hibát
      await supabase.from('location_errors').insert(
        errorsArray.map(error => ({
          ...error,
          email: email,
        }))
      );

      // Törölje a cache-t, ha sikerült elküldeni az adatokat
      await AsyncStorage.removeItem('cachedErrors');
      console.log("Cached errors successfully sent to the DB.");
    } catch (error) {
      console.error("Error sending cached errors to Supabase: ", error);
    }
  }*/

  // TaskManager definíció
  TaskManager.defineTask('LOCATION_TASK', async ({ data, error }) => {
    console.log("AAAAAAAAA")
    console.log("Data: " + JSON.stringify(data))
    console.log(getCurrentTimestamp())
    console.log("Result bool: " + (Date.now() - lastUpdateTimestamp >= 60000))
    console.log("Result: " + (Date.now() - lastUpdateTimestamp))
    console.log("lastUpdateTimestamp: " + (lastUpdateTimestamp))
    console.log("Dét náv: " + (Date.now()))
    if (error) {
      console.error("error at LOCATION_TASK" + JSON.stringify(error))
      const { code, message } = error;
      //await logErrorToSupabase(code, message); // Hibák naplózása
      return;
    }

    if (data) {
      const { locations } = data;
      const { latitude, longitude } = locations[0].coords;

      // Ellenőrizze, hogy eltelt-e 1 perc az utolsó frissítés óta
      if (Date.now() - lastUpdateTimestamp >= 60000) {
        console.log("Save locations")
        await saveLocationToSupabase(latitude, longitude); // Helyadatok mentése
        console.log("Locations saved")
        lastUpdateTimestamp = Date.now(); // Időbélyeg frissítése
        console.log("lastUpdateTimestamp set: " + (lastUpdateTimestamp))
      }
    }
  });

  // Cache-eljük a helyadatokat AsyncStorage-ben
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

  // Küldje el az összes cache-elt helyadatot a Supabase-be
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

      // Küldje el az összes cache-elt helyadatot
      await supabase.from('locations').insert(
        locationsArray.map(location => ({
          ...location,
          email: email,
        }))
      );

      // Törölje a cache-t, ha sikerült elküldeni az adatokat
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