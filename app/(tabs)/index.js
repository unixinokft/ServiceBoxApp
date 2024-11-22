import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../utils/supabase';
import { AppState } from 'react-native';
import LoginScreen from '../../components/LoginScreen';
import TrackingScreen from '../../components/TrackingScreen';
import WelcomeScreen from '../../components/WelcomeScreen'; // New screen
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true); // State to track WelcomeScreen

  useEffect(() => {
    async function handleSession() {
      try {
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        if (rememberMe === 'false') {
          await supabase.auth.signOut();
        } else if (rememberMe === 'true') {
          // Check for active session on load
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
          });
        }
      } catch (error) {
        console.error('Error checking rememberMe state:', error);
      }
    }

    handleSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else {
        setSession(session);
      }
    });
  }, []);

  return (
    <Stack.Navigator>
      {showWelcomeScreen && !session ? (
        <Stack.Screen
          name="Welcome"
          component={(props) => (
            <WelcomeScreen
              {...props}
              onContinue={() => setShowWelcomeScreen(false)} // Pass a handler to navigate away
            />
          )}
          options={{ headerShown: false }}
        />
      ) : session ? (
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
