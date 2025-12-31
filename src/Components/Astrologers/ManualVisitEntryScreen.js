import React, { useState } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BaseUrl } from "../../url/env";

const ManualVisitEntryScreen = () => {
  const [visitMaqsad, setVisitMaqsad] = useState("Payment Collection");
  const [clientName, setClientName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState(null);

  const [manualDate, setManualDate] = useState(""); 
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // Format Date to DD-MM-YYYY
  const formatDate = (date) => {
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = formatDate(selectedDate);
      setManualDate(formatted);
    }
  };

  const handleSaveVisit = async () => {
    if (!clientName.trim()) {
      return ToastAndroid.show("Please enter client name", ToastAndroid.SHORT);
    }

    if (!manualDate.trim()) {
      return ToastAndroid.show("Please select a date", ToastAndroid.SHORT);
    }

    if (visitMaqsad !== "Other") {
      if (!paymentAmount || !paymentMode) {
        return ToastAndroid.show("Amount and payment mode are required", ToastAndroid.SHORT);
      }

      if (Number(paymentAmount) <= 0) {
        return ToastAndroid.show("Amount must be greater than 0", ToastAndroid.SHORT);
      }
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");

      const purposeValue =
        visitMaqsad === "Payment Collection"
          ? "PAYMENT"
          : visitMaqsad === "Order Visit"
          ? "ORDER"
          : "OTHER";

      const statusValue = purposeValue === "PAYMENT" ? "ACTIVE" : "INACTIVE";

      const bodyData = {
        purpose: purposeValue,
        clientName,
        date: manualDate,
        amount: visitMaqsad !== "Other" ? Number(paymentAmount) : null,
        paymentMode: visitMaqsad !== "Other" ? paymentMode : null,
        status: statusValue,
      };

      const res = await fetch(`${BaseUrl}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      setLoading(false);

      if (data?.success === true) {
        ToastAndroid.show("Visit saved successfully!", ToastAndroid.SHORT);

        setClientName("");
        setPaymentAmount("");
        setPaymentMode(null);
        setManualDate("");
        setVisitMaqsad("Payment Collection");
      } else {
        ToastAndroid.show(data?.message || "Something went wrong!", ToastAndroid.SHORT);
      }
    } catch (error) {
      setLoading(false);
      ToastAndroid.show("Network error!", ToastAndroid.SHORT);
    }
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
  >
    <ScrollView
      style={styles.formContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <Text style={styles.label}>Visit Type</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={visitMaqsad} onValueChange={(v) => setVisitMaqsad(v)}>
          <Picker.Item label="Payment Collection" value="Payment Collection" />
          <Picker.Item label="Order Visit" value="Order Visit" />
        </Picker>
      </View>

      <Text style={styles.label}>Client Name</Text>
      <TextInput
        style={styles.input}
        placeholder="rohit sharma"
        placeholderTextColor="#9CA3AF"
        value={clientName}
        onChangeText={setClientName}
      />

      <Text style={styles.label}>Select Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        <Text style={{ color: manualDate ? "#111" : "#9CA3AF" }}>
          {manualDate || "Select Date"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="calendar"
          onChange={onDateChange}
        />
      )}

      {visitMaqsad !== "Other" && (
        <>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000"
            keyboardType="numeric"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Payment Mode</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter payment mode"
            value={paymentMode || ""}
            onChangeText={setPaymentMode}
             placeholderTextColor="#9CA3AF"
          />
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

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
);

};

export default ManualVisitEntryScreen;


// ------- STYLES -----------

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    margin: 20,
    marginBottom:20
  },
  label: {
    marginTop: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 25,
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
});
