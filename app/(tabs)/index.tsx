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

  TaskManager.defineTask('LOCATION_TASK', async ({ data, error }) => {
    if (error) {
      alert("Error in location task", error);
      return;
    }
    if (data) {
      const { locations } = data;
      const { latitude, longitude } = locations[0].coords;
      try {
        const user =await  supabase.auth.getUser()
        //alert(JSON.stringify({ latitude, longitude, user_id: user.data.user?.id }));
        await supabase.from('locations').insert({ latitude, longitude, user_id: user.data.user?.id });
      } catch (backendError) {
        alert("Error saving location to Supabase"+ JSON.stringify(backendError));
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
