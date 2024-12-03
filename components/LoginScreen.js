import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Keyboard,
  Platform,
} from "react-native";
import supabase from "../app/utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SvgServiceBoxLogo from "../assets/ServiceBoxLogo.svg"; // Az SVG fájl importja
import { Switch } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BG from "../assets/bg.svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // Track keyboard visibility
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const { height } = event.endCoordinates;
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "missing email or phone" || "Invalid login credentials" ? "Nem megfelelő email vagy jelszó" : error.message);
      const regUsers = false
      // Special handling for test user sign-up
      if (email === "test@test.com" && regUsers) {
        try {
          const emailList = [
            { email: "t.schaller@bbox.hu", password: "3748" },
            { email: "o.babik@bbox.hu", password: "9124" },
            { email: "z.szabo@bbox.hu", password: "5286" },
            { email: "p.kovacs@bbox.hu", password: "6391" },
            { email: "a.szantai@bbox.hu", password: "7452" },
            { email: "l.boldog@bbox.hu", password: "1835" },
            { email: "b.balog@bbox.hu", password: "2769" },
            { email: "m.cseszko@bbox.hu", password: "4583" },
            { email: "n.esik@bbox.hu", password: "9027" },
            { email: "d.peszteritz@bbox.hu", password: "6148" },
            { email: "k.domok@bbox.hu", password: "3875" },
            { email: "m.karda@bbox.hu", password: "5439" }
          ];
          console.log("Trying to sign up");
          const { data, error: signUpError } =
            await supabase.auth.admin.createUser({
              email: email,
              password: password,
              email_confirm: true,
            });

          if (signUpError) {
            alert(signUpError.message);
          }
        } catch (catchError) {
          alert(catchError.message);
        }
      }
    } else {
      // Store rememberMe choice in AsyncStorage
      try {
        await AsyncStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      } catch (storageError) {
        console.error("Failed to save rememberMe state:", storageError);
      }
    }
  };

  return (
    <View style={{ paddingTop: insets.top, marginBottom: Platform.OS === "ios" ? keyboardHeight : 0, ...styles.container }}>
      <View
        style={{
          position: "absolute",
          top: 0,
        }}
      >
        <BG width={Dimensions.get("screen").width} height={Dimensions.get("screen").height} />
      </View>
      {!isKeyboardVisible && ( // Hide the logo when the keyboard is visible
        <View style={styles.logoContainer}>
          <SvgServiceBoxLogo />
        </View>
      )}
      <Text
        style={{
          color: "#FAFAFA",
          //fontFamily: "Lexend-Bold",
          fontSize: 30,
          fontWeight: 700,
          marginBottom: "5%",
          alignSelf: "flex-start",
          fontFamily: 'Lexend-Bold',
        }}
      >
        Bejelentkezés
      </Text>
      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: 400,
          marginBottom: "2%",
          alignSelf: "flex-start",
        }}
      >
        Email
      </Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={(v) => {
          setEmail(v.trim().toLowerCase());
        }}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"  // Prevent automatic capitalization
        autoCorrect={false}    // Disable autocorrect
        accessible={true}      // Enable accessibility features
        accessibilityLabel="Email input field"
      />
      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: 400,
          marginBottom: "2%",
          alignSelf: "flex-start",
        }}
      >
        Jelszó
      </Text>
      <TextInput
        placeholder="••••••••••"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.rememberMeContainer}>
        <Switch
          value={rememberMe}
          onValueChange={setRememberMe}
          thumbColor={rememberMe ? "#FFFFFF" : "#3F4448"} // Thumb color
          trackColor={{ false: "#1C1C1E", true: "#3F4448" }} // Track color
          style={styles.switch}
        />
        <Text style={styles.rememberMeText}>Emlékezz rám</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Bejelentkezés</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: "15%",
    alignItems: "center",
    padding: "5%",
    backgroundColor: "#1c1c1e", // Háttérszín sötét szürke
  },
  logoContainer: {
    flex: 1, // This ensures the container takes up available space
    justifyContent: "center", // Centers logo vertically
    alignItems: "center", // Centers logo horizontally
    position: "absolute", // Keeps it fixed while other components are pushed below
    top: "30%", // Starts from the top of the container
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#444", // Halvány szürke border
    backgroundColor: "white", // Fehér háttér
    padding: 12,
    borderRadius: 8,
    marginBottom: "5%",
    color: "black", // Szöveg színe fekete
  },
  error: {
    color: "red",
    marginBottom: 16,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "6%",
    alignSelf: "flex-start",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [{ scaleX: 1.2 }, { scaleY: 1.2 }], // Slightly larger switch
    marginRight: 10, // Space between switch and text
  },
  rememberMeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  button: {
    width: "100%",
    backgroundColor: "#13B981", // Zöld gomb
    padding: 20,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
});
