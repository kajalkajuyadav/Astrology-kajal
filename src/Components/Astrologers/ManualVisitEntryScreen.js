import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  KeyboardAvoidingView,
  Image,
  SafeAreaView
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchCamera } from "react-native-image-picker";
import Geolocation from "react-native-geolocation-service";
import { BaseUrl } from "../../url/env"; 

const ManualVisitEntryScreen = () => {
  const [visitType, setVisitType] = useState("Payment Collection");
  const [dealerName, setDealerName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [description, setDescription] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = new Date();
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    setTodayDate(`${day}-${month}-${year}`);
  }, []);

  /* CAMERA */
  const openCamera = () => {
    launchCamera(
      { mediaType: "photo", cameraType: "back", quality: 0.7, saveToPhotos: false },
      (res) => {
        if (res.didCancel) return;
        if (res.errorCode) {
          ToastAndroid.show("Camera error", ToastAndroid.SHORT);
          return;
        }
        setImage(res.assets[0]);
      }
    );
  };

  /* GET LOCATION */
  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      console.log("🔍 Getting location...");
      Geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Location found:", position);
          const { latitude, longitude } = position.coords;
          const deviceTimestamp = new Date().toISOString();
          console.log("📍 Lat:", latitude, "Lng:", longitude, "Time:", deviceTimestamp);
          resolve({ latitude, longitude, deviceTimestamp });
        },
        (error) => {
          console.log("❌ Location error:", error);
          ToastAndroid.show("Location permission denied", ToastAndroid.SHORT);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  /* SAVE */
  const handleSaveVisit = async () => {
    if (!dealerName.trim()) {
  return ToastAndroid.show("Enter dealer name", ToastAndroid.SHORT);
}

if (!image) {
  return ToastAndroid.show("Capture photo", ToastAndroid.SHORT);
}

    setLoading(true);

    try {
      console.log("💾 Starting save visit...");
      // Get location
      const location = await getLocation();
      const { latitude, longitude, deviceTimestamp } = location;
      console.log("� Location data:", { latitude, longitude, deviceTimestamp });

      const token = await AsyncStorage.getItem("authToken");
      const purpose = visitType === "Payment Collection" ? "PAYMENT" : "ORDER";
      
      console.log("📝 Building FormData:");
      console.log("  - purpose:", purpose);
      console.log("  - dealerName:", dealerName);
      console.log("  - amount:", amount || "");
      console.log("  - paymentMode:", paymentMode || "");
      console.log("  - description:", description || "");
      console.log("  - latitude:", String(latitude));
      console.log("  - longitude:", String(longitude));
      console.log("  - deviceTimestamp:", String(deviceTimestamp));
      
      const formData = new FormData();
      formData.append("purpose", purpose);
      formData.append("dealerName", dealerName);
      formData.append("amount", amount || "");
      formData.append("paymentMode", paymentMode || "");
      formData.append("description", description || "");
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("deviceTimestamp", String(deviceTimestamp));

      const imageData = {
        uri: Platform.OS === "android" ? image.uri : image.uri.replace("file://", ""),
        name: image.fileName || "visit.jpg",
        type: image.type || "image/jpeg",
      };

      formData.append("asset", imageData);
      console.log("🖼️  Image appended:", imageData.name);

      console.log("🌐 Sending POST request to:", `${BaseUrl}/visits`);
      console.log("🔑 Auth token present:", !!token);
      
      const res = await fetch(`${BaseUrl}/visits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      console.log("📊 Response status:", res.status);
      const data = await res.json();
      console.log("📨 API Response:", JSON.stringify(data, null, 2));
      setLoading(false);

      if (data?.success) {
        console.log("✅ Visit saved successfully!");
        ToastAndroid.show("Visit saved", ToastAndroid.SHORT);
        setDealerName("");
        setAmount("");
        setPaymentMode("");
        setDescription("");
        setImage(null);
      } else {
        console.log("❌ Visit save failed:", data?.message);
        ToastAndroid.show(data?.message || "Error", ToastAndroid.SHORT);
      }
    } catch (e) {
      console.log("⚠️ Catch error:", e);
      setLoading(false);
      ToastAndroid.show("Network error", ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {/* FIX 1: behavior "padding" या "height" दोनों try करें। Android पर कभी-कभी "height" बेहतर काम करता है।
         FIX 2: keyboardVerticalOffset दिया है ताकि कीबोर्ड खुलने पर व्यू थोड़ा और ऊपर खिसके।
      */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 70}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          // FIX 3: Padding Bottom बढ़ा दी है ताकि आखिरी एलिमेंट के नीचे जगह रहे और वो कीबोर्ड के पीछे ना छिपे
          contentContainerStyle={{ paddingBottom: 150, padding: 20 }} 
          keyboardShouldPersistTaps="handled" // ये भी जरूरी है ताकि कीबोर्ड खुला हो तो बटन दब सके
        >
          <View style={styles.cardContainer}>
            
            <Text style={styles.label}>Visit Type</Text>
            <View style={styles.pickerBox}>
              <Picker 
                selectedValue={visitType} 
                onValueChange={setVisitType}
                style={{ color: "#000" }}
              >
                <Picker.Item label="Payment Collection" value="Payment Collection" />
                <Picker.Item label="Order Visit" value="Order Visit" />
              </Picker>
            </View>

            <Text style={styles.label}>Dealer Name</Text>
            <TextInput 
              style={styles.input} 
              value={dealerName} 
              onChangeText={setDealerName}
              placeholder="Enter Dealer Name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Today Date</Text>
            <View style={[styles.input, { justifyContent: 'center', backgroundColor: '#E5E7EB' }]}>
              <Text style={{ color: "#374151" }}>{todayDate}</Text>
            </View>

            <Text style={styles.label}>Camera Picture</Text>
            <TouchableOpacity onPress={openCamera} style={styles.cameraBtn}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>📷 Open Camera</Text>
            </TouchableOpacity>

            {image && (
              <Image source={{ uri: image.uri }} style={styles.preview} />
            )}

            <Text style={styles.label}>Assessed Amount (Optional)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={amount} 
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} // Multiline ke liye fix
              value={description} 
              onChangeText={setDescription}
              placeholder="Enter details..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={4}
            />

            <Text style={styles.label}>Payment Mode (Optional)</Text>
            <TextInput 
              style={styles.input}  
              value={paymentMode} 
              onChangeText={setPaymentMode}
              placeholder="Cash / UPI / Cheque"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveVisit}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Visit</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ManualVisitEntryScreen;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
  },
  label: {
    marginTop: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    fontSize: 14
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#000",
    fontSize: 16
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    overflow: 'hidden'
  },
  cameraBtn: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    width: 140,
    alignItems: "center"
  },
  preview: {
    width: "100%",
    height: 100,
    marginTop: 10,
    borderRadius: 8,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "#ddd"
  },
  saveButton: {
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
    elevation: 2
  },
  saveText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});