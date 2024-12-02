import React, { useEffect, useState } from 'react';
import supabase from './utils/supabase';
import LoginScreen from '../components/LoginScreen';
import TrackingScreen from '../components/TrackingScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import PrivacyPolicyScreen from '../components/PrivacyPolicyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppRegistry, Platform, StatusBar } from 'react-native'; // Import AppRegistry
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as TaskManager from 'expo-task-manager';
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
            console.log("user logged in")
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

  TaskManager.defineTask('LOCATION_TASK', async ({ data, error }) => {
    if (error) {
      alert("Error in location task: " + JSON.stringify(error));
      return;
    }

    if (data) {
      const { locations } = data;
      const { latitude, longitude } = locations[0].coords;

      // Get the current timestamp
      const currentTimestamp = Date.now();

      // Check if 5 minutes (300000 ms) have passed since the last update
      if (currentTimestamp - lastUpdateTimestamp >= 300000) {
        try {
          const user = await supabase.auth.getUser();
          const email = user.data.user?.email;

          if (!email) {
            console.error("User not authenticated.");
            return;
          }

          const device_time = new Date().toISOString(); // Current date and time

          // Attempt to send the data to Supabase
          await supabase.from('locations').insert({
            latitude,
            longitude,
            email: email,
            device_time,
          });

          // Clear any cached locations since we're able to send data now
          await sendCachedLocationsToDB();

          // Update last update timestamp
          lastUpdateTimestamp = currentTimestamp;

        } catch (backendError) {
          console.error("Error saving location to Supabase: ", backendError);

          // Cache the location if sending fails
          await cacheLocation({ latitude, longitude, device_time });
        }
      } else {
        console.log("Skipping location update to respect 5-minute interval.");
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