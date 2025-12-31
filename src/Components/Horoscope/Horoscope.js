import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  ToastAndroid,
  StatusBar,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";
import { BaseUrl, ImgUrl } from "../../url/env";
import LinearGradient from "react-native-linear-gradient";

const Claims = () => {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState(null);

  const [claims, setClaims] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ⭐ FILTER STATE
  const [filterStatus, setFilterStatus] = useState("ALL");

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setDescription("");
    setBill(null);
  };

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      console.log("TOAST:", msg);
    }
  };

  const handlePickBill = () => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.8 },
      (response) => {
        if (response.didCancel) return;
        const asset = response.assets?.[0];
        if (asset) setBill(asset);
      }
    );
  };

  // ========= GET CLAIMS ===========
  const getClaims = async (pageNumber = 1, refreshingMode = false) => {
    try {
      if (!refreshingMode) setLoading(true);

      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(`${BaseUrl}/claims?page=${pageNumber}`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const data = await response.json();

      if (data.success) {
        if (refreshingMode) {
          setClaims(data.data.claims);
        } else {
          setClaims((prev) => [...prev, ...data.data.claims]);
        }

        setHasMore(pageNumber < data.data.totalPages);
        setPage(pageNumber);
      }
    } catch (err) {
      console.log("GET Claims Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getClaims();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setClaims([]);
    getClaims(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      getClaims(page + 1);
    }
  };

  // ========= SUBMIT CLAIM ===========
  const handleSubmit = async () => {
    if (!title.trim() || !amount.trim()) {
      showToast("Title and amount are required");
      return;
    }

    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("authToken");

      console.log("🔑 TOKEN:", token);
      console.log("📌 TITLE:", title);
      console.log("💰 AMOUNT:", amount);
      console.log("📝 DESCRIPTION:", description);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("amount", amount);
      formData.append("description", description);

      if (bill) {
        console.log("🖼️ BILL FILE:", bill);
        formData.append("bill", {
          uri: bill.uri,
          type: bill.type || "image/jpeg",
          name: bill.fileName || "bill.jpg",
        });
      } else {
        console.log("⚠️ NO BILL IMAGE SELECTED");
      }

      const response = await fetch(`${BaseUrl}/claims`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const result = await response.json();
      console.log("✅ API RESPONSE:", result);

      // ❌ ERROR HANDLING (MOST IMPORTANT PART)
      if (!response.ok || result?.success === false) {
        const errorMsg =
          result?.error?.explanation ||
          result?.message ||
          "Something went wrong";

        console.log("❌ BACKEND ERROR:", errorMsg);
        showToast(errorMsg);
        return;
      }

      // ✅ SUCCESS FLOW
      resetForm();
      setSheetVisible(false);
      setClaims([]);
      getClaims(1, true);
      showToast("Claim submitted successfully");

    } catch (err) {
      console.log("🔥 Submit error:", err);
      showToast("Network error. Please try again");
    } finally {
      setSubmitting(false);
    }
  };



  // ⭐ FILTER LOGIC APPLIED
  const filteredClaims = claims.filter((item) =>
    filterStatus === "ALL" ? true : item.status === filterStatus
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1FA2FF" }}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>My Claims</Text>
          <Text style={styles.subtitle}>Manage your expense claims.</Text>
        </View>

        <LinearGradient colors={['#1FA2FF', '#12D8FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 8 }}>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setSheetVisible(true)}
          >
            <Image source={require("../img/plus.png")} style={styles.addIcon} tintColor={"#fff"} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* FILTER BUTTONS */}
      <View style={{ marginTop: 15, marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.filterRow}>
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterBtn, filterStatus === s && styles.filterBtnActive]}
                onPress={() => setFilterStatus(s)}
              >
                <Text
                  style={[styles.filterText, filterStatus === s && styles.filterTextActive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>



      {/* Loading Indicator */}
      {loading && claims.length === 0 ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredClaims}
          keyExtractor={(item, index) => item._id + "_" + index}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#6B7280" }}>
              No claims found.
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.amount}>₹ {item.amount}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.givenBy}>Given by: {item.employee?.name}</Text>

              {item.bill ? (
                <TouchableOpacity
                  onPress={() => {
                    setPreviewImage(`${ImgUrl}/${item.bill}`);
                    setPreviewVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: `${ImgUrl}/${item.bill}` }}
                    style={styles.billImage}
                  />
                </TouchableOpacity>
              ) : (
                <Text style={styles.noBill}>No Bill Attached</Text>
              )}

              <View style={styles.responseBox}>
                {item.response ? (
                  <>
                    <Text style={styles.responseTitle}>Response</Text>
                    <Text style={styles.responseMessage}>{item.response}</Text>
                    {item.response.by && (
                      <Text style={styles.responseBy}>By: {item.response.by}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noResponse}>Waiting for response…</Text>
                )}
              </View>

              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}

      {/* Add Claim Modal */}
      <Modal visible={sheetVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.backdrop} />
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSheetVisible(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sheetTitle}>New Expense Claim</Text>

              <Text style={styles.label}>Reason / Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Travel Expense, Stationeries"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

              {bill ? (
                <View style={{ alignItems: "center", marginTop: 10 }}>
                  <Image source={{ uri: bill.uri }} style={styles.billImage} />
                  <TouchableOpacity onPress={() => setBill(null)}>
                    <Text style={styles.removeBill}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.billButton}
                  onPress={handlePickBill}
                >
                  <Text style={styles.billButtonText}>Attach Bill</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Claim</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* IMAGE PREVIEW MODAL */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPreviewVisible(false)}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>

          <Image
            source={{ uri: previewImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

export default Claims;


// ====================== STYLES =========================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" ,paddingTop:10},
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#6B7280" },

  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addIcon: { width: 20, height: 20, tintColor: "#fff", marginRight: 6 },
  addButtonText: { color: "#fff", fontWeight: "600" },

  /* ⭐ FILTER BUTTONS */
  filterRow: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 10,
    gap: 10,
    flex: 1,
  },


  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#E5E7EB" },

  filterBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    elevation: 2,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  amount: { fontSize: 22, fontWeight: "700", color: "#2563EB", marginTop: 10 },
  desc: { color: "#6B7280", marginTop: 8 },
  givenBy: { color: "#374151", marginTop: 8, fontSize: 14 },

  billImage: {
    width: 90,
    height: 90,
    marginTop: 10,
    borderRadius: 8,
    borderColor: "#2563EB",
    borderWidth: 1,
  },

  noBill: { color: "#EF4444", fontWeight: "600", marginTop: 10 },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontWeight: "700" },

  status_PENDING: { backgroundColor: "#F59E0B" },
  status_APPROVED: { backgroundColor: "#10B981" },
  status_REJECTED: { backgroundColor: "#EF4444" },

  responseBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  responseTitle: { fontWeight: "700", marginBottom: 4 },
  responseMessage: { color: "#374151" },
  noResponse: { color: "#9CA3AF" },

  date: { marginTop: 10, color: "#9CA3AF", fontSize: 12 },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetContent: { paddingBottom: 30 },
  sheetTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  billButton: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
  },
  billButtonText: { color: "#2563EB", fontWeight: "700" },
  removeBill: { color: "red", marginTop: 10, fontWeight: "600" },

  submitButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },

  fullScreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: { width: "90%", height: "80%" },

  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
  },
  closeText: { fontSize: 16, fontWeight: "700" },

  modalCloseBtn: {
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 10,
    backgroundColor: "#E5E7EB",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCloseText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginTop: -2,
  },
});
