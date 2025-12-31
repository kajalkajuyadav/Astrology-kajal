import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Wallet = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
    </View>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 10,
  },
});
