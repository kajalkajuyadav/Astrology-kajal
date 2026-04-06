import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  ToastAndroid,
  RefreshControl,
  SafeAreaView,
  Alert,
  NativeModules // 1. NativeModules Import kiya
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BaseUrl, ImgUrl } from '../../url/env';
import LinearGradient from "react-native-linear-gradient";

// 2. Native Module Connect (Tracking rokne ke liye)
const { LocationModule } = NativeModules;

// Helper for Toast
const showApiToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    console.log('API TOAST:', msg);
  }
};

// --- Helper Component: InfoRow ---
const InfoRow = ({ label = "", value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>
      {String(label).toUpperCase()}
    </Text>
    <Text style={styles.infoValue}>
      {value !== undefined && value !== null ? String(value) : "-"}
    </Text>
  </View>
);

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', { ...options, timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return '-';
  }
};

const HRMSHubScreen = () => {
  const navigation = useNavigation();

  // --- STATES ---
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ⭐ LOGOUT FUNCTION (Moved Inside & Enhanced)
  const handleLogoutAndRedirect = async (message = 'Session expired. Please log in again.') => {
    try {
      showApiToast(message);

      // 1. Stop Native Tracking (Agar chal raha hai to)
      if (LocationModule) {
        LocationModule.stopTracking();
      }

      // 2. Clear ALL Data (Auth + Location Tracking)
      const keys = [
        'authToken', 
        'userName', 
        'userEmpId',
      ];
      await AsyncStorage.multiRemove(keys);

      // 3. Reset Navigation to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });

    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // ⭐ CONFIRMATION DIALOG (Moved Inside Component)
  const confirmLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => handleLogoutAndRedirect("Logged out successfully"),
        },
      ],
      { cancelable: true }
    );
  };

  // --- Save Data to Storage ---
  const saveUserDataToStorage = async (data) => {
    try {
      const name = data.name || '';
      const empId = data._id || '';

      if (name) await AsyncStorage.setItem('userName', name);
      if (empId) await AsyncStorage.setItem('userEmpId', empId);
    } catch (error) {
      console.error('❌ AsyncStorage Error: Failed to save data', error);
    }
  };

  // --- API FETCHING FUNCTION ---
  const fetchProfileData = async (isManualRefresh = false) => {
    if (!isManualRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        await handleLogoutAndRedirect('Token not found. Redirecting to Login.');
        return;
      }

      const response = await fetch(`${BaseUrl}/employees/get/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      let json = null;
      let text = null;
      try {
        text = await response.text();
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        json = null;
      }

      // Authentication Error Check
      if (response.status === 403 && json?.error?.statusCode === 403) {
        await handleLogoutAndRedirect();
        return;
      }

      // Success Check
      if (response.ok && json?.success === true && json?.data) {
        setProfileData(json.data);
        await saveUserDataToStorage(json.data);
        showApiToast('Profile loaded successfully.');
      }
      else {
        const errMsg = (json && (json.message || json.error?.explanation)) || `Failed (Status: ${response.status})`;
        showApiToast(errMsg);
      }

    } catch (err) {
      showApiToast('Profile fetch failed: Network error.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchProfileData(true);
  }, []);

  useEffect(() => {
    fetchProfileData(false);
  }, []);

  // --- Data mapping variables ---
  const name = profileData?.name || "Employee Name";
  const title = profileData?.designation || "-";
  const employeeId = profileData?.empId || "-";
  const email = profileData?.email || "-";
  const phone = profileData?.phone || "-";
  const department = profileData?.department?.name || "-";
  const profileImage = profileData?.profile;

  const joiningDate = formatDate(profileData?.joiningDate);
  const baseSalary = profileData?.baseSalary ? `₹ ${profileData.baseSalary.toLocaleString('en-IN')}` : '-';
  const address = profileData?.address || "-";
  const bankName = profileData?.bankName || "-";
  const accountNumber = profileData?.accountNumber || "-";
  const ifscCode = profileData?.ifscCode || "-";
  const panNumber = profileData?.panNumber || "-";
  const emergencyContact = profileData?.emergencyContact || "-";

  const avatarText = name
    ? name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : "NA";

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading HRMS Profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1FA2FF" }}>
    <View style={styles.container}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

      <View style={styles.header}>
        <View style={styles.header1}>
          {profileImage ? (
            <Image
              style={styles.profilePicture1}
              source={{ uri: (String(profileImage).startsWith('http') ? profileImage : `${ImgUrl}/${String(profileImage).replace(/^\/+/, '')}`) }}
            />
          ) : (
            <View style={[styles.profilePicture1, styles.textAvatarFallback]}>
              <Text style={[styles.avatarText, { fontSize: 16 }]}>
                {avatarText}
              </Text>
            </View>

          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{name}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={confirmLogout}>
            <Image source={require("../img/logout.png")} style={{ height: 30, width: 30 }} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >

        {/* MY PROFILE CARD */}
        <View style={[styles.card, styles.idCard]}>
          <LinearGradient colors={['#1FA2FF', '#12D8FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }} style={styles.idCardBanner}>
            <Text style={styles.bannerText}>MY PROFILE</Text>
          </LinearGradient>

          <View style={styles.idCardContent}>
            <Text style={styles.idCardCompany}>CanxInternational HRMS</Text>
            <View style={styles.profilePictureContainer}>
              {profileImage ? (
                <Image
                  style={styles.profilePicture}
                  source={{ uri: (String(profileImage).startsWith('http') ? profileImage : `${ImgUrl}/${String(profileImage).replace(/^\/+/, '')}`) }}
                />
              ) : (
                <View style={[styles.profilePicture1, styles.textAvatarFallback]}>
                  <Text style={[styles.avatarText, { fontSize: 16 }]}>
                    {avatarText}
                  </Text>
                </View>

              )}
            </View>

            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileTitle}>{title}</Text>
            <View style={styles.separator} />

            <View style={styles.infoContainer}>
              <InfoRow label="ID #" value={employeeId} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Phone" value={phone} />
              <InfoRow label="Department" value={department} />
              <InfoRow label="Address" value={address} />
            </View>
          </View>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image source={require("../img/circle.png")} style={{ height: 24, width: 24 }} tintColor={"#3B82F6"} />
            <Text style={styles.cardTitle}>Additional Details</Text>
          </View>
          <View style={styles.separator} />

          <View style={styles.infoContainer}>
            <InfoRow label="Joining Date" value={joiningDate} />
            <InfoRow label="Base Salary" value={baseSalary} />
            <InfoRow label="Emergency Contact" value={emergencyContact} />
            <View style={styles.separator} />
            <InfoRow label="Bank Name" value={bankName} />
            <InfoRow label="Account Number" value={accountNumber} />
            <InfoRow label="IFSC Code" value={ifscCode} />
            <InfoRow label="PAN Number" value={panNumber} />
          </View>
        </View>

        {/* SALARY CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image source={require("../img/text.png")} style={{ height: 15, width: 15 }} tintColor={"#10B981"} />
            <Text style={styles.cardTitle}>Salary Slips</Text>
          </View>
          <TouchableOpacity onPress={()=>navigation.navigate("SalerySelf")} style={styles.slipItem}>
            <View style={styles.slipIconContainer}>
              <Image source={require("../img/text.png")} style={{ height: 15, width: 15 }} tintColor={"#10B981"} />
            </View>
            <View style={styles.slipTextContainer}>
              <Text style={styles.slipTitle}>Salary Slip</Text>
            </View>
            <Image source={require("../img/arrow.png")} style={{ height: 15, width: 15 }} tintColor={"#9CA3AF"} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

export default HRMSHubScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB"},
  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, },
  header1: { flexDirection: "row", alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerText: { marginLeft: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 4 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 18, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginLeft: 10 },
  idCard: { flexDirection: 'row', padding: 0, overflow: 'hidden', marginHorizontal: 10, marginTop: 10 },
  idCardBanner: { width: 50, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  bannerText: { color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800', fontSize: 14, transform: [{ rotate: '-90deg' }], width: 150, textAlign: 'center', letterSpacing: 1 },
  idCardContent: { flex: 1, padding: 25 },
  idCardCompany: { fontSize: 12, fontWeight: '500', color: '#6B7280', textAlign: 'center', textTransform: 'uppercase' },
  profileName: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#111827' },
  profilePicture: { width: 70, height: 70, borderRadius: 70, alignSelf: 'center', borderWidth: 3, borderColor: '#F3F4F6', overflow: "hidden", marginVertical: 10 },
  profilePicture1: { width: 40, height: 40, borderRadius: 40, alignSelf: 'center', borderWidth: 3, borderColor: '#F3F4F6', overflow: "hidden", },
  profilePictureContainer: { alignSelf: 'center', width: 80, height: 80, overflow: 'hidden', borderRadius: 80 },
  textAvatarFallback: { backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  profileTitle: { fontSize: 15, color: '#3B82F6', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  infoContainer: { marginTop: 16, paddingVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLabel: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  infoValue: { color: '#111827', fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  applyButton: { marginLeft: 'auto', backgroundColor: "#F97316", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  applyButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  emptyCardText: { fontSize: 14, color: "#6B7280", marginTop: 16, marginLeft: 10 },
  slipItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 8, padding: 12, marginTop: 12 },
  slipIconContainer: { backgroundColor: "#D1FAE5", borderRadius: 50, padding: 6 },
  slipTextContainer: { flex: 1, marginLeft: 12 },
  slipTitle: { fontSize: 15, fontWeight: "500", color: "#1F2937" },
  slipSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#3B82F6', fontWeight: '600' },
});