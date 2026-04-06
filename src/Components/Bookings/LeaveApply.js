import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Image,
  ToastAndroid,
  ActivityIndicator,
  RefreshControl
} from "react-native";



import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BaseUrl } from "../../url/env";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// ---------------- STATUS TAG ----------------
const StatusTag = ({ status }) => {
  let style = styles.tagPending;
  let text = status ? status.toUpperCase() : "UNKNOWN";

  if (status === "Approved") style = styles.tagApproved;
  if (status === "Rejected") style = styles.tagRejected;

  return (
    <View style={[styles.tag, style]}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
};

// ---------------- SUMMARY CARD ----------------
const SummaryCard = ({ title, count, color }) => (
  <View style={[styles.summaryCard, { borderColor: color }]}>
    <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
      <Image
        source={require("../img/text.png")}
        style={{ height: 15, width: 15 }}
        tintColor={color}
      />
    </View>
    <View style={{ alignItems: "center" }}>
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
    </View>
  </View>
);

// ---------------- LEAVE CARD ----------------
// ---------------- LEAVE CARD (UPDATED) ----------------
const LeaveCard = ({ item }) => {

  // Date Formatting Helper (e.g., 05 Dec 2025)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.card}>
      {/* --- Top Row: Type & Status --- */}
      <View style={styles.cardTopRow}>
        <Text style={styles.leaveType}>{item.type || "Leave"}</Text>
        <StatusTag status={item.status} />
      </View>

      {/* --- Date Duration --- */}
      <View style={styles.iconRow}>
        <Image source={require("../img/year.png")} style={{ height: 18, width: 18 }} tintColor="#6B7280" />
        <Text style={styles.dateText}>
          {formatDate(item.startDate)}  —  {formatDate(item.endDate)}
        </Text>
      </View>

      {/* --- Applied Date --- */}
      <View style={styles.iconRow}>
        <Image source={require("../img/year.png")} style={{ height: 18, width: 18 }} tintColor="#6B7280" />
        <Text style={styles.subDateText}>
          Applied on: {formatDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* --- User Reason --- */}
      <View style={styles.textSection}>
        <Text style={styles.label}>My Reason:</Text>
        <Text style={styles.valueText}>{item.reason}</Text>
      </View>

      {/* --- Admin Response (Only show if exists) --- */}
      {item.response ? (
        <View style={[styles.textSection, styles.adminResponseBox]}>
          <Text style={[styles.label, { color: '#B91C1C' }]}>
            Admin Response:
          </Text>
          <Text style={[styles.valueText, { color: '#7F1D1D', fontWeight: '600' }]}>
            {item.response}
          </Text>
        </View>
      ) : null}

    </View>
  );
};

// ==========================================================
//                    MAIN SCREEN START
// ==========================================================

const LeaveManagementScreen = () => {
  // Data States
  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Counts State
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Filter State
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal & Form States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);
const navigation = useNavigation();
  // ---------------- FETCH DATA API (FIXED LOGIC) ----------------
  // ---------------- FETCH DATA API (Updated for your Response) ----------------
  // ---------------- FETCH DATA API (Final Fix) ----------------
  const fetchLeaves = async (statusArg = "All") => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");

      // 1. URL Setup
      let url = `${BaseUrl}/leaves`;
      if (statusArg !== "All") {
        url = `${BaseUrl}/leaves?status=${statusArg}`;
      }

      console.log("🚀 FETCHING:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseJson = await res.json();
      console.log("🔥 API RESPONSE:", responseJson);

      if (!responseJson.success && responseJson?.error?.statusCode === 403) {
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

      // 2. Data Check Logic (According to your structure)
      // Structure: { success: true, data: { leaves: [...] } }
      if (responseJson?.success && responseJson?.data?.leaves) {

        const list = responseJson.data.leaves;
        // ⭐ Correct Path: data.data.leaves
        setLeavesList(list);
        console.log("✅ LEAVES LIST:", list);

        // 3. Counts Update (Sirf 'All' pe)
        if (statusArg === "All") {
          const p = list.filter((r) => r?.status === "Pending").length;
          const a = list.filter((r) => r?.status === "Approved").length;
          const r = list.filter((r) => r?.status === "Rejected").length;
          setCounts({ pending: p, approved: a, rejected: r });
        }

      } else {
        setLeavesList([]);
        ToastAndroid.show(responseJson?.message || "No data found", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log("FETCH ERROR:", error);
      setLeavesList([]);
      ToastAndroid.show("Network error!", ToastAndroid.SHORT);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchLeaves("All");
  }, []);

  // ---------------- HANDLERS ----------------

  const handleFilterClick = (status) => {
    setFilterStatus(status);
    // Yaha se status pass hoga fetchLeaves ko
    fetchLeaves(status);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaves(filterStatus);
  }, [filterStatus]);

  // Date Pickers
  const handleStartDate = (event, selectedDate) => {
    setOpenStartPicker(false);
    if (selectedDate) setStartDate(selectedDate.toISOString().split("T")[0]);
  };

  const handleEndDate = (event, selectedDate) => {
    setOpenEndPicker(false);
    if (selectedDate) setEndDate(selectedDate.toISOString().split("T")[0]);
  };

  // Add Leave API
  const handleAddLeave = async () => {
    if (!leaveType || !reason || !startDate || !endDate) {
      return ToastAndroid.show("Please fill all fields", ToastAndroid.SHORT);
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${BaseUrl}/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: leaveType, reason, startDate, endDate }),
      });

      const data = await res.json();

      if (!data.success && data?.error?.statusCode === 403) {
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

      if (data?.success) {
        ToastAndroid.show("Leave applied!", ToastAndroid.SHORT);
        setIsModalVisible(false);
        setLeaveType(""); setReason(""); setStartDate(""); setEndDate("");

        // Reset filter to All to see the new entry
        setFilterStatus("All");
        fetchLeaves("All");
      } else {
        ToastAndroid.show(data?.message || "Error", ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show("Network error!", ToastAndroid.SHORT);
    }
  };

  // ---------------- HEADER COMPONENT ----------------


  // ===================== RENDER ======================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1FA2FF" />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Leave Management</Text>
          <Text style={styles.subtitle}>Track your leave requests</Text>
        </View>

        <View style={styles.summaryContainer}>
          <SummaryCard title="Pending" count={counts.pending} color="#F97316" />
          <SummaryCard title="Approved" count={counts.approved} color="#10B981" />
          <SummaryCard title="Rejected" count={counts.rejected} color="#DC2626" />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterBtn,
                filterStatus === status && styles.filterBtnActive,
              ]}
              onPress={() => handleFilterClick(status)}
            >
              <Text style={[
                styles.filterBtnText,
                filterStatus === status && styles.filterBtnTextActive,
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {filterStatus === "All" ? "All Requests" : `${filterStatus} Requests`}
          </Text>
          <LinearGradient colors={['#1FA2FF', '#12D8FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8 }}
          >
            <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
              <Image source={require("../img/plus.png")} style={{ height: 16, width: 16, tintColor: '#FFFFFF' }} />
              <Text style={styles.addButtonText}>Add Leave</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={leavesList}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={({ item }) => <LeaveCard item={item} />}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
              No {filterStatus !== "All" ? filterStatus : ""} Data Found
            </Text>
          }
        />
      )}

      {/* MODAL */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Apply Leave</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Image source={require("../img/close.png")} style={{ height: 25, width: 25 }} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <TextInput style={styles.input} placeholderTextColor={"gray"} placeholder="Leave Type" value={leaveType} onChangeText={setLeaveType} />

                <TouchableOpacity style={styles.input} onPress={() => setOpenStartPicker(true)}>
                  <Text style={{ color: startDate ? '#000' : '#999' }}>{startDate || "Select Start Date"}</Text>
                </TouchableOpacity>
                {openStartPicker && <DateTimePicker value={new Date()} mode="date" onChange={handleStartDate} />}

                <TouchableOpacity style={styles.input} onPress={() => setOpenEndPicker(true)}>
                  <Text style={{ color: endDate ? '#000' : '#999' }}>{endDate || "Select End Date"}</Text>
                </TouchableOpacity>
                {openEndPicker && <DateTimePicker value={new Date()} mode="date" onChange={handleEndDate} />}

                <TextInput style={[styles.input, styles.multilineInput]} placeholder="Reason" multiline value={reason} onChangeText={setReason} placeholderTextColor={"gray"} />

                <TouchableOpacity style={styles.submitButton} onPress={handleAddLeave}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LeaveManagementScreen;

// Styles same as before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 24, fontWeight: "700", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#6B7280" },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 50 },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20 },
  summaryCard: { width: "32%", padding: 10, backgroundColor: "#fff", borderRadius: 12, alignItems: "center", justifyContent: 'center', borderWidth: 1, elevation: 2 },
  summaryIcon: { padding: 8, borderRadius: 50, marginBottom: 5 },
  summaryCount: { fontSize: 18, fontWeight: "800", color: "#111827" },
  summaryTitle: { fontSize: 11, color: "#6B7280", fontWeight: '500' },
  filterRow: { flexDirection: "row", justifyContent: "flex-start", marginBottom: 15, gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#E5E7EB" },
  filterBtnActive: { backgroundColor: "#3B82F6" },
  filterBtnText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  filterBtnTextActive: { color: "#fff", fontWeight: "700" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, alignItems: 'center', marginBottom: 5 },
  listTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
  addButton: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  addButtonText: { color: "#fff", marginLeft: 4, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  leaveType: { fontSize: 17, fontWeight: "700", color: "#111827" },

  iconRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dateText: { marginLeft: 8, fontSize: 14, fontWeight: "600", color: "#374151" },
  subDateText: { marginLeft: 8, fontSize: 12, color: "#6B7280" },

  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },

  textSection: { marginBottom: 8 },
  label: { fontSize: 12, color: "#9CA3AF", marginBottom: 2, fontWeight: "600" },
  valueText: { fontSize: 14, color: "#1F2937", lineHeight: 20 },

  // Admin Response ko highlight karne ke liye
  adminResponseBox: {
    marginTop: 5,
    backgroundColor: "#FEF2F2", // Light Red background
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444"
  },

  // Tags (Same as before)
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  tagText: { color: "#fff", fontWeight: "700", fontSize: 10 },
  tagPending: { backgroundColor: "#F97316" },
  tagApproved: { backgroundColor: "#10B981" },
  tagRejected: { backgroundColor: "#DC2626" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  input: { backgroundColor: "#F3F4F6", padding: 14, borderRadius: 12, marginBottom: 15, color: '#1F2937' },
  multilineInput: { height: 100, textAlignVertical: "top" },
  submitButton: { backgroundColor: "#3B82F6", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10, marginBottom: 20 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});