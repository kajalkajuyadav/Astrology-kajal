import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";

const TermsOfService = () => {
  const navigation = useNavigation();
  const [checked, setChecked] = useState(false);

  const openAdminPortal = () => {
    Linking.openURL("https://admin.canxinternational.in/home");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
      />

      <LinearGradient
        colors={["#10141d", "#06080c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topHeader}>
          <Image
            source={require("../img/WorkTracklogoh.png")}
            style={styles.topLogo}
            resizeMode="contain"
          />
           <View style={styles.progressBar}>
            <LinearGradient
              colors={["#00d2ff", "#9d50bb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progress}
            />
          </View>
        </View>
        <View style={styles.card}>
          {/* Heading */}
          <Text style={styles.heading}>
            Terms & Conditions
          </Text>

          <Text style={styles.subHeading}>
            Please review our agreement to proceed.
          </Text>

          {/* Scrollable Terms */}
          <View style={styles.termsBox}>
            <ScrollView
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.brand}>
                WorkTrack 360 | Malhotra IT
                Innovations
              </Text>

              {/* Section 1 */}
              <Text style={styles.termTitle}>
                1. Application Purpose
              </Text>

              <Text style={styles.termText}>
                WorkTrack 360 is a B2B enterprise
                tool designed for employee
                attendance, real-time location
                tracking, and payroll automation.
                Use of this application is strictly
                limited to employees of
                organizations that have a valid
                service agreement with Malhotra IT
                Innovations.
              </Text>

              {/* Section 2 */}
              <Text style={styles.termTitle}>
                2. User Accountability
              </Text>

              <Text style={styles.termText}>
                • Users must provide accurate and
                truthful login credentials.{"\n"}•
                The use of GPS Spoofing, Mock
                Location tools, or any "Location
                Hacking" software is strictly
                prohibited.{"\n"}• Any detected
                fraudulent activity may lead to
                account suspension.
              </Text>

              {/* Section 3 */}
              <Text style={styles.termTitle}>
                3. Device Permissions
              </Text>

              <Text style={styles.termText}>
                To function as intended, the app
                requires access to GPS (Location),
                Camera (for verification), and
                Storage. Denying these permissions
                will limit the app's functionality.
              </Text>

              {/* Section 4 */}
              <Text style={styles.termTitle}>
                4. Limitation of Liability
              </Text>

              <Text style={styles.termText}>
                WorkTrack 360 provides data;
                however, final payroll approval
                remains the responsibility of the
                Employer (Admin).
              </Text>

              {/* Admin Box */}
              <View style={styles.adminBox}>
                <Text style={styles.adminTitle}>
                  🔑 Registration Notice
                </Text>

                <Text style={styles.adminText}>
                  Individual users cannot create
                  accounts directly. IDs are
                  created only by authorized
                  Organization Administrators.
                  {"\n\n"}
                  If you are an employer/admin,
                  please visit the portal to manage
                  employee IDs:
                </Text>

                <TouchableOpacity
                  onPress={openAdminPortal}
                >
                  <Text style={styles.linkText}>
                    admin.WorkTrack360.com
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.8}
          >
            <View style={styles.checkbox}>
              {checked && (
                <Image source={require("../img/check.png")} style={styles.checkboxImage} />
              )}
            </View>

            <Text style={styles.checkboxText}>
              I agree to the Terms & Conditions
            </Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {/* Back */}
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>
                Back
              </Text>
            </TouchableOpacity>

            {/* Continue */}
            <TouchableOpacity
              disabled={!checked}
              activeOpacity={0.8}
              style={styles.continueWrapper}
              onPress={() =>
                navigation.navigate("OnboardingScreen")
              }
            >
              <LinearGradient
                colors={
                  checked
                    ? ["#00d2ff", "#9d50bb"]
                    : ["#4b5563", "#4b5563"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueBtn}
              >
                <Text style={styles.continueText}>
                  Continue
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            © 2026 Malhotra IT Innovations
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default TermsOfService;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradient: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "#06080c",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 20,
  },

  heading: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },

  subHeading: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 22,
  },

  termsBox: {
    height: 330,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  brand: {
    color: "#00d2ff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 18,
  },

  termTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },

  termText: {
    color: "#b0b0b0",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  checkboxImage: {
    width: 14,
    height: 14,
    tintColor: '#1A4B7C' // Check icon ka color
  },

  adminBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
    marginBottom: 15,
  },

  adminTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  adminText: {
    color: "#b0b0b0",
    fontSize: 14,
    lineHeight: 22,
  },

  linkText: {
    color: "#00d2ff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    textDecorationLine: "underline",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },

  checkboxText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 28,
    gap: 14,
  },

  backBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  backText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },

  continueWrapper: {
    flex: 2,
  },

  continueBtn: {
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  continueText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  footer: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  topLogo: {
    width: 100,
    height: 50,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    overflow: "hidden",
  },

  progress: {
    width: "50%",
    height: "100%",
    borderRadius: 10,
  },
});