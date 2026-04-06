import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  ToastAndroid // 1. Alert hataya, ToastAndroid lagaya
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BaseUrl, ImgUrl } from "../../url/env";
import BlobUtil from "react-native-blob-util";

const SalarySelf = () => {
  const navigation = useNavigation();

  const [slips, setSlips] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  /* ---------------- CONSTANTS ---------------- */
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  /* ---------------- HELPERS ---------------- */
  const formatDate = (dateObj) => {
    const d = new Date(dateObj);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR'
    });
  };

  // 2. Toast Helper Function
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  /* ---------------- API CALL ---------------- */
  const fetchSalarySlip = async (pageNo = 1, isRefresh = false, dateParam = selectedDate) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      
      const url = `${BaseUrl}/slips/app/employee?page=${pageNo}&limit=10` + (dateParam ? `&date=${dateParam}` : "");
      console.log("🔗 Fetching Salary Slips from:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

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
      
      if (result?.success) {
        const newSlips = result?.data?.slips ?? [];
        setTotalPages(result?.data?.totalPages ?? 1);
        setPage(pageNo);
        setSlips(prev => isRefresh || pageNo === 1 ? newSlips : [...prev, ...newSlips]);
        
        // Agar filter lagaya aur data nahi mila
        if (dateParam && newSlips.length === 0 && pageNo === 1) {
            showToast("No slips found for this date");
        }
      }
    } catch (err) {
      console.log("❌ API Error:", err);
      showToast("Something went wrong!");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalarySlip(1);
  }, []);

  const onRefresh = useCallback(() => {
    fetchSalarySlip(1, true);
  }, [selectedDate]);

  const loadMore = () => {
    if (!loading && page < totalPages) {
      fetchSalarySlip(page + 1);
    }
  };

  /* ---------------- DATE FILTER LOGIC ---------------- */
  const onSelectDate = (event, value) => {
    setShowPicker(false);
    if (value) {
      const formatted = formatDate(value);
      setSelectedDate(formatted);
      // Filter lagate hi data fetch karein
      fetchSalarySlip(1, true, formatted);
      showToast(`Filter Applied: ${formatted}`);
    }
  };

  // 3. Clear Filter Function
  const clearFilter = () => {
    setSelectedDate(""); // State clear
    fetchSalarySlip(1, true, ""); // API call bina date ke
    showToast("Filter Removed");
  };

  /* ---------------- OPEN & DOWNLOAD PDF ---------------- */
  const openPdf = (file) => {
    const fileUrl = file?.startsWith("http") ? file : `${ImgUrl}/${file}`;
    Linking.openURL(fileUrl).catch(() => showToast("Cannot open link"));
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== "android") return true;
    if (Platform.Version >= 29) return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  const downloadPdf = async (file, month, year) => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        showToast("Storage permission denied");
        return;
    }

    try {
      const fileUrl = file?.startsWith("http") ? file : `${ImgUrl}/${file}`;
      const fileName = `SalarySlip_${monthNames[month - 1]}_${year}.pdf`;
      const downloadDest = `/storage/emulated/0/Download/${fileName}`;

      showToast("Downloading started..."); // Toast instead of Alert

      await BlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadDest,
          description: "Salary Slip Download",
          mime: "application/pdf",
          mediaScannable: true,
          title: fileName,
        },
      }).fetch("GET", fileUrl);
      
      showToast("Saved to Downloads folder"); // Toast on success
    } catch (error) {
      showToast("Download failed"); // Toast on error
    }
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = (item, index) => {
    return (
      <View key={index} style={styles.payslipCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.companyName}>CANX INTERNATIONAL</Text>
            <Text style={styles.companyLoc}>Jaipur, Rajasthan, India</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerLabel}>Payslip</Text>
            <Text style={styles.headerDate}>{monthNames[item.month - 1]} {item.year}</Text>
          </View>
        </View>

        <View style={styles.profileSection}>
            <View style={styles.profileRow}>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{item.employee?.name || "N/A"}</Text>
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Working Days:</Text>
                    <Text style={styles.value}>{item.workingDays} Days</Text>
                </View>
            </View>
            <View style={[styles.profileRow, {marginTop: 10}]}>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>{item.employee?.phone || "--"}</Text>
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.value, {color: item.status === 'Generated' ? '#16a34a' : '#ea580c'}]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>

        <View style={styles.financialTable}>
            <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderTitle, {flex: 1}]}>Earnings & Claims</Text>
                <Text style={[styles.tableHeaderTitle, {flex: 1, paddingLeft: 10}]}>Deductions</Text>
            </View>

            <View style={styles.tableBodyRow}>
                <View style={styles.columnLeft}>
                    <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Basic Salary</Text>
                        <Text style={styles.financeValue}>{formatCurrency(item.grossSalary)}</Text>
                    </View>
                    <View style={styles.divider} />
                    
                    <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Travel Allw.</Text>
                        <Text style={styles.financeValue}>{item.travelAllowance > 0 ? formatCurrency(item.travelAllowance) : "0"}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Claims</Text>
                        <Text style={styles.financeValue}>{item.claimsAmount > 0 ? formatCurrency(item.claimsAmount) : "0"}</Text>
                    </View>
                    <View style={styles.divider} />

                     <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Bonus</Text>
                        <Text style={styles.financeValue}>{item.bonus > 0 ? formatCurrency(item.bonus) : "0"}</Text>
                    </View>
                </View>

                <View style={styles.columnRight}>
                    <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Deductions</Text>
                        <Text style={[styles.financeValue, {color:'#dc2626'}]}>{item.deductions > 0 ? formatCurrency(item.deductions) : "0"}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.totalSection}>
            <Text style={styles.netLabel}>Net Salary Payable:</Text>
            <Text style={styles.netValue}>{formatCurrency(item.netSalary)}</Text>
        </View>

        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => openPdf(item.slipFileUrl)}>
                <Text style={styles.outlineBtnText}>View PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fillBtn} onPress={() => downloadPdf(item.slipFileUrl, item.month, item.year)}>
                <Text style={styles.fillBtnText}>Download</Text>
            </TouchableOpacity>
        </View>

      </View>
    );
  };

  /* ---------------- MAIN RENDER ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />
      {/* HEADER */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:8}}>
           <Image source={require("../img/arrowback.png")} style={{width: 22, height: 22}} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Salary Slips</Text>
        
        {/* 4. Filter Button Toggle Logic */}
        {selectedDate ? (
            // Agar Date select hai toh RED button (Clear karne ke liye)
            <TouchableOpacity onPress={clearFilter} style={[styles.dateFilter, {backgroundColor: '#ef4444'}]}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>✕ {selectedDate}</Text>
            </TouchableOpacity>
        ) : (
            // Agar Date nahi hai toh BLUE button (Select karne ke liye)
            <TouchableOpacity onPress={() => setShowPicker(true)}>
                <Image source={require("../img/year.png")} style={{width:26, height:26, tintColor:'#0a0909ff',}}  />
            </TouchableOpacity>
        )}
      </View>

      {showPicker && (
        <DateTimePicker value={new Date()} mode="date" onChange={onSelectDate} />
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScrollEndDrag={loadMore}
      >
        {slips.length === 0 && !loading && (
             <View style={{alignItems:'center', marginTop: 50}}>
                 <Text style={{fontSize: 30}}>📂</Text>
                 <Text style={{textAlign:'center', marginTop: 10, color:'#94a3b8'}}>
                    {selectedDate ? `No payslips found for ${selectedDate}` : "No payslips found."}
                 </Text>
             </View>
        )}
        {slips.map((item, index) => renderItem(item, index))}
        {loading && <ActivityIndicator size="large" color="#1e293b" style={{marginTop: 20}} />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalarySelf;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" ,},

  // Nav Header
  navHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, backgroundColor: '#fff', paddingVertical: 10,
  },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  dateFilter: { backgroundColor: '#1FA2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },

  // Card Design
  payslipCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 20,
      elevation: 1, // Shadow increase kiya better look ke liye
      shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4,
      overflow: 'hidden',
      borderWidth: 1, borderColor: '#f1f5f9'
  },

  // 1. Dark Header
  cardHeader: {
      backgroundColor: '#1FA2FF', 
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  companyName: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  companyLoc: { color: '#e0f2fe', fontSize: 10, marginTop: 2 },
  headerLabel: { color: '#cbd5e1', fontSize: 12, textAlign: 'right' },
  headerDate: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  // 2. Profile Grid
  profileSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#0f172a', fontWeight: '700', marginTop: 2 },

  // 3. Financial Table
  financialTable: { padding: 0 },
  tableHeaderRow: {
      flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 10, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
  },
  tableHeaderTitle: { fontSize: 12, color: '#475569', fontWeight: '800' },
  
  tableBodyRow: { flexDirection: 'row' },
  columnLeft: { flex: 1, borderRightWidth: 1, borderRightColor: '#f1f5f9', padding: 16 },
  columnRight: { flex: 1, padding: 16 },

  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  financeLabel: { fontSize: 12, color: '#64748b' },
  financeValue: { fontSize: 12, color: '#0f172a', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 8 },

  // 4. Total Net
  totalSection: {
      backgroundColor: '#f0f9ff', padding: 16, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0f2fe'
  },
  netLabel: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  netValue: { fontSize: 18, fontWeight: '900', color: '#0284c7' },

  // 5. Actions
  actionRow: { flexDirection: 'row', padding: 16, gap: 10 },
  outlineBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#1FA2FF', borderRadius: 8, alignItems: 'center' },
  outlineBtnText: { color: '#1FA2FF', fontWeight: '700' },
  fillBtn: { flex: 1, padding: 12, backgroundColor: '#1FA2FF', borderRadius: 8, alignItems: 'center' },
  fillBtnText: { color: '#fff', fontWeight: '700' }
});