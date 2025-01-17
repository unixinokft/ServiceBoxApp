import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import supabase from "../app/utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Left from "../assets/Left.svg";
import PrivacyCheckBoxArea from "./PrivacyCheckBoxArea";
import GradientBackground from "./GradientBackground";

interface PrivacyPolicyScreenProps {
  email: string;
  setPrivacyAccepted: (accepted: boolean) => void;
}

export default function PrivacyPolicyScreen({
  email,
  setPrivacyAccepted,
}: PrivacyPolicyScreenProps) {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState("");

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchPrivacyPolicyAndUserData = async () => {
      try {
        // Fetch the privacy policy text
        const { data: policyData, error: policyError } = await supabase
          .from("privacy_policy")
          .select("privacy_policy")
          .single();

        if (policyError) {
          console.error("Error fetching privacy policy:", policyError);
          throw policyError;
        } else if (policyData) {
          setPrivacyPolicy(policyData.privacy_policy);
        }

        // Fetch the user's acceptance status
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("privacy_policy_accepted")
          .eq("email", email)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          throw userError;
        } else if (userData) {
          setIsAlreadyAccepted(userData.privacy_policy_accepted);
        }
      } catch (error) {
        console.error("Error during data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicyAndUserData();
  }, [email]);

  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ privacy_policy_accepted: true })
        .eq("email", email);

      if (error) {
        console.error("Error updating privacy policy status:", error);
        throw error;
      } else {
        setPrivacyAccepted(true);
      }
    } catch (error) {
      console.error("Error accepting privacy policy:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#13B981" />
      </View>
    );
  }

  return (
    <View
      style={{
        paddingTop: insets.top,
        flex: 1,
        paddingBottom: "15%",
        padding: "5%",
        backgroundColor: "black",
      }}
    >
      <GradientBackground />
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: "5%",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            isAlreadyAccepted
              ? setPrivacyAccepted(true)
              : supabase.auth.signOut();
          }}
        >
          <Left />
        </TouchableOpacity>
        <Text
          style={{
            color: "#FAFAFA",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Lexend-Bold",
          }}
        >
          Adatvédelmi nyilatkozat
        </Text>
        <View style={{ opacity: 0 }}>
          <Left />
        </View>
      </View>
      {privacyPolicy ? (
        <View
          style={{
            overflow: "hidden",
            flex: 1,
            borderRadius: 21,
            marginVertical: "5%",
          }}
        >
          <WebView
            originWhitelist={["*"]}
            source={{ html: privacyPolicy }}
            style={{ backgroundColor: "#3C4044" }}
            overScrollMode="never"
            javaScriptEnabled={true}
            mixedContentMode="always"
            contentMode="mobile"
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Nem sikerült betölteni az adatvédelmi nyilatkozatot.
          </Text>
        </View>
      )}
      {isAlreadyAccepted ? (
        <PrivacyCheckBoxArea value={true} />
      ) : (
        <View>
          <PrivacyCheckBoxArea value={accepted} onValueChange={setAccepted} />
          <TouchableOpacity
            style={[styles.button, !accepted && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={!accepted}
          >
            <Text style={styles.buttonText}>Tovább</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  button: {
    width: "100%",
    backgroundColor: "#13B981", // Zöld gomb
    padding: "5%",
    marginTop: "4%",
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#929292",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});
