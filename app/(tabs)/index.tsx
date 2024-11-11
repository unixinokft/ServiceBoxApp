import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../utils/supabase';
import * as TaskManager from 'expo-task-manager';

import LoginScreen from '../../components/LoginScreen';
import TrackingScreen from '../../components/TrackingScreen';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for session changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => setSession(session)
    );

    return () => {
      //listener?.unsubscribe();
    };
  }, []);

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
      if (currentTimestamp - lastUpdateTimestamp >= 10000) {
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

  return (
      <Stack.Navigator>
        {session ? (
          <Stack.Screen name="Tracking" component={TrackingScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
  );
}
