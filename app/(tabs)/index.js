import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../utils/supabase';
import LoginScreen from '../../components/LoginScreen';
import TrackingScreen from '../../components/TrackingScreen';
import WelcomeScreen from '../../components/WelcomeScreen';
import PrivacyPolicyScreen from '../../components/PrivacyPolicyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false); // Új állapot

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

          // Send data to Supabase
          await supabase.from('locations').insert({
            latitude,
            longitude,
            user_id: user.data.user?.id,
          });

          // Update last update timestamp
          lastUpdateTimestamp = currentTimestamp;

        } catch (backendError) {
          alert("Error saving location to Supabase: " + JSON.stringify(backendError));
        }
      } else {
        console.log("Skipping location update to respect 5-minute interval.");
      }
    }
  });

  useEffect(() => {
    const handleSession = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        if (rememberMe === 'false') {
          await supabase.auth.signOut();
        } else if (rememberMe === 'true') {
          // Ellenőrizzük az aktív session-t
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);

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

  return (
    <Stack.Navigator>
      {showWelcomeScreen && !session ? (
        <Stack.Screen
          name="Welcome"
          component={(props) => (
            <WelcomeScreen
              {...props}
              onContinue={() => setShowWelcomeScreen(false)}
            />
          )}
          options={{ headerShown: false }}
        />
      ) : session ? (
        // Ha még nem fogadták el az adatvédelmi nyilatkozatot
        privacyAccepted ? (
          <Stack.Screen
            name="Tracking"
            component={TrackingScreen}
            initialParams={{ setPrivacyAccepted: setPrivacyAccepted }}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            initialParams={{ email: session.user.email, setPrivacyAccepted: setPrivacyAccepted }}
            options={{ headerShown: false }}
          />
        )
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
