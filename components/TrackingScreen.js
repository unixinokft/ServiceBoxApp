import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, AppState, Button } from 'react-native';
import { supabase } from '../app/utils/supabase';
import * as Location from 'expo-location';

export default function TrackingScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isTracking]);

  const startLocationTracking = async () => {
    try {
      let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        alert('Foreground location permission not granted');
        return;
      }

      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        alert('Background location permission not granted');
        return;
      }

      await Location.startLocationUpdatesAsync('LOCATION_TASK', {
        accuracy: Location.Accuracy.High,
        timeInterval: 300000,
        distanceInterval: 50,
        showsBackgroundLocationIndicator: true,
      });
      alert("Location tracking started successfully");
    } catch (error) {
      console.error("Error starting location tracking", error);
      alert("Issue while starting location tracking");
    }
  };

  const stopLocationTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('LOCATION_TASK');
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync('LOCATION_TASK');
        alert("Location tracking stopped");
      } else {
        alert("Location tracking is not active");
      }
    } catch (error) {
      console.error("Error stopping location tracking", error);
      alert("Issue while stopping location tracking");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text>Enable Location Tracking</Text>
      <Switch value={isTracking} onValueChange={setIsTracking} />
      <Button
        name="log-out"
        backgroundColor="#ff4d4d"
        onPress={handleLogout}
        title={"Logout"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
