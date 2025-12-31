

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   StatusBar,
//   TouchableOpacity,
//   ToastAndroid,
//   Platform,
//   ScrollView,
//   PermissionsAndroid,
//   Linking,
//   Image,
//   RefreshControl,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Geolocation from 'react-native-geolocation-service';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import BackgroundService from 'react-native-background-actions';
// import { useNavigation } from "@react-navigation/native";
// import BackgroundFetch from 'react-native-background-fetch';
// import { BaseUrl } from '../../url/env';
// import LinearGradient from "react-native-linear-gradient";

// // --- Global Location and Tracking State ---
// let watchId = null;
// // ❌ Removed 'let lastUploadAt = 0;' because memory variables don't sync between threads
// let isCheckedInRefValue = false;
// let foregroundTimerId = null;
// let lastKnownLocation = null;
// let isUploadingLocation = false;
// let isSyncingStatus = false;
// let bgFetchStarted = false;
// let skipNextWatchSend = false;
// const LOCATION_RATE_LIMIT_MS = 300000; // 5 Minutes

// const NETWORK_LOG_KEY = 'networkLogs';
// const LAST_UPLOAD_KEY = 'lastUploadTimestamp'; // ✅ New Key for Storage

// const appendNetworkLog = async (status) => {
//   const now = new Date().toISOString();
//   try {
//     const raw = await AsyncStorage.getItem(NETWORK_LOG_KEY);
//     const arr = raw ? JSON.parse(raw) : [];
//     arr.push({ status, timestamp: now });
//     if (arr.length > 200) arr.splice(0, arr.length - 200);
//     await AsyncStorage.setItem(NETWORK_LOG_KEY, JSON.stringify(arr));
//   } catch { }
//   return now;
// };

// const checkInternetConnectivity = async () => {
//   try {
//     const controller = new AbortController();
//     const timer = setTimeout(() => controller.abort(), 3000);
//     const res = await fetch('https://www.google.com/generate_204', { method: 'GET', cache: 'no-store', signal: controller.signal });
//     clearTimeout(timer);
//     return res.status === 204 || res.ok;
//   } catch {
//     return false;
//   }
// };

// const showToast = (msg) => {
//   if (Platform.OS === 'android') {
//     ToastAndroid.show(msg, ToastAndroid.SHORT);
//   } else {
//     console.log('TOAST:', msg);
//   }
// };

// // --- AUTH & ERROR HANDLERS ---
// const handleAuthError = (navigation) => {
//   console.log("!! Authentication failed (403). Redirecting to Login.");
//   showToast('Session expired. Please log in again.');
//   if (typeof navigation === 'function') {
//     navigation();
//   } else if (navigation && typeof navigation.navigate === 'function') {
//     navigation.navigate("Login");
//   }
// };

// const getAuthHeaders = async (redirectToLogin) => {
//   const token = await AsyncStorage.getItem('authToken');
//   if (!token) {
//     console.log('!! Token not found in Storage.');
//     if (redirectToLogin) redirectToLogin();
//     return null;
//   }
//   return {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${token}`,
//   };
// };

// // ✅ UPDATED: Unified fetch with DETAILED LOGGING
// const checkAuthAndGetResponse = async (url, options, redirectToLogin) => {
//   console.log(`\n🔵 [API REQUEST]`);
//   console.log(`URL: ${url}`);
//   try {
//     const response = await fetch(url, options);
//     const responseText = await response.text();
//     let json = null;
//     try {
//       json = JSON.parse(responseText);
//     } catch (e) {
//       console.log(`!! API JSON Parse Error.`);
//     }

//     if (
//       response.status === 403 &&
//       redirectToLogin &&
//       json?.error?.statusCode === 403
//     ) {
//       handleAuthError(redirectToLogin);
//     }

//     console.log(`🟢 [API RESPONSE] Status: ${response.status}`);
//     return { response: response, json: json, error: json?.error?.explanation || null, status: response.status };
//   } catch (err) {
//     console.log(`🔴 [API ERROR]:`, err);
//     return { response: null, json: null, error: 'Network Error', status: 0 };
//   }
// };

// // ✅ FIXED API: Send Location with AsyncStorage Check
// const sendLocationToServer = async (latitude, longitude, redirectToLogin, bypassRateLimit = false) => {
//   try {
//     if (isUploadingLocation) {
//       return { response: null, json: null };
//     }

//     const now = Date.now();

//     // ✅ CHECK 1: Read last upload time from Storage (Shared between Background & Foreground)
//     if (!bypassRateLimit) {
//       const lastUploadStr = await AsyncStorage.getItem(LAST_UPLOAD_KEY);
//       const lastUploadTime = lastUploadStr ? parseInt(lastUploadStr, 10) : 0;

//       if (now - lastUploadTime < LOCATION_RATE_LIMIT_MS) {
//         console.log(`⏳ Rate Limit Active. Skipping upload. (Wait: ${(LOCATION_RATE_LIMIT_MS - (now - lastUploadTime)) / 1000}s)`);
//         return { response: null, json: null };
//       }
//     }

//     isUploadingLocation = true;

//     const headers = await getAuthHeaders(redirectToLogin);
//     if (!headers) {
//       isUploadingLocation = false;
//       return { response: null, json: null };
//     }

//     const deviceTimestamp = new Date().toISOString();
//     const options = {
//       method: 'POST',
//       headers: headers,
//       body: JSON.stringify({
//         latitude: String(latitude),
//         longitude: String(longitude),
//         deviceTimestamp,
//       }),
//     };

//     const result = await checkAuthAndGetResponse(`${BaseUrl}/employees/location`, options, redirectToLogin);

//     // ✅ CHECK 2: If success, SAVE time to storage
//     if (result.response && result.response.ok) {
//       await AsyncStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()));
//       console.log("✅ Location Uploaded & Timestamp Saved");
//     }

//     return result;

//   } catch (err) {
//     console.log('Location API Catch Error:', err);
//     return { response: null, json: null };
//   }
//   finally {
//     isUploadingLocation = false;
//   }
// };

// // API: Attendance (CheckIn/CheckOut)
// const sendAttendanceData = async (endpoint, method, payload, redirectToLogin) => {
//   const headers = await getAuthHeaders(redirectToLogin);
//   if (!headers) return { isSuccess: false };

//   const options = {
//     method: method,
//     headers: headers,
//     body: JSON.stringify(payload),
//   };

//   const result = await checkAuthAndGetResponse(`${BaseUrl}/${endpoint}`, options, redirectToLogin);
//   const isSuccess = result.response?.ok && result.json?.success === true;

//   if (isSuccess && method === 'POST') {
//     // optional extra logic on successful POST
//   }

//   let msg = result.error;
//   if (isSuccess) {
//     msg = result.json?.message || (method === 'POST' ? 'Check-in successful.' : 'Check-out successful.');
//   } else if (!msg) {
//     msg = `Failed (Status: ${result.status})`;
//   }

//   if (result.status !== 403) showToast(msg);
//   return { isSuccess: isSuccess, status: result.status, json: result.json };
// };

// // API: Offline status when location or network is off
// const sendOfflineStatus = async (reason, redirectToLogin) => {
//   try {
//     const headers = await getAuthHeaders(redirectToLogin);
//     if (!headers) return { response: null, json: null };

//     const options = {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         reason,
//         deviceTimestamp: new Date().toISOString(),
//       }),
//     };

//     return await checkAuthAndGetResponse(`${BaseUrl}/offline`, options, redirectToLogin);
//   } catch (err) {
//     console.log('Offline API error:', err);
//     return { response: null, json: null };
//   }
// };

// // ✅ API Wrappers
// const getCheckInApiData = async (latitude, longitude, redirectToLogin) => {
//   const payload = { latitude: String(latitude), longitude: String(longitude), deviceTimestamp: new Date().toISOString() };
//   return sendAttendanceData('attendance/checkin', 'POST', payload, redirectToLogin);
// };

// const getCheckOutApiData = async (latitude, longitude, redirectToLogin) => {
//   const payload = { latitude: String(latitude), longitude: String(longitude), deviceTimestamp: new Date().toISOString() };
//   return sendAttendanceData('attendance/checkout', 'PUT', payload, redirectToLogin);
// };

// // ... (Baki ka code same rahega, bas logic fix ho gaya hai) ...
// // BackgroundService aur Components me koi change nahi chahiye, 
// // kyunki wo sab 'sendLocationToServer' ko call karte hain, 
// // aur rate limit ab waha Storage ke through handle ho raha hai.

// // ---- Background Service ----
// const backgroundOptions = {
//   taskName: 'HRMSLocationTracking',
//   taskTitle: 'Location tracking active',
//   taskDesc: 'HRMS Tracking Active',
//   taskIcon: { name: 'ic_launcher', type: 'mipmap' },
//   color: '#3B82F6',
//   linkingURI: 'asotorlogy://home',
//   parameters: { intervalMs: 300000 },
// };
// const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

// const backgroundLocationTask = async (taskData) => {
//   const { intervalMs } = taskData;
//   while (BackgroundService.isRunning()) {
//     // ⚠️ Logic Change: Wait first, or execute first? 
//     // Usually wait first to avoid double call if triggered immediately after foreground start.
//     await sleep(intervalMs);
//     try {
//       await new Promise((resolve) => {
//         Geolocation.getCurrentPosition(
//           async (position) => {
//             const { latitude, longitude } = position.coords;
//             const online = await checkInternetConnectivity();
//             if (!online) {
//               await appendNetworkLog('offline');
//               await sendOfflineStatus('network_off', null);
//               resolve();
//               return;
//             }
//             // Logic is strictly inside sendLocationToServer now
//             await sendLocationToServer(latitude, longitude, null);
//             resolve();
//           },
//           () => {
//             // Location error in background
//             sendOfflineStatus('location_off', null);
//             resolve();
//           },
//           { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true },
//         );
//       });
//     } catch (e) { }
//   }
// };

// const startBackgroundLocation = async () => {
//   if (!await BackgroundService.isRunning()) {
//     await BackgroundService.start(backgroundLocationTask, backgroundOptions);
//     console.log("✅ Background Service Started");
//   }
// };
// const stopBackgroundLocation = async () => {
//   if (await BackgroundService.isRunning()) {
//     await BackgroundService.stop();
//     console.log("🛑 Background Service Stopped");
//   }
// };

// // ---- Permissions & Tracking ----
// async function requestLocationPermission() {
//   if (Platform.OS === 'android') {
//     const grantedFine = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
//     if (grantedFine === PermissionsAndroid.RESULTS.GRANTED) {
//       if (Platform.Version >= 29) {
//         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
//       }
//       return true;
//     }
//     return false;
//   }
//   return true;
// }

// const startLocationTracking = (setLocationState, redirectToLogin) => {
//   console.log("🚀 Starting Foreground Tracking (Map Update)...");
//   if (watchId !== null) Geolocation.clearWatch(watchId);
//   if (foregroundTimerId) {
//     clearInterval(foregroundTimerId);
//     foregroundTimerId = null;
//   }
//   skipNextWatchSend = true;

//   watchId = Geolocation.watchPosition(
//     (position) => {
//       const { latitude, longitude } = position.coords;
//       setLocationState({ latitude, longitude });
//       lastKnownLocation = { latitude, longitude };
//       // Location change - normal tracking
//       sendLocationToServer(latitude, longitude, redirectToLogin);
//     },
//     (error) => {
//       console.log("Watch Position Error:", error);
//       // Location turned off while app in foreground/background
//       sendOfflineStatus('location_off', redirectToLogin);
//     },
//     { enableHighAccuracy: true, distanceFilter: 5, interval: 300000, fastestInterval: 120000, showsBackgroundLocationIndicator: true, forceRequestLocation: true, showLocationDialog: true }
//   );

//   foregroundTimerId = setInterval(() => {
//     if (lastKnownLocation) {
//       sendLocationToServer(lastKnownLocation.latitude, lastKnownLocation.longitude, redirectToLogin);
//     }
//   }, 300000);
// };

// const stopLocationTracking = () => {
//   console.log("🛑 Stopping Foreground Tracking...");
//   if (watchId !== null) {
//     Geolocation.clearWatch(watchId);
//     watchId = null;
//   }
//   if (foregroundTimerId) {
//     clearInterval(foregroundTimerId);
//     foregroundTimerId = null;
//   }
//   skipNextWatchSend = false;
// };

// // ================= COMPONENT START =================
// const Home = () => {
//   const [currentTime, setCurrentTime] = useState("");
//   const [currentDate, setCurrentDate] = useState("");
//   const [isCheckedIn, setIsCheckedIn] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [hasInitialLocationSent, setHasInitialLocationSent] = useState(false);
//   const [locationErrorExplanation, setLocationErrorExplanation] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [refreshing, setRefreshing] = useState(false);
//   const [isOnline, setIsOnline] = useState(true);
//   const [lastOfflineAt, setLastOfflineAt] = useState(null);

//   const navigation = useNavigation();
//   const redirectToLogin = () => navigation.navigate("Login");

//   useEffect(() => {
//     isCheckedInRefValue = isCheckedIn;
//   }, [isCheckedIn]);

//   const configureBackgroundFetch = async () => {
//     if (bgFetchStarted) return;
//     await BackgroundFetch.configure({
//       minimumFetchInterval: 15, // IOS minimum is 15
//       stopOnTerminate: false,
//       startOnBoot: true,
//       enableHeadless: true,
//       forceAlarmManager: true, // Android Specific for better timing
//     }, async (taskId) => {
//       try {
//         if (isCheckedInRefValue) {
//           await new Promise((resolve) => {
//             Geolocation.getCurrentPosition(
//               async (position) => {
//                 const { latitude, longitude } = position.coords;
//                 const online = await checkInternetConnectivity();
//                 if (!online) {
//                   await appendNetworkLog('offline');
//                   await sendOfflineStatus('network_off', null);
//                   resolve();
//                   return;
//                 }
//                 // Call API - it will check Async Storage internally
//                 await sendLocationToServer(latitude, longitude, null);
//                 resolve();
//               },
//               () => {
//                 // Background fetch location error
//                 sendOfflineStatus('location_off', null);
//                 resolve();
//               },
//               { enableHighAccuracy: true, timeout: 20000 }
//             );
//           });
//         }
//       } finally {
//         BackgroundFetch.finish(taskId);
//       }
//     }, async (taskId) => {
//       try {
//         BackgroundFetch.finish(taskId);
//       } catch (e) { }
//     });
//     await BackgroundFetch.start();
//     bgFetchStarted = true;
//   };

//   const stopBackgroundFetch = async () => {
//     try { await BackgroundFetch.stop(); } catch { }
//   };

//   // Time & User Load
//   useEffect(() => {
//     const updateTime = () => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase());
//       setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
//     };
//     updateTime();
//     const timer = setInterval(updateTime, 1000);
//     AsyncStorage.getItem("userName").then(name => { if (name) setUserName(name); });
//     AsyncStorage.getItem("isCheckedIn").then(async v => {
//       if (v === 'true') {
//         setIsCheckedIn(true);
//         setIsTracking(true);
//         const hasPermission = await requestLocationPermission();
//         if (hasPermission) {
//           startLocationTracking(setCurrentLocation, redirectToLogin);
//           startBackgroundLocation();
//           configureBackgroundFetch();
//         }
//       }
//     });
//     Promise.all([AsyncStorage.getItem('lastLat'), AsyncStorage.getItem('lastLng')]).then(([lat, lng]) => {
//       if (lat && lng) {
//         const latitude = parseFloat(lat);
//         const longitude = parseFloat(lng);
//         if (!isNaN(latitude) && !isNaN(longitude)) {
//           setCurrentLocation({ latitude, longitude });
//           lastKnownLocation = { latitude, longitude };
//         }
//       }
//     });
//     const runNet = async () => {
//       const ok = await checkInternetConnectivity();
//       if (ok !== isOnline) {
//         if (!ok) {
//           const ts = await appendNetworkLog('offline');
//           setLastOfflineAt(ts);
//           // Network down - try to notify backend
//           await sendOfflineStatus('network_off', redirectToLogin);
//         } else {
//           await appendNetworkLog('online');
//         }
//         setIsOnline(ok);
//       }
//     };
//     runNet();
//     const netTimer = setInterval(runNet, 60000);
//     return () => clearInterval(timer);
//   }, []);

//   // Sync Logic
//   const checkServerStatusAndSync = async () => {
//     if (isSyncingStatus) return;
//     isSyncingStatus = true;
//     const netOk = await checkInternetConnectivity();
//     setIsOnline(netOk);
//     if (!netOk) {
//       const ts = await appendNetworkLog("offline");
//       setLastOfflineAt(ts);
//     }
//     const hasPermission = await requestLocationPermission();
//     if (!hasPermission) {
//       showToast("Permission denied");
//       isSyncingStatus = false;
//       return;
//     }

//     Geolocation.getCurrentPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         setCurrentLocation({ latitude, longitude });
//         lastKnownLocation = { latitude, longitude };
//         AsyncStorage.setItem("lastLat", String(latitude));
//         AsyncStorage.setItem("lastLng", String(longitude));

//         const locResult = netOk
//           ? await sendLocationToServer(latitude, longitude, redirectToLogin, true)
//           : null;

//         const locSuccess = locResult?.response?.ok && locResult?.json?.success === true;
//         setHasInitialLocationSent(!!locSuccess);

//         if (locSuccess) {
//           setLocationErrorExplanation(null);
//           setIsCheckedIn(true);
//           setIsTracking(true);
//           startLocationTracking(setCurrentLocation, redirectToLogin);
//           startBackgroundLocation();
//           configureBackgroundFetch();
//         } else {
//           if (!locResult || !locResult.response) {
//             isSyncingStatus = false;
//             return;
//           }
//           const exp =
//             locResult?.json?.error?.explanation || (!netOk ? "No internet connection" : null);
//           if (!isCheckedIn) {
//             setIsCheckedIn(false);
//             setIsTracking(false);
//             stopLocationTracking();
//             stopBackgroundLocation();
//             stopBackgroundFetch();
//             if (exp) {
//               setLocationErrorExplanation(exp);
//               showToast(exp);
//             } else {
//               setLocationErrorExplanation("Check-in required to start tracking");
//               showToast("Check-in required to start tracking");
//             }
//           } else if (exp) {
//             setLocationErrorExplanation(exp);
//             showToast(exp);
//           }
//         }
//         isSyncingStatus = false;
//       },
//       (error) => {
//         console.log('Location Error in sync:', error);
//         // If location is off while syncing
//         sendOfflineStatus('location_off', redirectToLogin);
//         showToast("Location Error");
//         isSyncingStatus = false;
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 20000,
//         maximumAge: 0,
//         forceRequestLocation: true,
//         showLocationDialog: true,
//       }
//     );
//   };

//   useEffect(() => {
//     checkServerStatusAndSync();
//   }, []);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     showToast("Syncing status...");
//     await checkServerStatusAndSync();
//     setRefreshing(false);
//   }, []);

//   const handleCheckIn = async () => {
//     const hasPermission = await requestLocationPermission();
//     if (!hasPermission) {
//       showToast('Permission denied');
//       return;
//     }

//     console.log("👉 Check-In Button Pressed. Calling API...");
//     Geolocation.getCurrentPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         const result = await getCheckInApiData(latitude, longitude, redirectToLogin);

//         if (result.isSuccess) {
//           console.log("✅ Check-In API Success. Starting Tracking...");
//           setIsCheckedIn(true);
//           setIsTracking(true);
//           setCurrentLocation({ latitude, longitude });
//           setLocationErrorExplanation(null);
//           AsyncStorage.setItem('isCheckedIn', 'true');
//           AsyncStorage.setItem('lastLat', String(latitude));
//           AsyncStorage.setItem('lastLng', String(longitude));

//           startLocationTracking(setCurrentLocation, redirectToLogin);
//           startBackgroundLocation();
//         } else {
//           console.log("❌ Check-In API Failed.");
//         }
//       },
//       (err) => {
//         console.log('Loc Error:', err);
//         sendOfflineStatus('location_off', redirectToLogin);
//         showToast('Location Error');
//       },
//       { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true }
//     );
//   };

//   const handleCheckOut = async () => {
//     const hasPermission = await requestLocationPermission();
//     if (!hasPermission) return;
//     console.log("👉 Check-Out Button Pressed. Calling API...");
//     Geolocation.getCurrentPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         const result = await getCheckOutApiData(latitude, longitude, redirectToLogin);
//         if (result.isSuccess) {
//           console.log("✅ Check-Out Success. Stopping Tracking.");
//           setIsCheckedIn(false);
//           setIsTracking(false);
//           setCurrentLocation(null);
//           AsyncStorage.setItem("isCheckedIn", "false");
//           stopLocationTracking();
//           stopBackgroundLocation();
//           stopBackgroundFetch();
//         }
//       },
//       (err) => {
//         console.log('Loc Error:', err);
//         sendOfflineStatus('location_off', redirectToLogin);
//         showToast('Location Error');
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 20000,
//         maximumAge: 0,
//         forceRequestLocation: true,
//         showLocationDialog: true,
//       }
//     );
//   };

//   // --- RENDER ---
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle={"dark-content"} backgroundColor="#F9FAFB" />
//       <LinearGradient colors={['#1FA2FF', '#12D8FA']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }} style={styles.header}>
//         <View style={styles.headerRow}>
//           <View style={{ marginTop: 10 }}>
//             <Image source={require("../img/logo.png")} style={{ height: 30, width: 40, resizeMode: 'contain' }} />
//           </View>
//           <View>
//             <Text style={styles.greeting}>{userName}</Text>
//           </View>
//         </View>
//       </LinearGradient>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
//         }
//       >
//         <LinearGradient colors={['#1FA2FF', '#12D8FA']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }} style={styles.timeCard}>
//           <View style={styles.timeHeader}>
//             <Image source={require("../img/time.png")} style={{ height: 20, width: 20, marginTop: 5 }} tintColor={"#fff"} />
//             <Text style={styles.timeLabel}> Current Time</Text>
//           </View>
//           <View style={styles.timeBody}>
//             <View style={styles.timeContainer}>
//               <Text style={styles.time}>{currentTime}</Text>
//               <Text style={styles.date}>{currentDate}</Text>
//             </View>
//             <Image source={require("../img/time.png")} style={{ height: 20, width: 20 }} tintColor={"#fff"} />
//           </View>
//         </LinearGradient>

//         {isTracking && (
//           <View style={styles.locationCard}>
//             <View style={styles.locationIconWrapper}>
//               <Image source={require("../img/marker.png")} style={{ height: 20, width: 20 }} tintColor={"red"} />
//             </View>
//             {currentLocation ? (
//               <Text style={styles.locationText}>
//                 Location Active: {`${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
//               </Text>
//             ) : (
//               <Text style={styles.locationText}>Fetching location...</Text>
//             )}
//             <View style={styles.locationDot} />
//           </View>
//         )}

//         {isTracking && currentLocation && (
//           <View style={styles.mapContainer}>
//             <MapView
//               provider={PROVIDER_GOOGLE}
//               style={styles.map}
//               region={{
//                 latitude: currentLocation.latitude,
//                 longitude: currentLocation.longitude,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               }}
//               showsUserLocation={true}
//             >
//               <Marker
//                 coordinate={currentLocation}
//                 title={"Current Location"}
//               />
//             </MapView>
//           </View>
//         )}

//         <View style={[
//           styles.checkContainer,
//           { backgroundColor: isCheckedIn ? "#cfe7ecff" : "#E5E7EB" } // Blue when checked-in, Gray when checked-out
//         ]}>
//           <Text style={[styles.checkStatusText, { color: isCheckedIn ? "#16A34A" : "#DC2626", marginBottom: 15 }]}>
//             Status: {isCheckedIn ? "Checked-In" : "Checked-Out"}
//           </Text>
//           <Text style={{ color: isOnline ? '#16A34A' : '#DC2626', marginBottom: 10 }}>
//             Network: {isOnline ? 'Online' : 'Offline'}{!isOnline && lastOfflineAt ? ` (since ${new Date(lastOfflineAt).toLocaleTimeString()})` : ''}
//           </Text>
//           {!isCheckedIn && hasInitialLocationSent && (
//             <Text style={{ color: '#6B7280', marginBottom: 10 }}>
//               Location synced. Please tap Check-In to start tracking.
//             </Text>
//           )}


//           <View style={styles.checkButtonRow}>
//             <TouchableOpacity
//               style={[styles.checkButton, { backgroundColor: "#16A34A", opacity: isCheckedIn ? 0.6 : 1 }]}
//               onPress={handleCheckIn}
//               disabled={isCheckedIn}
//             >
//               <Image source={require("../img/login.png")} style={{ height: 20, width: 20 }} />
//               <Text style={styles.checkinText}>CHECK-IN</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.checkButton, { backgroundColor: "#DC2626", opacity: !isCheckedIn ? 0.6 : 1 }]}
//               onPress={handleCheckOut}
//               disabled={!isCheckedIn}
//             >
//               <Image source={require("../img/logout.png")} style={{ height: 20, width: 20 }} />
//               <Text style={styles.checkinText}>CHECK-OUT</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.quickActions}>
//           <Text style={styles.quickTitle}>Quick Actions</Text>
//           <View style={styles.actionGrid}>
//             <TouchableOpacity onPress={() => navigation.navigate("DaliySafer")} style={[styles.actionCard,{backgroundColor:"#DBEAFE"}]}>
//               <Image source={require("../img/marker.png")} style={{ height: 30, width: 30 }} tintColor={"#3B82F6"} />
//               <Text style={[styles.actionText, { color: "#3B82F6" }]}>Daily Safar</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => navigation.navigate("Salary")} style={[styles.actionCard,{backgroundColor:"#F3E8FF"}]}>
//               <Image source={require("../img/text.png")} style={{ height: 30, width: 30 }} tintColor={"#A855F7"} />
//               <Text style={[styles.actionText, { color: "#A855F7" }]}>My Claims</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => navigation.navigate("MyVisitsScreen")} style={[styles.actionCard,{backgroundColor:"#E0F2FE"}]}>
//               <Image source={require("../img/marker.png")} style={{ height: 30, width: 30 }} tintColor={"#06B6D4"} />
//               <Text style={[styles.actionText, { color: "#06B6D4" }]}>My Visits</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => navigation.navigate("Attendance")} style={[styles.actionCard,{backgroundColor:"#FFF7ED"}]}>
//               <Image source={require("../img/briefcase.png")} style={{ height: 30, width: 30 }} tintColor={"#FF8C00"} />
//               <Text style={[styles.actionText, { color: "#FF8C00" }]}>Attendance</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// export default Home;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     marginBottom: 10,
//     paddingTop: 40,
//     paddingHorizontal: 20,
//     paddingBottom: 10

//   },
//   headerRow: {
//     flexDirection: 'row',
//     gap: 10,
//     alignItems: "center"

//   },
//   greeting: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#fff",
//   },

//   timeCard: {
//     backgroundColor: "#3B82F6",
//     borderRadius: 12,
//     padding: 20,
//     marginTop: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     marginHorizontal: 15
//   },
//   timeHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   timeLabel: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "700",
//     marginLeft: 4,
//   },
//   timeBody: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   timeContainer: {
//     flex: 1,
//   },
//   time: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "700",
//   },
//   date: {
//     color: "#E0F2FE",
//     fontSize: 14,
//     marginTop: 4,
//   },
//   locationCard: {
//     backgroundColor: "#E6FBF3",
//     borderColor: "#A7F3D0",
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 10,
//     paddingVertical: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 20,
//     marginHorizontal: 16
//   },
//   locationIconWrapper: {
//   },
//   locationText: {
//     color: "#065F46",
//     fontWeight: "600",
//     fontSize: 14,
//     marginLeft: 12,
//     flex: 1,
//   },
//   locationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#10B981",
//     marginLeft: 10,
//   },
//   mapContainer: {
//     height: 200,
//     marginTop: 20,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#E0E0E0',
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   checkContainer: {
//     marginTop: 20,
//     alignItems: "center",
//     backgroundColor: "#989090ff",
//     elevation: 1,
//     shadowRadius: 2,
//     padding: 20,
//     borderRadius: 12,
//     marginHorizontal: 16
//   },
//   checkStatusText: {
//     fontWeight: "700",
//     fontSize: 16,
//   },
//   checkButtonRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   checkButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 30,
//     width: "48%",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   checkinText: {
//     color: "#fff",
//     fontWeight: "700",
//     marginLeft: 8,
//     fontSize: 13,
//   },
//   quickActions: {
//     marginTop: 25,
//     marginBottom: 40,
//     marginHorizontal: 16
//   },
//   quickTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 12,
//   },
//   actionGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   actionCard: {
//     width: "48%",
//     borderRadius: 10,
//     padding: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 10,
//     minHeight: 100,
//     backgroundColor: "#fff",
//     elevation: 1
//   },
//   actionText: {
//     color: "#3B82F6",
//     fontWeight: "600",
//     fontSize: 15,
//   },
// });
// // ✅ FIXED API: Check Auth and Get Response


import React, { useEffect, useState, useCallback } from "react";
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
  Linking,
  Image,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BackgroundService from 'react-native-background-actions';
import { useNavigation } from "@react-navigation/native";
import BackgroundFetch from 'react-native-background-fetch';
import { BaseUrl } from '../../url/env';
import LinearGradient from "react-native-linear-gradient";

// --- Global Location and Tracking State ---
let watchId = null;
// ❌ Removed 'let lastUploadAt = 0;' because memory variables don't sync between threads
let isCheckedInRefValue = false;
let foregroundTimerId = null;
let lastKnownLocation = null;
let isUploadingLocation = false;
let isSyncingStatus = false;
let bgFetchStarted = false;
let skipNextWatchSend = false;
const LOCATION_RATE_LIMIT_MS = 60000; // 1 Minute

const NETWORK_LOG_KEY = 'networkLogs';
const LAST_UPLOAD_KEY = 'lastUploadTimestamp'; // ✅ New Key for Storage

const appendNetworkLog = async (status) => {
  const now = new Date().toISOString();
  try {
    const raw = await AsyncStorage.getItem(NETWORK_LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ status, timestamp: now });
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    await AsyncStorage.setItem(NETWORK_LOG_KEY, JSON.stringify(arr));
  } catch {}
  return now;
};

const checkInternetConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://www.google.com/generate_204', { method: 'GET', cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
};

const showToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    console.log('TOAST:', msg);
  }
};

// --- AUTH & ERROR HANDLERS ---
const handleAuthError = (navigation) => {
  console.log("!! Authentication failed (403). Redirecting to Login.");
  showToast('Session expired. Please log in again.');
  if (typeof navigation === 'function') {
    navigation();
  } else if (navigation && typeof navigation.navigate === 'function') {
    navigation.navigate("Login");
  }
};

const getAuthHeaders = async (redirectToLogin) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.log('!! Token not found in Storage.');
    if (redirectToLogin) redirectToLogin(); 
    return null;
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// ✅ UPDATED: Unified fetch with DETAILED LOGGING
const checkAuthAndGetResponse = async (url, options, redirectToLogin, timeoutMs = 15000) => {
  console.log(`\n🔵 [API REQUEST]`);
  console.log(`URL: ${url}`);

  // ✅ Prevent "hung" fetch calls from blocking future uploads forever.
  // RN fetch supports AbortController in modern versions.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const responseText = await response.text();
    let json = null;
    try {
      json = JSON.parse(responseText);
    } catch (e) {
      console.log(`!! API JSON Parse Error.`);
    }

    if (
      response.status === 403 &&
      redirectToLogin &&
      json?.error?.statusCode === 403
    ) {
      handleAuthError(redirectToLogin);
    }

    console.log(`🟢 [API RESPONSE] Status: ${response.status}`);
    return { response: response, json: json, error: json?.error?.explanation || null, status: response.status };
  } catch (err) {
    console.log(`🔴 [API ERROR]:`, err);
    return { response: null, json: null, error: 'Network Error', status: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
};

// ✅ FIXED API: Send Location with AsyncStorage Check (PERIODIC)
// NOTE: Ye function 5 minute ka rate limit lagata hai. Isko sirf
// backgroundLocationTask (periodic upload) ke liye use kar rahe hain.
// App load / pull-to-refresh / status check ke liye alag helper use hoga.
// ✅ FIXED API: Send Location with AsyncStorage Check (PERIODIC) - NOW WITH DETAILED LOGS
const sendLocationToServer = async (latitude, longitude, redirectToLogin, caller = 'unknown') => {
  console.log(`\n📍 LOCATION API CALL STARTED from: ${caller}`);
  console.log(`📍 Coordinates: ${latitude}, ${longitude}`);
  
  try {
    if (isUploadingLocation) {
      console.log(`🚫 CONDITION 1: Already uploading (isUploadingLocation=true)`);
      return { response: null, json: null };
    }

    const now = Date.now();

    // ✅ CHECK 1: Read last upload time from Storage (shared across all threads/tasks)
    const lastUploadStr = await AsyncStorage.getItem(LAST_UPLOAD_KEY);
    const lastUploadTime = lastUploadStr ? parseInt(lastUploadStr, 10) : 0;
    const timeDiff = now - lastUploadTime;
    const remainingWait = LOCATION_RATE_LIMIT_MS - timeDiff;

    console.log(`⏰ CONDITION 1 CHECK:`);
    console.log(`   - Now: ${now}`);
    console.log(`   - Last Upload: ${lastUploadTime}`);
    console.log(`   - Time Diff: ${timeDiff}ms (${(timeDiff/1000).toFixed(1)}s)`);
    console.log(`   - Rate Limit: ${LOCATION_RATE_LIMIT_MS}ms (5min)`);
    console.log(`   - Remaining Wait: ${remainingWait}ms (${(remainingWait/1000).toFixed(1)}s)`);

    if (timeDiff < LOCATION_RATE_LIMIT_MS) {
      console.log(`🚫 CONDITION 1: RATE LIMIT ACTIVE - SKIPPING UPLOAD ❌`);
      console.log(`   ⏳ Wait ${(remainingWait/1000).toFixed(1)}s before next upload`);
      return { response: null, json: null };
    }

    console.log(`✅ CONDITION 1 PASSED: Rate limit OK`);

    isUploadingLocation = true;
    
    const headers = await getAuthHeaders(redirectToLogin);
    if (!headers) {
        console.log(`🚫 CONDITION 2: NO AUTH HEADERS (token missing/expired) ❌`);
        isUploadingLocation = false;
        return { response: null, json: null };
    }
    console.log(`✅ CONDITION 2 PASSED: Auth headers OK`);

    const deviceTimestamp = new Date().toISOString();
    const options = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        latitude: String(latitude),
        longitude: String(longitude),
        deviceTimestamp,
      }),
    };
    
    console.log(`🌐 SENDING API REQUEST to: ${BaseUrl}/employees/location`);
    
    const result = await checkAuthAndGetResponse(`${BaseUrl}/employees/location`, options, redirectToLogin);

    // ✅ CHECK 3: If success, SAVE time to storage
    if (result.response && result.response.ok) {
        await AsyncStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()));
        console.log(`✅ CONDITION 3: API SUCCESS (200) - Timestamp SAVED to storage`);
        console.log(`✅ LOCATION UPLOAD COMPLETE from ${caller} ✓`);
    } else {
        console.log(`❌ CONDITION 3: API FAILED`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Error: ${result.error || 'Unknown error'}`);
    }

    return result;

  } catch (err) {
    console.log(`💥 CATCH ERROR in sendLocationToServer:`, err);
    return { response: null, json: null };
  }
  finally {
    isUploadingLocation = false;
    console.log(`🔚 LOCATION API CALL ENDED from: ${caller}\n`);
  }
};

// ✅ IMMEDIATE STATUS API (no 5-min rate limit)
// App load hone par aur pull-to-refresh par use karein taaki
// hamesha latest status mile, chahe 5 minute na hue ho.
const sendLocationStatusNow = async (latitude, longitude, redirectToLogin) => {
  try {
    const headers = await getAuthHeaders(redirectToLogin);
    if (!headers) return { response: null, json: null, error: null, status: 0 };

    const deviceTimestamp = new Date().toISOString();
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        latitude: String(latitude),
        longitude: String(longitude),
        deviceTimestamp,
      }),
    };

    return await checkAuthAndGetResponse(`${BaseUrl}/employees/location`, options, redirectToLogin);
  } catch (err) {
    console.log('Location STATUS API Error:', err);
    return { response: null, json: null, error: 'Network Error', status: 0 };
  }
};

// API: Attendance (CheckIn/CheckOut)
const sendAttendanceData = async (endpoint, method, payload, redirectToLogin) => {
  const headers = await getAuthHeaders(redirectToLogin);
  if (!headers) return { isSuccess: false };
  
  const options = {
    method: method,
    headers: headers,
    body: JSON.stringify(payload),
  };
  
  const result = await checkAuthAndGetResponse(`${BaseUrl}/${endpoint}`, options, redirectToLogin);
  const isSuccess = result.response?.ok && result.json?.success === true;
  
  if (isSuccess && method === 'POST') {
    // optional extra logic on successful POST
  }

  let msg = result.error;
  if (isSuccess) {
    msg = result.json?.message || (method === 'POST' ? 'Check-in successful.' : 'Check-out successful.');
  } else if (!msg) {
    msg = `Failed (Status: ${result.status})`;
  }

  if (result.status !== 403) showToast(msg);
  return { isSuccess: isSuccess, status: result.status, json: result.json };
};

// API: Offline status when location or network is off
const sendOfflineStatus = async (reason, redirectToLogin) => {
  try {
    const headers = await getAuthHeaders(redirectToLogin);
    if (!headers) return { response: null, json: null };

    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reason,
        deviceTimestamp: new Date().toISOString(),
      }),
    };

    return await checkAuthAndGetResponse(`${BaseUrl}/offline`, options, redirectToLogin);
  } catch (err) {
    console.log('Offline API error:', err);
    return { response: null, json: null };
  }
};

// ✅ API Wrappers
const getCheckInApiData = async (latitude, longitude, redirectToLogin) => {
  const payload = { latitude: String(latitude), longitude: String(longitude), deviceTimestamp: new Date().toISOString() };
  return sendAttendanceData('attendance/checkin', 'POST', payload, redirectToLogin);
};

const getCheckOutApiData = async (latitude, longitude, redirectToLogin) => {
  const payload = { latitude: String(latitude), longitude: String(longitude), deviceTimestamp: new Date().toISOString() };
  return sendAttendanceData('attendance/checkout', 'PUT', payload, redirectToLogin);
};

// ... (Baki ka code same rahega, bas logic fix ho gaya hai) ...
// BackgroundService aur Components me koi change nahi chahiye, 
// kyunki wo sab 'sendLocationToServer' ko call karte hain, 
// aur rate limit ab waha Storage ke through handle ho raha hai.

// ---- Background Service ----
const backgroundOptions = {
  taskName: 'HRMSLocationTracking',
  taskTitle: 'Location tracking active',
  taskDesc: 'HRMS Tracking Active',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#3B82F6',
  linkingURI: 'asotorlogy://home',
  parameters: { intervalMs: 60000 }, 
};
const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

const backgroundLocationTask = async (taskData) => {
  const { intervalMs } = taskData;

  while (BackgroundService.isRunning()) {
    try {
      await new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const online = await checkInternetConnectivity();
            if (!online) {
              await appendNetworkLog('offline');
              await sendOfflineStatus('network_off', null);
              resolve();
              return;
            }
            // ✅ Throttled inside sendLocationToServer (5-min rate limit)
            await sendLocationToServer(latitude, longitude, null, 'backgroundLocationTask');
            resolve();
          },
          () => {
            // Location error in background
            sendOfflineStatus('location_off', null);
            resolve();
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true },
        );
      });
    } catch (e) {
      // swallow; we'll retry after interval
    }

    // ✅ CRITICAL: Sleep every loop. Without this, the task runs in a tight loop
    // and devices may throttle/kill it; you also won't get a clean 5-minute cadence.
    await sleep(intervalMs);
  }
};

const startBackgroundLocation = async () => {
  if (!await BackgroundService.isRunning()) {
    await BackgroundService.start(backgroundLocationTask, backgroundOptions);
    console.log("✅ Background Service Started");
  }
};
const stopBackgroundLocation = async () => {
  if (await BackgroundService.isRunning()) {
    await BackgroundService.stop();
    console.log("🛑 Background Service Stopped");
  }
};

// ---- Permissions & Tracking ----
async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    // Android 13+ requires notification permission to show foreground-service notification reliably.
    if (Platform.Version >= 33) {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch {}
    }

    const grantedFine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (grantedFine === PermissionsAndroid.RESULTS.GRANTED) {
      if (Platform.Version >= 29) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
      }
      return true;
    }
    return false;
  }
  return true;
}

const startLocationTracking = (setLocationState, redirectToLogin) => {
  console.log("🚀 Starting Foreground Tracking (Map Update)...");
  if (watchId !== null) Geolocation.clearWatch(watchId);
  if (foregroundTimerId) {
    clearInterval(foregroundTimerId);
    foregroundTimerId = null;
  }
  skipNextWatchSend = true;

  watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setLocationState({ latitude, longitude });
      lastKnownLocation = { latitude, longitude };
      // Location change - normal tracking (rate limit handled inside)
      sendLocationToServer(latitude, longitude, redirectToLogin, 'watchPosition'); 
    },
    (error) => {
      console.log("Watch Position Error:", error);
      // Location turned off while app in foreground/background
      sendOfflineStatus('location_off', redirectToLogin);
    },
    { enableHighAccuracy: true, distanceFilter: 5, interval: 60000, fastestInterval: 30000, showsBackgroundLocationIndicator: true, forceRequestLocation: true, showLocationDialog: true }
  );
  
  foregroundTimerId = setInterval(() => {
    if (lastKnownLocation) {
      // Timer se bhi wahi API call hogi, but 5 minute ka rate limit
      // AsyncStorage based check already kar raha hai.
      sendLocationToServer(
        lastKnownLocation.latitude,
        lastKnownLocation.longitude,
        redirectToLogin,
        'foregroundTimer'
      );
    }
  }, 60000);
};

const stopLocationTracking = () => {
  console.log("🛑 Stopping Foreground Tracking...");
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (foregroundTimerId) {
    clearInterval(foregroundTimerId);
    foregroundTimerId = null;
  }
  skipNextWatchSend = false;
};

// ================= COMPONENT START =================
const Home = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  console.log("Home Render - isCheckedIn:", isCheckedIn);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hasInitialLocationSent, setHasInitialLocationSent] = useState(false);
  const [locationErrorExplanation, setLocationErrorExplanation] = useState(null);
  const [userName, setUserName] = useState("User"); 
  const [refreshing, setRefreshing] = useState(false); 
  const [isOnline, setIsOnline] = useState(true);
  const [lastOfflineAt, setLastOfflineAt] = useState(null);

  const navigation = useNavigation();
  const redirectToLogin = () => navigation.navigate("Login");

  useEffect(() => {
    isCheckedInRefValue = isCheckedIn;
  }, [isCheckedIn]);

  const configureBackgroundFetch = async () => {
    if (bgFetchStarted) return;
    await BackgroundFetch.configure({
      minimumFetchInterval: 15, // IOS minimum is 15
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      forceAlarmManager: true, // Android Specific for better timing
    }, async (taskId) => {
      try {
        if (isCheckedInRefValue) {
          await new Promise((resolve) => {
            Geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const online = await checkInternetConnectivity();
                if (!online) {
                  await appendNetworkLog('offline');
                  await sendOfflineStatus('network_off', null);
                  resolve();
                  return;
                }
                // Call API - it will check Async Storage internally
                await sendLocationToServer(latitude, longitude, null, 'backgroundFetch');
                resolve();
              },
              () => {
                // Background fetch location error
                sendOfflineStatus('location_off', null);
                resolve();
              },
              { enableHighAccuracy: true, timeout: 20000 }
            );
          });
        }
      } finally {
        BackgroundFetch.finish(taskId);
      }
    }, async (taskId) => {
      try {
        BackgroundFetch.finish(taskId);
      } catch (e) {}
    });
    await BackgroundFetch.start();
    bgFetchStarted = true;
  };

  const stopBackgroundFetch = async () => {
    try { await BackgroundFetch.stop(); } catch {}
  };

  // Time & User Load
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase());
      setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    AsyncStorage.getItem("userName").then(name => { if(name) setUserName(name); });
    AsyncStorage.getItem("isCheckedIn").then(async v => {
      if (v === 'true') {
        setIsCheckedIn(true);
        setIsTracking(true);
        const hasPermission = await requestLocationPermission();
        if (hasPermission) {
          startLocationTracking(setCurrentLocation, redirectToLogin);
          startBackgroundLocation();
          configureBackgroundFetch();
        }
      }
    });
    Promise.all([AsyncStorage.getItem('lastLat'), AsyncStorage.getItem('lastLng')]).then(([lat, lng]) => {
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (!isNaN(latitude) && !isNaN(longitude)) {
          setCurrentLocation({ latitude, longitude });
          lastKnownLocation = { latitude, longitude };
        }
      }
    });
    const runNet = async () => {
      const ok = await checkInternetConnectivity();
      if (ok !== isOnline) {
        if (!ok) {
          const ts = await appendNetworkLog('offline');
          setLastOfflineAt(ts);
          // Network down - try to notify backend
          await sendOfflineStatus('network_off', redirectToLogin);
        } else {
          await appendNetworkLog('online');
        }
        setIsOnline(ok);
      }
    };
    runNet();
    const netTimer = setInterval(runNet, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(netTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync Logic
  const checkServerStatusAndSync = async () => {
    if (isSyncingStatus) return;
    isSyncingStatus = true;
    const netOk = await checkInternetConnectivity();
    setIsOnline(netOk);
    if (!netOk) {
      const ts = await appendNetworkLog("offline");
      setLastOfflineAt(ts);
    }
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showToast("Permission denied");
      isSyncingStatus = false;
      return;
    }
Geolocation.getCurrentPosition(
  async (pos) => {
    const { latitude, longitude } = pos.coords;
    setCurrentLocation({ latitude, longitude });
    lastKnownLocation = { latitude, longitude };
    AsyncStorage.setItem("lastLat", String(latitude));
    AsyncStorage.setItem("lastLng", String(longitude));

    // ✅ Network check यहाँ
    const netOk = await checkInternetConnectivity();
    setIsOnline(netOk);

    // ✅ STATUS API: app load / refresh पर
    let statusResult = null;
    if (netOk) {
      statusResult = await sendLocationStatusNow(latitude, longitude, redirectToLogin);
    }
    
    const statusSuccess = statusResult?.response?.ok && statusResult?.json?.success === true;
    setHasInitialLocationSent(!!statusSuccess);

    // ✅ CLEAN LOGIC: Status के basis पर decision
    if (statusSuccess) {
      // ✅ SUCCESS: Start tracking
      setIsCheckedIn(true);
      setIsTracking(true);
      setLocationErrorExplanation(null);
      isCheckedInRefValue = true;
      
      startLocationTracking(setCurrentLocation, redirectToLogin);
      startBackgroundLocation();
      configureBackgroundFetch();
      showToast("Status synced ✓");
      
    } else {
      // ❌ FAILED: Stop tracking + show error
      setIsCheckedIn(false);
      setIsTracking(false);
      stopLocationTracking();
      stopBackgroundLocation();
      stopBackgroundFetch();
      
      const exp = statusResult?.json?.error?.explanation || 
                  (!netOk ? 'No internet connection' : 'Check-in required');
      setLocationErrorExplanation(exp);
      showToast(exp);
    }
    
    isSyncingStatus = false; // ✅ हमेशा end में
  },
  (error) => {
    console.log('Location Error:', error);
    sendOfflineStatus('location_off', redirectToLogin);
    showToast("Location Error");
    
    // Location fail = CHECKED OUT
    setIsCheckedIn(false);
    setIsTracking(false);
    stopLocationTracking();
    stopBackgroundLocation();
    stopBackgroundFetch();
    
    isSyncingStatus = false;
  },
  {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
    forceRequestLocation: true,
    showLocationDialog: true,
  }

);
  }

  useEffect(() => {
    checkServerStatusAndSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    showToast("Syncing status...");
    await checkServerStatusAndSync();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showToast('Permission denied');
      return;
    }

    console.log("👉 Check-In Button Pressed. Calling API...");
    Geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            const result = await getCheckInApiData(latitude, longitude, redirectToLogin);

            if (result.isSuccess) {
                console.log("✅ Check-In API Success. Starting Tracking...");
                setIsCheckedIn(true);
                setIsTracking(true);
                setCurrentLocation({ latitude, longitude });
                setLocationErrorExplanation(null);
                AsyncStorage.setItem('isCheckedIn', 'true');
                AsyncStorage.setItem('lastLat', String(latitude));
                AsyncStorage.setItem('lastLng', String(longitude));

                startLocationTracking(setCurrentLocation, redirectToLogin);
                startBackgroundLocation();
                // ✅ Also start BackgroundFetch on check-in so if OS kills UI,
                // the app still has a chance to sync (note: not guaranteed every 5 min).
                configureBackgroundFetch();
            } else {
                console.log("❌ Check-In API Failed.");
            }
        },
        (err) => { 
          console.log('Loc Error:', err); 
          sendOfflineStatus('location_off', redirectToLogin);
          showToast('Location Error'); 
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true }
    );
  };

  const handleCheckOut = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;
    console.log("👉 Check-Out Button Pressed. Calling API...");
    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = await getCheckOutApiData(latitude, longitude, redirectToLogin);
        if (result.isSuccess) {
            console.log("✅ Check-Out Success. Stopping Tracking.");
            setIsCheckedIn(false);
            setIsTracking(false);
            setCurrentLocation(null);
            AsyncStorage.setItem("isCheckedIn", "false");
            stopLocationTracking();
            stopBackgroundLocation();
            stopBackgroundFetch();
        }
      },
      (err) => {
        console.log('Loc Error:', err);
        sendOfflineStatus('location_off', redirectToLogin);
        showToast('Location Error');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1FA2FF" }} >
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF"  />

    <View style={styles.container}>
       <LinearGradient colors={['#1FA2FF', '#1FA2FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ marginTop: 10 }}>
            <Image source={require("../img/logo.png")} style={{ height: 30, width: 40, resizeMode: 'contain' }} />
          </View>
          <View>
            <Text style={styles.greeting}>{userName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
        }
      >
         <LinearGradient colors={['#1FA2FF', '#12D8FA']}          start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 0 }} style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Image source={require("../img/time.png")} style={{ height: 20, width: 20 }} tintColor={"#fff"} />
            <Text style={styles.timeLabel}> Current Time</Text>
          </View>
          <View style={styles.timeBody}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{currentTime}</Text>
              <Text style={styles.date}>{currentDate}</Text>
            </View>
            <Image source={require("../img/time.png")} style={{ height: 30, width: 30 }} tintColor={"#fff"} />
          </View>
        </LinearGradient>

        {isTracking && (
          <View style={styles.locationCard}>
            <View style={styles.locationIconWrapper}>
              <Image source={require("../img/marker.png")} style={{ height: 20, width: 20 }} tintColor={"red"} />
            </View>
            {currentLocation ? (
              <Text style={styles.locationText}>
                Location Active: {`${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </Text>
            ) : (
              <Text style={styles.locationText}>Fetching location...</Text>
            )}
            <View style={styles.locationDot} />
          </View>
        )}

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
              <Marker
                coordinate={currentLocation}
                title={"Current Location"}
              />
            </MapView>
          </View>
        )}
        
        <View style={[
          styles.checkContainer,
         { backgroundColor: isCheckedIn ? "#cfe7ecff" : "#E5E7EB" } // Blue when checked-in, Gray when checked-out
      ]}>
          <Text style={[styles.checkStatusText, {color: isCheckedIn ? "#16A34A" : "#DC2626", marginBottom: 15}]}>
            Status: {isCheckedIn ? "Checked-In" : "Checked-Out"}
          </Text>
          <Text style={{ color: isOnline ? '#16A34A' : '#DC2626', marginBottom: 10 }}>
            Network: {isOnline ? 'Online' : 'Offline'}{!isOnline && lastOfflineAt ? ` (since ${new Date(lastOfflineAt).toLocaleTimeString()})` : ''}
          </Text>
          {!isCheckedIn && hasInitialLocationSent && (
            <Text style={{ color: '#6B7280', marginBottom: 10 }}>
              Location synced. Please tap Check-In to start tracking.
            </Text>
          )}
          {!isCheckedIn && locationErrorExplanation && (
            <Text style={{ color: '#DC2626', marginBottom: 10 }}>
              {locationErrorExplanation}
            </Text>
          )}
          
          <View style={styles.checkButtonRow}>
            <TouchableOpacity
              style={[styles.checkButton, { backgroundColor: "#16A34A", opacity: isCheckedIn ? 0.6 : 1 }]}
              onPress={handleCheckIn}
              disabled={isCheckedIn} 
            >
              <Image source={require("../img/login.png")} style={{height:20,width:20}} />
              <Text style={styles.checkinText}>CHECK-IN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkButton, { backgroundColor: "#DC2626", opacity: !isCheckedIn ? 0.6 : 1 }]}
              onPress={handleCheckOut}
              disabled={!isCheckedIn} 
            >
             <Image source={require("../img/logout.png")} style={{height:20,width:20}} />
              <Text style={styles.checkinText}>CHECK-OUT</Text>
            </TouchableOpacity>
          </View>
        </View>

       <View style={styles.quickActions}>
          <Text style={styles.quickTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity onPress={() => navigation.navigate("DaliySafer")} style={[styles.actionCard,{backgroundColor:"#DBEAFE"}]}>
              <Image source={require("../img/marker.png")} style={{ height: 30, width: 30 }} tintColor={"#3B82F6"} />
              <Text style={[styles.actionText, { color: "#3B82F6" }]}>Daily Safar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Salary")} style={[styles.actionCard,{backgroundColor:"#F3E8FF"}]}>
              <Image source={require("../img/text.png")} style={{ height: 30, width: 30 }} tintColor={"#A855F7"} />
              <Text style={[styles.actionText, { color: "#A855F7" }]}>My Claims</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("MyVisitsScreen")} style={[styles.actionCard,{backgroundColor:"#E0F2FE"}]}>
              <Image source={require("../img/marker.png")} style={{ height: 30, width: 30 }} tintColor={"#06B6D4"} />
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0

  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingBottom: 10

  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: "center"

  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  timeCard: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 4,
  },
  timeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  timeContainer: {
    flex: 1,
  },
  time: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  date: {
    color: "#E0F2FE",
    fontSize: 14,
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: "#E6FBF3",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 16
  },
locationIconWrapper: {  // ✅ NOW DEFINED
    // Can be empty or add padding/margin if needed
  },
  locationText: {
    color: "#065F46",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginLeft: 10,
  },
  mapContainer: {
    height: 200,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  checkContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#989090ff",
    elevation: 1,
    shadowRadius: 2,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16
  },
  checkStatusText: {
    fontWeight: "700",
    fontSize: 16,
  },
  checkButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: "48%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  checkinText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },
  quickActions: {
    marginTop: 25,
    marginBottom: 40,
    marginHorizontal: 16
  },
  quickTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 100,
    backgroundColor: "#fff",
    elevation: 1
  },
  actionText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 15,
  },
});