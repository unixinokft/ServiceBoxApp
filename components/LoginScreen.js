import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { supabase } from "../app/utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SvgServiceBoxLogo from "../assets/ServiceBoxLogo.svg"; // Az SVG fájl importja
import { Switch } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);

      // Special handling for test user sign-up
      if (email === "test@test.com") {
        try {
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


  const colorList = [
    { offset: "0%", color: "#000000", opacity: "1" }, // Color Stop 2
    { offset: "100%", color: "#2F3438", opacity: "1" }, // Color Stop 1
  ];
  console.log(email)

  return (
    <View style={{ paddingTop: insets.top, ...styles.container }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          width: Dimensions.get("screen").width,
          height: Dimensions.get("screen").height - insets.top,
        }}
      >
      </View>
      <View style={styles.logoContainer}>
        <SvgServiceBoxLogo />
      </View>
      <Text
        style={{
          color: "#FAFAFA",
          fontFamily: "Lexend-Bold",
          fontSize: 30,
          fontWeight: 700,
          marginBottom: "5%",
          alignSelf: "flex-start",
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
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
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
        placeholder="Jelszó"
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
    padding: 16,
    backgroundColor: "#1c1c1e", // Háttérszín sötét szürke
  },
  logoContainer: {
    marginBottom: "30%",
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
    marginTop: "-2%",
    alignSelf: "flex-start",
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }], // Slightly larger switch
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
