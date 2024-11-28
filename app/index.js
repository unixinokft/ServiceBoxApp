import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './utils/supabase';
import LoginScreen from '../components/LoginScreen';
import TrackingScreen from '../components/TrackingScreen';
import WelcomeScreen from '../components/WelcomeScreen';
import PrivacyPolicyScreen from '../components/PrivacyPolicyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {

  const Stack = createStackNavigator();

  const [session, setSession] = useState(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false); // Új állapot

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

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
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
                initialParams={{ setPrivacyAccepted: setPrivacyAccepted, setSession: setSession }}
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
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
