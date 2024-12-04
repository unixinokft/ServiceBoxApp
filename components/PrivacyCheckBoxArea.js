import React from 'react'
import CheckBox from "expo-checkbox"
import { View, Text, StyleSheet } from "react-native";

const PrivacyCheckBoxArea = ({ value, onValueChange }) => {
  return (
    <View style={{ justifyContent: "space-between", ...styles.actionContainer, maxWidth: 400 }}>
      <CheckBox value={value} onValueChange={onValueChange} disabled={!onValueChange} />
      <Text style={styles.checkboxText}>Elfogadom az adatvédelmi nyilatkozatot</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "4%",
    paddingRight: "5%",
    maxWidth: 400,
    justifyContent: "space-between",
    color: "#FAFAFA"
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FAFAFA"
  }
});

export default PrivacyCheckBoxArea