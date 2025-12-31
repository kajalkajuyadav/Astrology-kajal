// import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
// import React, { useEffect, useState } from 'react';
// import { BaseUrl } from '../../url/env';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const Offline = () => {
//   const [data, setData] = useState([]);
//   const [refreshing, setRefreshing] = useState(false); // 🔥 Refresh state

//   useEffect(() => {
//     getOfflineData();
//   }, []);

//  const getOfflineData = async () => {
//   try {
//     const token = await AsyncStorage.getItem('authToken');

//     const myHeaders = new Headers();
//     myHeaders.append("Authorization", `Bearer ${token}`);

//     const requestOptions = {
//       method: "GET",
//       headers: myHeaders,
//     };

//     const response = await fetch(`${BaseUrl}/offline`, requestOptions);
//     const result = await response.json();

//     // 🔥 CHECK IF TOKEN EXPIRED OR INVALID
//     if (!result.success && result?.error?.statusCode === 403) {
//       console.log("Token expired — redirecting to Login");

//       await AsyncStorage.removeItem("authToken"); // clear token
//       navigation.reset({
//         index: 0,
//         routes: [{ name: "Login" }],
//       });
//       return;
//     }

//     // NORMAL SUCCESS
//     if (result.success) {
//       setData(result.data);
//     } else {
//       console.log("SUCCESS: FALSE → Something went wrong");
//     }

//   } catch (error) {
//     console.error("API Error:", error);
//   }
// };


//   // 🔄 Pull to refresh function
//   const onRefresh = async () => {
//     setRefreshing(true);
//     await getOfflineData();
//     setRefreshing(false);
//   };

//  const formatTime = (iso) => {
//   const d = new Date(iso);

//   const day = String(d.getDate()).padStart(2, "0");
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const year = d.getFullYear();

//   let hours = d.getHours();
//   const minutes = String(d.getMinutes()).padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";

//   hours = hours % 12 || 12; // 0 ko 12 banata hai
//   hours = String(hours).padStart(2, "0");

//   return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
// };

//   return (
//     <View style={styles.container}>

//       <FlatList
//         data={data}
//         keyExtractor={(item) => item._id}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={["#1A73E8"]}
//           />
//         }
//         renderItem={({ item }) => (
//           <View style={styles.card}>

//             {/* HEADER */}
//             <View style={styles.headerRow}>
//               <View style={{ flexDirection: "row", gap: 6 }}>
//                 <Text style={styles.label}>Name:</Text>
//                 <Text style={styles.value}>{item.employee?.name}</Text>
//               </View>

//               <View style={styles.statusBadge}>
//                 <View style={styles.statusDot} />
//                 <Text style={styles.statusText}>Offline</Text>
//               </View>
//             </View>

//             {/* TIME */}
//             <View style={styles.footerRow}>
//               <View style={styles.timeBadge}>
//                 <Text style={styles.timeText}>⏱ {formatTime(item.createdAt)}</Text>
//               </View>
//             </View>

//           </View>
//         )}
//       />

//     </View>
//   );
// };

// export default Offline;



// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f7fa",
//     marginBottom:20,
//     marginTop:10,
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 18,
//     borderRadius: 14,
//     marginBottom: 14,
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 1,
//     borderWidth: 0.6,
//     borderColor: "#f1f1f1",
    
//   },

//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },

//   label: {
//     fontSize: 18,
//     color: "#222",
//     marginBottom: 2,
//     fontWeight: "700",

//   },

//   value: {
//     fontSize: 18,
//     fontWeight: "400",
//     color: "#888",
//   },

//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFE7E7",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//   },

//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 10,
//     backgroundColor: "#FF4D4D",
//     marginRight: 6,
//   },

//   statusText: {
//     color: "#D9534F",
//     fontWeight: "600",
//     fontSize: 13,
//   },

//   footerRow: {
//     marginTop:4,
//     flexDirection: "row",
//     justifyContent: "flex-start",
//   },

//   timeBadge: {
//     backgroundColor: "#E9F2FF",
//     paddingVertical: 4,
//     paddingHorizontal:10,
//     borderRadius: 20,
//   },

//   timeText: {
//     color: "#1A73E8",
//     fontWeight: "600",
//     fontSize: 13,
//   },
// });


import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { BaseUrl } from "../../url/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const Offline = () => {
  const navigation = useNavigation();

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    getOfflineData();
  }, [selectedDate]);

  /* ---------- Helpers ---------- */
  const formatDateForApi = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatTime = (iso) => {
    const d = new Date(iso);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;
    hours = String(hours).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  /* ---------- API ---------- */
  const getOfflineData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const date = formatDateForApi(selectedDate);

      const response = await fetch(
        `${BaseUrl}/offline?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      // 🔐 Token expired
      if (!result.success && result?.error?.statusCode === 403) {
        await AsyncStorage.removeItem("authToken");
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      if (result.success) {
        setData(result.data || []);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  /* ---------- Refresh ---------- */
  const onRefresh = async () => {
    setRefreshing(true);
    await getOfflineData();
    setRefreshing(false);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <View style={styles.container}>

      {/* 🔹 HEADER WITH DATE FILTER */}
      <View style={styles.filterHeader}>

        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Image source={require("../img/bookings.png")} style={{height:16,width:16}} tintColor={"#2563EB"}/>
          <Text style={styles.dateText}>
            {formatDateForApi(selectedDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1A73E8"]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No Offline Data Found</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>

            {/* HEADER */}
            <View style={styles.headerRow}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{item.employee?.name}</Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Offline</Text>
              </View>
            </View>

            {/* TIME */}
            <View style={styles.footerRow}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>
                  ⏱ {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* 🔹 DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

export default Offline;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 10,
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignSelf:"flex-end"
  },

  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  dateText: {
    marginLeft: 6,
    color: "#1A73E8",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 0.6,
    borderColor: "#f1f1f1",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  value: {
    fontSize: 18,
    fontWeight: "400",
    color: "#888",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE7E7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#FF4D4D",
    marginRight: 6,
  },

  statusText: {
    color: "#D9534F",
    fontWeight: "600",
    fontSize: 13,
  },

  footerRow: {
    marginTop: 6,
    alignSelf: "flex-start",
  },

  timeBadge: {
    backgroundColor: "#E9F2FF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  timeText: {
    color: "#1A73E8",
    fontWeight: "600",
    fontSize: 13,
  },

  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
  },
});
