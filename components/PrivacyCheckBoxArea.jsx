import React from 'react'
import CheckBox from "expo-checkbox"
import { View, Text, StyleSheet } from "react-native";

const PrivacyCheckBoxArea = ({value, onValueChange}) => {
  return (
    <View style={styles.actionContainer}>
    <CheckBox value={value} onValueChange={onValueChange} disabled={!onValueChange} />
    <Text style={styles.checkboxText}>Elfogadom az adatvédelmi nyilatkozatot</Text>
</View>
  )
}

const styles = StyleSheet.create({
    actionContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: "4%",
        paddingRight: "5%",
        color: "#FAFAFA"
    },
    checkboxText: {
        marginLeft: 8,
        fontSize: 16,
        color: "#FAFAFA"
    }
});

export default PrivacyCheckBoxArea