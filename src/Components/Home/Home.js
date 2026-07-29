import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  ScrollView,
  PermissionsAndroid,
  Image,
  RefreshControl,
  SafeAreaView,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BaseUrl, ImgUrl } from '../../url/env'; // Ensure this path is correct
import LinearGradient from "react-native-linear-gradient";
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';
import { NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import styles from "../Home/HomeStyles";
const { LocationServiceModule } = NativeModules;

const Home = () => {
  // State Variables
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userName, setUserName] = useState("User");
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const watchIdRef = useRef(null);
  const wasOfflineRef = useRef(false);

  const navigation = useNavigation();
  const redirectToLogin = () => navigation.navigate("Login");

  // ============================================
  // 1. PERMISSIONS LOGIC
  // ============================================
  const requestAllPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // Step 1: Foreground Location
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs location access to mark attendance.',
          buttonPositive: 'OK',
        }
      );

      if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        showToast('Location permission denied');
        return false;
      }

      // Step 2: Notification (Android 13+)
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      // Step 3: Background Location (Android 10+)
      if (Platform.Version >= 29) {
        // Note: Users usually have to select "Allow all the time" manually in settings
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
      }

      return true;
    } catch (err) {
      console.log('Permission error:', err);
      return false;
    }
  };

  // ============================================
  // 2. OFFLINE SYNC LOGIC
  // ============================================
  const sendOfflineStatus = async (reason) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BaseUrl}/offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          deviceTimestamp: new Date().toISOString(),
        }),
      });
      const json = await response.json();


      console.log('📴 Offline status sent');
    } catch (e) {
      const existing = await AsyncStorage.getItem('OFFLINE_QUEUE');
      const queue = existing ? JSON.parse(existing) : [];

      queue.push({
        reason,
        timestamp: new Date().toISOString(),
      });

      await AsyncStorage.setItem('OFFLINE_QUEUE', JSON.stringify(queue));
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isConnected = state.isConnected === true;

      // 🔴 Sirf FIRST time net off
      if (!isConnected && !wasOfflineRef.current) {
        wasOfflineRef.current = true;
        await sendOfflineStatus('NO_INTERNET');
        showToast("You are Offline. Data queued.");
      }

      // 🟢 Net wapas aaya
      if (isConnected && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        showToast("Back Online. Syncing...");

        const stored = await AsyncStorage.getItem('OFFLINE_QUEUE');
        if (stored) {
          const queue = JSON.parse(stored);
          for (const item of queue) {
            await sendOfflineStatus(item.reason);
          }
          await AsyncStorage.removeItem('OFFLINE_QUEUE');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // 3. TRACKING HELPERS (Visual + Service)
  // ============================================

  // Note: Native Service khud notification handle karta hai, 
  // lekin agar aapko extra JS side notification chahiye toh yeh rakhein.
  const startForegroundTracking = async () => {
    try {
      const channelId = await notifee.createChannel({
        id: 'location-tracking',
        name: 'Location Tracking',
        importance: AndroidImportance.LOW,
      });

      await notifee.displayNotification({
        title: 'HRMS Active',
        body: 'Attendance tracking enabled.',
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          color: AndroidColor.BLUE,
        },
      });
      setIsTracking(true);
    } catch (e) {
      console.log('startForegroundTracking error:', e);
    }
  };

  const stopForegroundTracking = async () => {
    try {
      await notifee.stopForegroundService();
    } catch (e) { console.log(e) }

    setIsTracking(false);

    // Stop Map Watch
    if (watchIdRef.current) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // ============================================
  // 3.b START / STOP Native Service (for testing)
  // ============================================
  const startNativeService = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const shortToken = token ? token.replace('Bearer ', '') : '';

    try {
      await LocationServiceModule.startService(BaseUrl, shortToken);
      // Ask user to disable battery optimizations (best effort)
      try { await LocationServiceModule.requestBatteryOptimizationOff(); } catch (e) { }
      showToast('Native Service Started');
    } catch (e) {
      console.log('startNativeService error', e);
      showToast('Failed to start service');
    }
  };

  const stopNativeService = async () => {
    try {
      await LocationServiceModule.stopService();
      showToast('Native Service Stopped');
    } catch (e) {
      console.log('stopNativeService error', e);
      showToast('Failed to stop service');
    }
  };

  const startVisualTracking = (setLocationState) => {
    if (watchIdRef.current) Geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationState({ latitude, longitude });
        AsyncStorage.setItem("lastLat", String(latitude));
        AsyncStorage.setItem("lastLng", String(longitude));
      },
      (error) => console.log('Visual tracking error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 10000,
        fastestInterval: 5000
      }
    );
  };

  // ============================================
  // 4. CHECK-IN / CHECK-OUT LOGIC
  // ============================================

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      redirectToLogin();
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleCheckIn = async () => {
    const hasPermission = await requestAllPermissions();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const headers = await getAuthHeaders();
        if (!headers) return;

        try {
          const response = await fetch(`${BaseUrl}/attendance/checkin`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              latitude: String(latitude),
              longitude: String(longitude),
              deviceTimestamp: new Date().toISOString(),
            }),
          });

          const result = await response.json();
          // 🔥 ADD THIS BLOCK (IMPORTANT)

          if (!result.success && result?.error?.statusCode === 403) {
            // 🔥 Toast show
            ToastAndroid.show(
              "Session expired, please login again",
              ToastAndroid.SHORT
            );

            await AsyncStorage.removeItem("authToken");

            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });

            return;
          }
          if (response.ok && result.success) {
            setIsCheckedIn(true);
            setCurrentLocation({ latitude, longitude });
            const todayDate = new Date().toISOString().split('T')[0];

            await AsyncStorage.setItem('checkInDate', todayDate);
            await AsyncStorage.setItem('isCheckedIn', 'true');
            await AsyncStorage.setItem('lastLat', String(latitude));
            await AsyncStorage.setItem('lastLng', String(longitude));

            // 1. Start Native Service
            await LocationServiceModule.startService(
              BaseUrl,
              headers.Authorization.replace('Bearer ', '')
            );

            // Request battery optimization exemption (helps survive aggressive OEM killers)
            try { await LocationServiceModule.requestBatteryOptimizationOff(); } catch (e) { /* ignore */ }

            // 2. Start Map Tracking
            startVisualTracking(setCurrentLocation);

            // 3. Optional: Notifee (If you want dual notification)
            // await startForegroundTracking(); 

            showToast('Checked-In Successfully!');
          } else {
            showToast(result.message || 'Check-In Failed');
          }
        } catch (e) {
          console.log('Check-in error:', e);
          showToast('Network Error');
        }
      },
      () => showToast('Please enable GPS'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };


  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Component focus mein hai

      const reloadOnFocus = async () => {
        const wasCheckedIn = await AsyncStorage.getItem('isCheckedIn');
        const lat = await AsyncStorage.getItem('lastLat');
        const lng = await AsyncStorage.getItem('lastLng');

        // Agar user focus mein hai aur checked-in hai, toh state force-update karein
        if (isActive && wasCheckedIn === 'true' && lat && lng) {
          setIsCheckedIn(true);
          setIsTracking(true); // Map render trigger karega
          setCurrentLocation({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
          });

          // Debugging console (isko remove kar sakti hain baad mein)
          console.log("🔄 Screen Auto-Reloaded: Map activated");
        }
      };

      reloadOnFocus();

      // Cleanup function jab focus screen se jaye
      return () => {
        isActive = false;
      };
    }, []));

  const showCheckoutAlert = (onConfirm) => {
    const now = new Date();
    const currentHour = now.getHours();

    // English Message for early checkout
    let message = "Are you sure you want to check-out?";
    if (currentHour < 22) {
      message = "Your shift ends at 10:00 PM. It is still early. Are you sure you want to check-out now?";
    }

    Alert.alert(
      "Check-Out Confirmation",
      message,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: onConfirm } // Jab user Yes dabayega toh onConfirm chalega
      ],
      { cancelable: true }
    );
  };

  const handleCheckOut = async () => {
    showCheckoutAlert(async () => {
      Geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const headers = await getAuthHeaders();
          if (!headers) return;

          try {
            const response = await fetch(`${BaseUrl}/attendance/checkout`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                latitude: String(latitude),
                longitude: String(longitude),
                deviceTimestamp: new Date().toISOString(),
              }),
            });

            const result = await response.json();

            // 🔥 ADD THIS BLOCK (IMPORTANT)

            if (!result.success && result?.error?.statusCode === 403) {
              // 🔥 Toast show
              ToastAndroid.show(
                "Session expired, please login again",
                ToastAndroid.SHORT
              );

              await AsyncStorage.removeItem("authToken");

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });

              return;
            }

            if (response.ok && result.success) {
              await performLocalCheckout();
              showToast('Checked-Out Successfully!');
            } else {
              showToast(result.message || 'Check-Out Failed');
            }
          } catch {
            showToast('Network Error');
          }
        },
        () => showToast('Please enable GPS'),
        { enableHighAccuracy: true }
      );
    })
  };

  const performLocalCheckout = async () => {
    // Stop Native Service
    await LocationServiceModule.stopService();
    // Stop Notifee/Map
    await stopForegroundTracking();

    setIsCheckedIn(false);
    setIsTracking(false);
    await AsyncStorage.setItem('isCheckedIn', 'false');
  };

  // ============================================
  // 5. SESSION RESTORATION & AUTO LOGOUT
  // ============================================

  const checkLocalSession = async () => {
    // Avoid re-running if already checked in
    if (isCheckedIn) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const storedDate = await AsyncStorage.getItem('checkInDate');
    const wasCheckedIn = await AsyncStorage.getItem('isCheckedIn');

    const now = new Date();
    const currentHour = now.getHours();
    const isTimeUp = currentHour >= 22; // 10 PM Limit

    if (wasCheckedIn === 'true' && storedDate === todayDate && !isTimeUp) {
      console.log("🔄 Restoring Active Session...");

      setIsCheckedIn(true);
      setIsTracking(true);

      const lat = await AsyncStorage.getItem('lastLat');
      const lng = await AsyncStorage.getItem('lastLng');
      if (lat && lng) {
        setCurrentLocation({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        });
      }

      // Resume Services
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await LocationServiceModule.startService(BaseUrl, token);
        startVisualTracking(setCurrentLocation);
      }
    } else {
      // If session exists but time is up or date changed
      if (wasCheckedIn === 'true') {
        console.log("🛑 Session Expired -> Auto Checkout");
        await performLocalCheckout();
      }
    }
  };

  // ============================================
  // 6. INITIALIZATION (UseEffect)
  // ============================================
  useEffect(() => {
    // A. Permissions
    requestAllPermissions();

    // B. Check Session ONLY ONCE on mount
    checkLocalSession();

    // C. Clock & Auto-Logout Check
    const updateTime = async () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase());
      setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));

      // Check for Auto-Logout (Only if currently checked in)
      const currentHour = now.getHours();
      if (currentHour >= 22) {
        const wasCheckedIn = await AsyncStorage.getItem('isCheckedIn');
        if (wasCheckedIn === 'true') {
          await performLocalCheckout();
          showToast("Auto Checked-Out (10 PM)");
        }
      }
    };

    updateTime();
    const clockTimer = setInterval(updateTime, 60000); // Check every minute

    // D. User Name
    AsyncStorage.getItem("userName").then(name => { if (name) setUserName(name); });

    return () => clearInterval(clockTimer);
  }, []); // Dependency Array Empty = Runs only on Mount

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkLocalSession(); // Manual refresh check
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const showToast = (msg) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert('Info', msg);
  };



  // get name function profile Api 

  useEffect(() => {
    fetchAndStoreName();
  }, []);



  // 1. Function jo sirf naam nikal kar store karega
  const fetchAndStoreName = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BaseUrl}/employees/get/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!json.success && json?.error?.statusCode === 403) {
        // 🔥 Toast show
        ToastAndroid.show(
          "Session expired, please login again",
          ToastAndroid.SHORT
        );

        await AsyncStorage.removeItem("authToken");

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });

        return;
      }


      if (response.ok && json?.success && json?.data) {
        const name = json.data.full_name || json.data.name;
        const profileImage = json.data.profile;
        console.log("Fetched Name:", name, profileImage);
        setUserName(name); // State update
        setProfileImage(profileImage);
      }
    } catch (err) {
      console.error("Home Profile Fetch Error:", err);
    }
  };


  // ============================================
  // UI RENDER
  // ============================================
  return (
    <View style={{ flex: 1, backgroundColor: "#1FA2FF" }}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow2}>
           
             <Image
                    source={require("../img/WorkTracklogo.png")}
                    style={{ height: 50, width:80, resizeMode: 'contain' }}
                  />
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Profile")} style={styles.headerRow}>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.greeting}>{userName} </Text>
            </View>

            <View style={{ marginTop: 10 }}>
              {
                profileImage ? <Image
                  style={styles.profilePicture}
                  source={{ uri: (String(profileImage).startsWith('http') ? profileImage : `${ImgUrl}/${String(profileImage).replace(/^\/+/, '')}`) }}
                /> :
                  <Image
                    source={require("../img/WorkTracklogo.png")}
                    style={{ height: 30, width: 30, resizeMode: 'contain' }}
                  />
              }
            </View>

          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />}
        >
          {/* Time Card */}
          <LinearGradient
            colors={['#1A4B7C', '#0097A7', '#4CAF50']}
            style={styles.timeCard}
            // Diagonal gradient professional lagta hai
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.timeHeader}>
              <Image source={require("../img/time.png")} style={{ height: 20, width: 20, marginTop: 3 }} tintColor="#fff" />
              <Text style={styles.timeLabel}>Current Time</Text>
            </View>
            <View style={styles.timeBody}>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{currentTime}</Text>
                <Text style={styles.date}>{currentDate}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Location Info */}
          {/* {isTracking && (
            <View style={styles.locationCard}>
              <Image source={require("../img/marker.png")} style={{ height: 20, width: 20 }} tintColor="red" />
              <Text style={styles.locationText}>
                {currentLocation ? `Active: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : "Fetching location..."}
              </Text>
              <View style={styles.locationDot} />
            </View>
          )} */}

          {/* Map View */}
          {isTracking && currentLocation && (
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
              >
                <Marker coordinate={currentLocation} title="You" />
              </MapView>
            </View>
          )}

          {/* Check In/Out Box */}
          <View style={[styles.checkContainer, { backgroundColor: isCheckedIn ? "#cfe7ecff" : "#E5E7EB" }]}>
            <Text style={[styles.checkStatusText, { color: isCheckedIn ? "#16A34A" : "#DC2626", marginBottom: 15 }]}>
              Status: {isCheckedIn ? "Checked-In" : "Checked-Out"}
            </Text>

            <View style={styles.checkButtonRow}>
              <TouchableOpacity
                style={[styles.checkButton, { backgroundColor: "#16A34A", opacity: isCheckedIn ? 0.6 : 1 }]}
                onPress={handleCheckIn}
                disabled={isCheckedIn}
              >
                <Image source={require("../img/login.png")} style={{ height: 20, width: 20 }} />
                <Text style={styles.checkinText}>CHECK-IN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkButton, { backgroundColor: "#DC2626", opacity: !isCheckedIn ? 0.6 : 1 }]}
                onPress={handleCheckOut}
                disabled={!isCheckedIn}
              >
                <Image source={require("../img/logout.png")} style={{ height: 20, width: 20 }} />
                <Text style={styles.checkinText}>CHECK-OUT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickTitle}>Quick Actions</Text>

            {/* Start/Stop Test Buttons */}
            {/* <View style={styles.actionRow}>
              <TouchableOpacity onPress={startNativeService} style={[styles.controlButton, { backgroundColor: '#16A34A' }]}>
                <Text style={styles.controlText}>Start Service</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={stopNativeService} style={[styles.controlButton, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.controlText}>Stop Service</Text>
              </TouchableOpacity>
            </View> */}

            <View style={styles.actionGrid}>
              <TouchableOpacity onPress={() => navigation.navigate("DaliySafer")} activeOpacity={0.8} style={styles.cardContainer}>
                <LinearGradient colors={['#1A4B7C', '#2C5E8F']} style={styles.actionCard}>
                  <View style={styles.iconCircle}>
                    <Image source={require("../img/marker.png")} style={styles.cardIcon} tintColor={"#fff"} />
                  </View>
                  <Text style={styles.actionText}>Daily Safar</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Claims")} activeOpacity={0.8} style={styles.cardContainer}>
                <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.actionCard}>
                  <View style={styles.iconCircle}>
                    <Image source={require("../img/salary.png")} style={styles.cardIcon} tintColor={"#fff"} />
                  </View>
                  <Text style={styles.actionText}>My Claims</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("MyVisitsScreen")} activeOpacity={0.8} style={styles.cardContainer}>
                <LinearGradient colors={['#0097A7', '#00ACC1']} style={styles.actionCard}>
                  <View style={styles.iconCircle}>
                    <Image source={require("../img/visitor.png")} style={styles.cardIcon} tintColor={"#fff"} />
                  </View>
                  <Text style={styles.actionText}>My Visits</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Attendance")} activeOpacity={0.8} style={styles.cardContainer}>
                <LinearGradient colors={['#2196F3', '#42A5F5']} style={styles.actionCard}>
                  <View style={styles.iconCircle}>
                    <Image source={require("../img/briefcase.png")} style={styles.cardIcon} tintColor={"#fff"} />
                  </View>
                  <Text style={styles.actionText}>Attendance</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

export default Home;

