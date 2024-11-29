import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Animated, TouchableOpacity, Button, Platform } from 'react-native';
import supabase from '../app/utils/supabase';
import SvgServiceBoxLogo from "../assets/ServiceBoxLogo.svg"; // Az SVG fájl importja
import ChillBruh from "../assets/pihenek.svg"; // Az SVG fájl importja
import Working from "../assets/dolgozom.svg"; // Az SVG fájl importja
import BBOX from "../assets/bbox.svg";
// import * as Location from 'expo-location';

export default function TrackingScreen({ navigation, route }) {
  const [isTracking, setIsTracking] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);


  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, []);

  /*useEffect(() => {
    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isTracking]);

  const startLocationTracking = async () => {
    try {
      let responseLocationReq = await Location.requestForegroundPermissionsAsync();
      //alert(JSON.stringify(responseLocationReq))
      if (responseLocationReq.status !== 'granted') {
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
        showsBackgroundLocationIndicator: true,
      });
      //alert("Location tracking started successfully");
    } catch (error) {
      alert("Error starting location tracking", JSON.stringify(error));
    }
  };

  const stopLocationTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('LOCATION_TASK');
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync('LOCATION_TASK');
        //alert("Location tracking stopped");
      } else {
        //alert("Location tracking is not active");
      }
    } catch (error) {
      alert("Error stopping location tracking", JSON.stringify(error));
    }
  };*/

  const handleLogout = async () => {
    await supabase.auth.signOut();
    route.params.setSession(null)
  };

  const handlePrivacy = async () => {
    route.params.setPrivacyAccepted(false)
  };

  const fadeAnim = useRef(new Animated.Value(1)).current; // Kezdő animáció értéke
  const [currentImage, setCurrentImage] = useState(
    require('../assets/bg_pihenek.png') // Az első háttérkép útvonala
  );

  const handlePress = () => {
    // Gomb nyomás állapotának változtatása
    setIsTracking(!isTracking);

    // Indítsd az animációt
    Animated.timing(fadeAnim, {
      toValue: 0, // Teljes halványulás
      duration: 500, // 2 másodperc
      useNativeDriver: true,
    }).start(() => {
      // Cseréljük ki a háttérképet az animáció után
      setCurrentImage(
        isTracking
          ? require('../assets/bg_pihenek.png') // Első háttérkép
          : require('../assets/bg_dolgozom.png') // Második háttérkép
      );

      // Újraindítsuk az animációt (visszaállítjuk az áttetszőségét)
      Animated.timing(fadeAnim, {
        toValue: 1, // Teljesen láthatóvá válik
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "#FAFAFA", width: 80, height: Platform.OS === "ios" ? 40 : 33, position: "absolute", zIndex: 9999 }}>
        <Button
          name="log-out"
          backgroundColor="#ff4d4d"
          onPress={handleLogout}
          title={"Logout"}
        />
      </View>
      {/* Háttér animációval */}
      <Animated.Image
        source={currentImage}
        style={[styles.background, { opacity: fadeAnim }]}
      />

      {/* Fő tartalom */}
      <View style={styles.overlay}>
        <View style={styles.logoContainer}>
          <SvgServiceBoxLogo />
        </View>
        <Text style={styles.title}>Válaszd ki az állapotod</Text>
        <Text style={styles.subtitle}>
          Állítsd be, hogy mi a jelenlegi státuszod a munkavégzés során
        </Text>

        {/* Interaktív gomb */}
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          {isTracking ? <Working></Working> : <ChillBruh></ChillBruh>}
        </TouchableOpacity>
        <BBOX />
        {/* Adatkezelési tájékoztató */}
        <TouchableOpacity style={{ marginBottom: "10%" }} onPress={handlePrivacy}>
          <Text style={styles.privacyText}>Adatkezelési tájékoztató</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: "5%",
  },
  title: {
    color: "#FAFAFA",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: "5%",
    alignSelf: "flex-start",
    paddingRight: "30%"
  },
  subtitle: {
    marginTop: "5%",
    paddingRight: "30%",
    color: "#929292"
  },
  button: {
    borderRadius: 25,
    alignSelf: "center",
    margin: "10%",
    marginBottom: "20%"
  },
  privacyText: {
    fontSize: 14,
    color: '#fff',
    textDecorationLine: 'underline',
    marginTop: 20,
    fontWeight: "500"
  },
  logoContainer: {
    flex: 1, // This ensures the container takes up available space
    justifyContent: "center", // Centers logo vertically
    alignItems: "center", // Centers logo horizontally
    position: "absolute", // Keeps it fixed while other components are pushed below
    top: "30%", // Starts from the top of the container
  },
});
