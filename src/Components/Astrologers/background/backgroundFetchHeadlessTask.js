// import BackgroundFetch from 'react-native-background-fetch';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Geolocation from 'react-native-geolocation-service';
// import { BaseUrl } from '../url/env';

// const LAST_UPLOAD_KEY = 'lastUploadTimestamp';
// const LOCATION_RATE_LIMIT_MS = 60000; // 1 minute

// const getAuthHeaders = async () => {
//   const token = await AsyncStorage.getItem('authToken');
//   if (!token) return null;
//   return {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${token}`,
//   };
// };

// const sendLocationToServer = async (latitude, longitude) => {
//   const headers = await getAuthHeaders();
//   if (!headers) return;

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 15000);

//   try {
//     const deviceTimestamp = new Date().toISOString();
//     const res = await fetch(`${BaseUrl}/employees/location`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         latitude: String(latitude),
//         longitude: String(longitude),
//         deviceTimestamp,
//       }),
//       signal: controller.signal,
//     });

//     if (res.ok) {
//       await AsyncStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()));
//     }
//   } catch (e) {
//     // ignore in headless
//   } finally {
//     clearTimeout(timeoutId);
//   }
// };

// const getCurrentPositionAsync = () =>
//   new Promise((resolve, reject) => {
//     Geolocation.getCurrentPosition(
//       (pos) => resolve(pos),
//       (err) => reject(err),
//       {
//         enableHighAccuracy: true,
//         timeout: 20000,
//         maximumAge: 0,
//         forceRequestLocation: true,
//         showLocationDialog: false,
//       },
//     );
//   });

// // Runs when OS triggers BackgroundFetch and app is terminated (Android).
// // NOTE: This is best-effort; Android/iOS do NOT guarantee exact 5-minute timing.
// export default async function backgroundFetchHeadlessTask(event) {
//   const { taskId } = event;

//   try {
//     const checkedIn = await AsyncStorage.getItem('isCheckedIn');
//     if (checkedIn !== 'true') return;

//     const now = Date.now();
//     const lastUploadStr = await AsyncStorage.getItem(LAST_UPLOAD_KEY);
//     const lastUploadTime = lastUploadStr ? parseInt(lastUploadStr, 10) : 0;

//     if (now - lastUploadTime < LOCATION_RATE_LIMIT_MS) {
//       return;
//     }

//     const pos = await getCurrentPositionAsync();
//     const { latitude, longitude } = pos.coords;
//     await sendLocationToServer(latitude, longitude);
//   } catch (e) {
//     // ignore
//   } finally {
//     BackgroundFetch.finish(taskId);
//   }
// }