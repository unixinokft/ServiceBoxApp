import React from "react";
import CheckBox from "expo-checkbox";
import { View, Text, StyleSheet } from "react-native";

interface PrivacyCheckBoxAreaProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
}

const PrivacyCheckBoxArea: React.FC<PrivacyCheckBoxAreaProps> = ({
  value,
  onValueChange,
}) => {
  return (
    <View style={styles.actionContainer}>
      <CheckBox
        value={value}
        onValueChange={onValueChange}
        disabled={!onValueChange}
      />
      <Text style={styles.checkboxText}>
        Elfogadom az adatvédelmi nyilatkozatot
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: "4%",
    paddingRight: "5%",
    maxWidth: 400,
    justifyContent: "space-between",
    color: "#FAFAFA",
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FAFAFA",
  },
});

export default PrivacyCheckBoxArea;
