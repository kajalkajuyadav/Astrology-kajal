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
import { useNavigation } from "@react-navigation/native";
import { BaseUrl } from '../../url/env'; // Ensure this path is correct
import LinearGradient from "react-native-linear-gradient";
import notifee, { AndroidColor, AndroidImportance } from '@notifee/react-native';
import { NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const { LocationServiceModule } = NativeModules;

const Home = () => {
  // State Variables
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [userName, setUserName] = useState("User");
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

      await fetch(`${BaseUrl}/offline`, {
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
      try { await LocationServiceModule.requestBatteryOptimizationOff(); } catch(e){ }
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
            try { await LocationServiceModule.requestBatteryOptimizationOff(); } catch(e){ /* ignore */ }

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

  const handleCheckOut = async () => {
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

  // ============================================
  // UI RENDER
  // ============================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1FA2FF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#1FA2FF"  />

      <View style={styles.container}>
        <LinearGradient
          colors={['#1FA2FF', '#1FA2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={{ marginTop: 10 }}>
              <Image
                source={require("../img/logo.png")}
                style={{ height: 30, width: 40, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={styles.greeting}>{userName}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />}
        >
          {/* Time Card */}
          <LinearGradient
            colors={['#1FA2FF', '#12D8FA']}
            style={styles.timeCard}
          >
            <View style={styles.timeHeader}>
              <Image source={require("../img/time.png")} style={{ height: 20, width: 20 }} tintColor="#fff" />
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
              <TouchableOpacity onPress={() => navigation.navigate("DaliySafer")} style={[styles.actionCard,{backgroundColor:"#DBEAFE"}]}>
                <Image source={require("../img/marker.png")} style={{ height: 30, width: 30 }} tintColor={"#3B82F6"} />
                <Text style={[styles.actionText, { color: "#3B82F6" }]}>Daily Safar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Salary")} style={[styles.actionCard,{backgroundColor:"#F3E8FF"}]}>
                <Image source={require("../img/rupee.png")} style={{ height: 30, width: 30 }} tintColor={"#A855F7"} />
                <Text style={[styles.actionText, { color: "#A855F7" }]}>My Claims</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("MyVisitsScreen")} style={[styles.actionCard,{backgroundColor:"#E0F2FE"}]}>
                <Image source={require("../img/visitor.png")} style={{ height: 30, width: 30 }} tintColor={"#06B6D4"} />
                <Text style={[styles.actionText, { color: "#06B6D4" }]}>My Visits</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Attendance")} style={[styles.actionCard,{backgroundColor:"#FFF7ED"}]}>
                <Image source={require("../img/briefcase.png")} style={{ height: 30, width: 30 }} tintColor={"#FF8C00"} />
                 <Text style={[styles.actionText, { color: "#FF8C00" }]}>Attendance</Text>
               </TouchableOpacity>          
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: { marginBottom: 10, paddingHorizontal: 20, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', gap: 10, alignItems: "center" },
  greeting: { fontSize: 18, fontWeight: "700", color: "#fff" },
  timeCard: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 20, marginTop: 10, marginHorizontal: 15, elevation: 3 },
  timeHeader: { flexDirection: "row", alignItems: "center" },
  timeLabel: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 4 },
  timeBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  timeContainer: { flex: 1 },
  time: { color: "#fff", fontSize: 24, fontWeight: "700" },
  date: { color: "#E0F2FE", fontSize: 14, marginTop: 4 },
  locationCard: { backgroundColor: "#E6FBF3", borderColor: "#A7F3D0", borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", marginTop: 20, marginHorizontal: 16 },
  locationText: { color: "#065F46", fontWeight: "600", fontSize: 14, marginLeft: 12, flex: 1 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginLeft: 10 },
  mapContainer: { height: 200, marginTop: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E0E0E0', elevation: 2, marginHorizontal: 16 },
  map: { ...StyleSheet.absoluteFillObject },
  checkContainer: { marginTop: 20, alignItems: "center", backgroundColor: "#989090ff", elevation: 1, padding: 20, borderRadius: 12, marginHorizontal: 16 },
  checkStatusText: { fontWeight: "700", fontSize: 16 },
  checkButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  checkButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 30, width: "48%", elevation: 2 },
  checkinText: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 13 },
  quickActions: { marginTop: 25, marginBottom: 40, marginHorizontal: 16 },
  quickTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 },
  controlButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 6 },
  controlText: { color: '#fff', fontWeight: '700' },
  actionCard: { width: "48%", borderRadius: 10, padding: 20, alignItems: "center", justifyContent: "center", marginBottom: 10, minHeight: 100, elevation: 1 },
  actionText: { fontWeight: "600", fontSize: 15 }
});