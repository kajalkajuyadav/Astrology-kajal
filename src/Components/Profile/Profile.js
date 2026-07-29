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
import styles from "./ProfileStyles";
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

const Profile = () => {
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
          <View style={styles.headerRow2}>
            <Image
                                source={require("../img/WorkTracklogo.png")}
                                style={{ height: 50, width:80, resizeMode: 'contain' }}
                              />
          </View>
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
            <TouchableOpacity onPress={confirmLogout}>
              <Image source={require("../img/logout.png")} style={{ height: 25, width: 25}} />
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
            {/*<LinearGradient colors={['#1A4B7C', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 2, y: 0 }} style={styles.idCardBanner}>
              <Text style={styles.bannerText}>MY PROFILE</Text>
            </LinearGradient>*/}

            <View style={styles.idCardContent}>
              <Text style={styles.idCardCompany}>WorkTrack 360 HRMS</Text>
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
          <View style={styles.card1}>
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
          <View style={styles.card1}>
            <View style={styles.cardHeader}>
              <Image source={require("../img/text.png")} style={{ height: 15, width: 15 }} tintColor={"#10B981"} />
              <Text style={styles.cardTitle}>Salary Slips</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("SalerySelf")} style={styles.slipItem}>
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

export default Profile;

