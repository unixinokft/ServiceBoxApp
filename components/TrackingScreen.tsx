import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import supabase from "../app/utils/supabase";
import SvgServiceBoxLogo from "../assets/ServiceBoxLogo.svg";
import ChillBruh from "../assets/pihenek.svg";
import Working from "../assets/dolgozom.svg";
import Logout from "../assets/images/logout.svg";
import BBoxLogo from "./BBoxLogo";

interface TrackingScreenProps {
  isTracking: boolean;
  setIsTracking: (isTracking: boolean) => void;
  setSession: (session: any) => void;
  setPrivacyAccepted: (accepted: boolean) => void;
}

export default function TrackingScreen({
  isTracking,
  setIsTracking,
  setSession,
  setPrivacyAccepted,
}: TrackingScreenProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentImage, setCurrentImage] = useState(
    require("../assets/bg_pihenek.png")
  ); // Default background image

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  const handleLogout = async () => {
    if (isTracking) {
      setIsTracking(false);
    }
    await supabase.auth.signOut();
    setSession(null);
  };

  const handlePrivacy = () => {
    setPrivacyAccepted(false);
  };

  const handlePress = () => {
    setIsTracking(!isTracking);

    // Start the fade-out animation
    Animated.timing(fadeAnim, {
      toValue: 0, // Fully transparent
      duration: 500, // 0.5 seconds
      useNativeDriver: true,
    }).start(() => {
      // Change the background image after fade-out
      setCurrentImage(
        isTracking
          ? require("../assets/bg_pihenek.png") // Default background
          : require("../assets/bg_dolgozom.png") // Alternate background
      );

      // Start the fade-in animation
      Animated.timing(fadeAnim, {
        toValue: 1, // Fully visible
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  let btnWidth = Dimensions.get("screen").width * 0.9;
  btnWidth = btnWidth > 500 ? 500 : btnWidth;
  const magicNumber = 3.916;
  const btnHeight = btnWidth / magicNumber;
  const titleFontSize = btnHeight / 3;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{
          position: "absolute",
          zIndex: 9999,
          right: "5%",
          top: "7.61%",
        }}
        onPress={handleLogout}
      >
        <Logout />
      </TouchableOpacity>

      <Animated.Image
        source={currentImage}
        style={[styles.background, { opacity: fadeAnim }]}
      />

      <View style={{ width: btnWidth, ...styles.overlay }}>
        <View style={styles.logoContainer}>
          <SvgServiceBoxLogo />
        </View>
        <View style={{ paddingRight: "30%", width: "100%" }}>
          <Text
            style={{
              fontSize: titleFontSize,
              lineHeight: titleFontSize + 2,
              ...styles.title,
            }}
          >
            Válaszd ki az állapotod
          </Text>
          <Text style={{ fontSize: titleFontSize / 2, ...styles.subtitle }}>
            Állítsd be, hogy mi a jelenlegi státuszod a munkavégzés során
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePress}>
          {isTracking ? (
            <Working width={btnWidth} height={btnHeight} />
          ) : (
            <ChillBruh width={btnWidth} height={btnHeight} />
          )}
        </TouchableOpacity>
        <BBoxLogo />
        <TouchableOpacity
          style={{ marginBottom: "10%" }}
          onPress={handlePrivacy}
        >
          <Text style={styles.privacyText}>Adatkezelési tájékoztató</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "center",
  },
  title: {
    color: "#FAFAFA",
    fontWeight: "700",
    marginTop: "5%",
    alignSelf: "flex-start",
    fontFamily: "Lexend-Bold",
  },
  subtitle: {
    marginTop: "5%",
    color: "#929292",
  },
  button: {
    borderRadius: 25,
    alignSelf: "center",
    marginTop: "10%",
    marginBottom: "20%",
  },
  privacyText: {
    fontSize: 14,
    color: "#fff",
    textDecorationLine: "underline",
    marginTop: 20,
    fontWeight: "500",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "30%",
  },
});
