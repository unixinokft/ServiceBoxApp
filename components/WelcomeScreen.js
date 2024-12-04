import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import SvgServiceBoxLogo from "../assets/ServiceBoxLogo.svg";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BBoxLogo from './BBoxLogo';
import GradientBackground from "./GradientBackground"

export default function WelcomeScreen({ onContinue }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ paddingTop: insets.top, ...styles.container }}>
            <GradientBackground />
            {/* Use flex to center the logo */}
            <View style={styles.logoContainer}>
                <SvgServiceBoxLogo />
            </View>
            <TouchableOpacity style={styles.button} onPress={onContinue}>
                <Text style={styles.buttonText}>Kezdj neki</Text>
            </TouchableOpacity>
            <View style={styles.logoContainerBBOX}>
                <BBoxLogo />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end", // This keeps the button at the bottom
        alignItems: "center", // Centers all content horizontally
        padding: 16,
        backgroundColor: "#1c1c1e", // Dark gray background
    },
    logoContainer: {
        flex: 1, // This ensures the container takes up available space
        justifyContent: "center", // Centers logo vertically
        alignItems: "center", // Centers logo horizontally
        position: "absolute", // Keeps it fixed while other components are pushed below
        top: "30%", // Starts from the top of the container
    },
    logoContainerBBOX: {
        marginBottom: "5%", // Gives margin to the bottom logo
    },
    button: {
        width: "100%",
        backgroundColor: "#13B981", // Green button
        padding: 20,
        borderRadius: 30,
        alignItems: "center",
        position: "relative", // Keeps the button placed at the bottom
        zIndex: 1, // Ensures the button appears on top of other elements
        marginBottom: "10%"
    },
    buttonText: {
        color: "#fff",
        fontWeight: "500",
        fontSize: 16,
    },
});
