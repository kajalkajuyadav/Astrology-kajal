import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");

const Splash = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Light status bar icons for dark background */}
      <StatusBar barStyle="dark-content" backgroundColor="#10141d" />

      <LinearGradient
        colors={["#10141d", "#06080c"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* HEADER: Fixes logo squeezing and progress bar overlapping */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../img/WorkTracklogoh.png")}
              style={styles.topLogo}
              resizeMode="contain"
            />
          </View>
          
          {/* Top Progress Bar with safety margins */}
          <View style={styles.progressContainer}>
            <LinearGradient
              colors={["#00d2ff", "#9d50bb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBar}
            />
          </View>
        </View>

        {/* HERO SECTION: Large Central Logo with Soft Glassmorphic Glow */}
        <View style={styles.heroContainer}>
          <View style={styles.logoGlowWrapper}>
            <Image
              source={require("../img/WorkTracklogo.png")}
              style={styles.centerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* CONTENT SECTION: Modern Typography */}
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>
            Welcome to{"\n"}
            WorkTrack <Text style={styles.headingAccent}>360</Text>
          </Text>

          <Text style={styles.description}>
            Smart Employee Tracking and{"\n"}Automation Platform.
          </Text>
        </View>

        {/* FOOTER: Premium Action Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("TermsOfService")}
          activeOpacity={0.85}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={["#00d2ff", "#9d50bb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <View style={styles.buttonIconContainer}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06080c",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  /* Header Styles */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 50,
  },
  logoWrapper: {
    width: 130, // Rigid width prevents squeezing
    height: 40,
    justifyContent: "center",
  },
  topLogo: {
    width: "100%",
    height: "100%",
  },
  progressContainer: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginLeft: 20, // Prevents overlapping with the logo
    overflow: "hidden",
  },
  progressBar: {
    width: "25%", 
    height: "100%",
  },
  /* Hero Logo Styles */
  heroContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  logoGlowWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    // Premium soft glow
    shadowColor: "#00d2ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 12,
  },
  centerLogo: {
    width: 110,
    height: 110,
  },
  /* Typography Styles */
  contentContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  heading: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 44,
  },
  headingAccent: {
    color: "#00d2ff",
  },
  description: {
    color: "#a0a0a0",
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
    lineHeight: 26,
    fontWeight: "400",
  },
  /* Button Styles */
  buttonWrapper: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    height: 60,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#00d2ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonIconContainer: {
    marginLeft: 5,
  },
  arrowIcon: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },
});