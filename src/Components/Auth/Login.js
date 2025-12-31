import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  BackHandler,
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // No longer needed here
// import BaseUrl from "../../url/env"; // No longer needed here
import { loginUser } from "../Auth/authService"; // ⬅️ NEW: Import the API function
import { useFocusEffect } from "@react-navigation/native";
// const LOGIN_URL = `${BaseUrl}/signin`; // No longer needed here

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);



useFocusEffect(
  React.useCallback(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove(); // ⬅️ IMPORTANT
  }, [])
);



  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      console.log("TOAST MESSAGE:", msg);
    }
  };

  const handleLogin = async () => {
    console.log("--------------------------------------------------");
    console.log("🔵 LOGIN ATTEMPT STARTED");

    // --- Validation Logic ---
    if (!phone.trim()) {
      showToast("Phone number is required.");
      return;
    }
    if (!password.trim()) {
      showToast("Password is required.");
      return;
    }
    // ------------------------

    setLoading(true);

    // 🔑 UPDATED: Call the external API function
    const result = await loginUser(phone, password);
    
    setLoading(false);
    console.log("🏁 Login Process Finished (Loading stopped)");
    console.log("--------------------------------------------------");


    if (result.success) {
      showToast(result.message);
      // Navigation is the UI-specific action, so it remains here
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTabs" }],
      });
    } else {
      // Display the error message returned from the service
      showToast(result.message);
    }
  };

  return (
    // ... (Your UI rendering code remains the same) ...
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Login to your HRMS account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Image
                    source={
                      isPasswordVisible
                        ? require('../img/open-eye.png')
                        : require('../img/eye.png')
                    }
                    style={{
                      width: 20,
                      height: 20,
                      tintColor: "#0d2554ff",
                      resizeMode: 'contain'
                    }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>LOGIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
    // ... (Your styles remain the same) ...
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
      },
      container: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
      },
      card: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
      },
      subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 24,
      },
      inputGroup: {
        marginBottom: 16,
      },
      label: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 6,
        fontWeight: "500",
      },
      input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
        backgroundColor: "#F9FAFB",
      },
      inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 12,
      },
      inputField: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
      },
      eyeIcon: {
        paddingLeft: 8,
      },
      button: {
        marginTop: 8,
        backgroundColor: "#3B82F6",
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
      },
      buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
      },
});