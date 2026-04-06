import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
  ToastAndroid
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BaseUrl } from "../../url/env";
import { useNavigation } from "@react-navigation/native";

const { height } = Dimensions.get("window");


const getAddressFromGoogle = async (latitude, longitude) => {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCUf5l0MvNpqpUB2mb9gxz0EcmlybwrpsA`
    );

    const data = await res.json();

    if (data.status === "OK") {
      const result = data.results[0];

      // 🔥 PINCODE nikalna
      let pincode = "";
      result.address_components.forEach((comp) => {
        if (comp.types.includes("postal_code")) {
          pincode = comp.long_name;
        }
      });

      return {
        fullAddress: result.formatted_address,
        pincode: pincode,
      };
    }

    return {
      fullAddress: "Address not found",
      pincode: "",
    };
  } catch (error) {
    console.log("Google reverse geocode error:", error);
    return {
      fullAddress: "Error fetching address",
      pincode: "",
    };
  }
};

/* ---------------- Address Component ---------------- */
const AddressText = ({ latitude, longitude }) => {
  const [address, setAddress] = useState("Fetching...");

  useEffect(() => {
    let mounted = true;

    const loadAddress = async () => {
      const res = await getAddressFromGoogle(latitude, longitude);
      if (mounted) {
        setAddress(`${res.fullAddress}`);
        // agar pincode alag chahiye:
        // console.log("PINCODE:", res.pincode);
      }
    };

    loadAddress();
    return () => (mounted = false);
  }, [latitude, longitude]);

  return <Text style={styles.valueText}>{address}</Text>;
};



/* ---------------- Main Component ---------------- */
const DaliyClaim = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [claim, setClaim] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 26.9124,
    longitude: 75.7873,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    dailyClaim();
  }, [selectedDate]);

  /* ---------- Helpers ---------- */
  const formatDateForApi = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatFullDateTime = (iso) => {
    const date = new Date(iso);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    const t = date.toLocaleTimeString("en-GB");
    return `${d}/${m}/${y}, ${t}`;
  };

  /* ---------- API ---------- */
const dailyClaim = async () => {
    if (!refreshing) setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      const date = formatDateForApi(selectedDate);

      const res = await fetch(
        `${BaseUrl}/employees/get/location/app?date=${date}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();
      console.log("Daily Claim API result:", result);

       // 🔥 SESSION EXPIRE CHECK
  
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


      if (result.success) {
        // 🔥 FIX: Pehle check karein ki data array empty to nahi hai
        if (result.data && result.data.length > 0) {
          const latest = result.data[0];

          // Employee ID set karein agar data exist karta hai
          if (latest.employee?._id) {
            setEmployeeId(latest.employee._id);
            console.log("Employee ID Set From Claim ==> ", latest.employee._id);
          }

          // Map focus aur selection logic
          focusMap(latest.latitude, latest.longitude);
          setSelectedId(latest._id);
        } else {
            console.log("No location data found for this date.");
        }

        // List update karein (Empty array bhi ho sakta hai, jo safe hai)
        setClaim(result.data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const focusMap = (lat, long) => {
    const region = {
      latitude: lat,
      longitude: long,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setSelectedLocation(region);
    mapRef.current?.animateToRegion(region, 800);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dailyClaim();
  }, []);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  /* ---------- Render Item ---------- */
  const renderItem = ({ item }) => {
    const isSelected = item._id === selectedId;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.activeCard]}
        onPress={() => {
          setSelectedId(item._id);
          focusMap(item.latitude, item.longitude);
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.labelText}>Time:</Text>
              <Text style={styles.valueText}>
                {formatFullDateTime(item.deviceTimestamp)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelText}>Name:</Text>
              <Text style={styles.valueText}>
                {item.employee?.name || "Unknown"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.labelText}>Address:</Text>
              <View style={{ flex: 1 }}>
                <AddressText
                  latitude={item.latitude}
                  longitude={item.longitude}
                />
              </View>
            </View>
          </View>

          <View style={styles.statusChip}>
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getAttendanceByDate = async (empId, date) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const res = await fetch(
        `${BaseUrl}/attendance/app/employee/${empId}?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
     
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

      if (result.success) {
        const att = Array.isArray(result.data)
          ? result.data[0]
          : result.data;

        setAttendance(att);
      } else {
        setAttendance(null);
      }
    } catch (err) {
      console.log("Attendance API error:", err);
    }
  };

  useEffect(() => {
    if (employeeId && selectedDate) {
      const date = formatDateForApi(selectedDate);
      getAttendanceByDate(employeeId, date);
    }
  }, [employeeId, selectedDate]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={selectedLocation}
          showsUserLocation
        >
          <Marker coordinate={selectedLocation} />
        </MapView>
      </View>

      {/* LIST */}
      <View style={styles.listSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Location History</Text>

          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Image source={require("../img/bookings.png")} style={{ height: 16, width: 16 }} tintColor={"#2563EB"} />
            <Text style={styles.dateText}>
              {formatDateForApi(selectedDate)}
            </Text>
          </TouchableOpacity>
        </View>
        {attendance?.checkInTime && (
          <View style={styles.attendanceCard}>
            {/* Header */}
            <View style={styles.attHeader}>
              <Text style={styles.attTitle}>Daily Attendance</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {attendance.checkOutTime ? "Completed" : "In Progress"}
                </Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.attRow}>
              <Text style={styles.attLabel}>Check In</Text>
              <Text style={styles.attValue}>
                {formatFullDateTime(attendance.checkInTime)}
              </Text>
            </View>

            <View style={styles.attRow}>
              <Text style={styles.attLabel}>Check Out</Text>
              <Text style={styles.attValue}>
                {attendance.checkOutTime
                  ? formatFullDateTime(attendance.checkOutTime)
                  : "Not Checked Out"}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Bottom stats */}
            <View style={styles.statsRow}>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Distance</Text>
                <Text style={styles.statValue}>
                  {attendance.totalDistance ?? 0} km
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Fare</Text>
                <Text style={styles.statValue}>
                  ₹ {attendance.totalFare ?? 0}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Per Km Fare</Text>
                <Text style={styles.statValue}>
                  ₹ {attendance.perKmFare ?? 0}
                </Text>
              </View>
            </View>
          </View>
        )}




        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <FlatList
            data={claim}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No Data Found</Text>
            }
          />
        )}
      </View>

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

export default DaliyClaim;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  attendanceCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 10,
  },

  attHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  attTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  attRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  attLabel: {
    marginLeft: 8,
    minWidth: 80,
    fontWeight: "600",
    color: "#374151",
  },

  attValue: {
    flex: 1,
    textAlign: "right",
    color: "#111827",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statBox: {
    width: "30%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding:3,
    alignItems: "center",
    justifyContent: "center",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  statValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  mapContainer: {
    height: height * 0.25,
    backgroundColor: "#fff",
  },
  map: { ...StyleSheet.absoluteFillObject },

  listSection: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
    paddingVertical: 5
  },

  title: { fontSize: 18, fontWeight: "700", color: "#111827" },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  dateText: {
    marginLeft: 6,
    color: "#2563EB",
    fontWeight: "600",
  },

  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  activeCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 2,
  },

  row: { flexDirection: "row", marginBottom: 6 },
  labelText: { fontWeight: "700", minWidth: 70, color: "#374151" },
  valueText: { flex: 1, color: "#374151" },

  statusChip: {
    backgroundColor: "#E7FBEA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: { color: "#16A34A", fontWeight: "700", fontSize: 12 },

  empty: { textAlign: "center", marginTop: 30, color: "#9CA3AF" },
});
