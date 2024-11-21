import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../utils/supabase';
import { AppState } from 'react-native';
import LoginScreen from '../../components/LoginScreen';
import TrackingScreen from '../../components/TrackingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {

    async function handleSession() {

      try {
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        console.log(rememberMe)
        if (rememberMe === 'false') {
          await supabase.auth.signOut();
          console.log("User logged out due to 'rememberMe: false'");
        } else if (rememberMe === "true") {
          // Check for active session on load
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
          });
        }
      } catch (error) {
        console.error('Error checking rememberMe state:', error);
      }

    }
    handleSession()

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
  console.log(session)

  return (
    <Stack.Navigator>
      {session ? (
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{ headerShown: false }}
        />
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
