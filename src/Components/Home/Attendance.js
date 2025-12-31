import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl,
  Image, 
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BaseUrl } from '../../url/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AttendanceReport = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    leaves: 0,
    holidays: 0
  });

  const [logs, setLogs] = useState([]);

  // --- Logic: Check if Next Month should be disabled ---
  const isNextDisabled = () => {
    const today = new Date();
    // Agar Current View ka Month aur Year aaj ke Month aur Year ke barabar hai
    return (
      currentDate.getMonth() === today.getMonth() && 
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const fetchAttendanceData = async (date) => {
    if (!refreshing) setLoading(true);

    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const API_URL = `${BaseUrl}/attendance/monthly?year=${year}&month=${month}`;

    try {
      const token = await AsyncStorage.getItem('authToken');
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };

      const response = await fetch(API_URL, requestOptions);
      const result = await response.json();

      console.log("Attendance Data:", result);

      if (result.success === true) {
        const apiData = Array.isArray(result.data) ? result.data : [];

        const formattedLogs = apiData.map(item => ({
            id: item._id,
            date: item.date,
            status: item.checkInTime ? 'Present' : 'Absent', 
            timeIn: formatTime(item.checkInTime),
            timeOut: formatTime(item.checkOutTime),
        }));

        setLogs(formattedLogs);

        const presentCount = formattedLogs.filter(l => l.status === 'Present').length;
        const absentCount = formattedLogs.filter(l => l.status === 'Absent').length;
        
        setSummary({
            present: presentCount,
            absent: absentCount,
            leaves: 0,
            holidays: 0
        });

      } else {
        if (result.error && result.error.statusCode === 403) {
            Alert.alert("Session Expired", "Please login again.");
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            return;
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(currentDate);
  }, [currentDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendanceData(currentDate);
  }, [currentDate]);

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getStatusColor = (status) => {
    if (status === 'Present') return '#4CAF50'; 
    if (status === 'Absent') return '#F44336';  
    return '#757575'; 
  };

  const renderItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.dateBox}>
        <Text style={styles.dateText}>
            {new Date(item.date).getDate()}
        </Text>
        <Text style={styles.monthText}>
            {new Date(item.date).toLocaleString('default', { month: 'short' })}
        </Text>
      </View>
      
      <View style={styles.logDetails}>
        <Text style={[styles.logStatus, { color: getStatusColor(item.status) }]}>
            {item.status}
        </Text>
        <Text style={styles.logTime}>In: {item.timeIn} • Out: {item.timeOut}</Text>
      </View>

      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

      {/* Header */}
    

      <View style={styles.container}>
          <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image 
                source={require('../img/arrowback.png')} 
                style={styles.backIcon} 
            />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Attendance Report</Text>
      </View>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          
          {/* --- Logic Applied Here --- */}
          <TouchableOpacity 
            onPress={() => changeMonth(1)} 
            style={styles.navBtn}
            disabled={isNextDisabled()} // Click band kar diya
          >
            {/* Color fade kar diya agar disabled hai */}
            <Text style={[styles.arrowText, { opacity: isNextDisabled() ? 0.3 : 1 }]}>
                {'>'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: '#4CAF50' }]}>{summary.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: '#F44336' }]}>{summary.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: '#FF9800' }]}>{summary.leaves}</Text>
              <Text style={styles.statLabel}>Leaves</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: '#2196F3' }]}>{summary.holidays}</Text>
              <Text style={styles.statLabel}>Holidays</Text>
            </View>
          </View>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Daily History</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007BFF']} />
              }
              ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#888'}}>No records found</Text>}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AttendanceReport;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  customHeader: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical:10
  },
  backButton: { padding: 5, marginRight: 15 },
  backIcon: { width: 24, height: 24, resizeMode: 'contain' },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  monthSelector: { 
    backgroundColor: '#007BFF', 
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10,
    borderRadius: 15,
    marginHorizontal: 16,
    elevation: 5 
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  navBtn: { padding: 5 },
  arrowText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  summaryCard: { backgroundColor: '#fff', margin: 16, borderRadius: 15, padding: 20, elevation: 4 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  listHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  logCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 2,
    position: 'relative', 
    overflow: 'hidden'    
  },
  dateBox: { backgroundColor: '#F0F4F8', borderRadius: 8, padding: 10, alignItems: 'center', width: 60 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  monthText: { fontSize: 10, color: '#666', textTransform: 'uppercase' },
  logDetails: { flex: 1, marginLeft: 15 },
  logStatus: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  logTime: { fontSize: 12, color: '#888' },
  statusIndicator: { 
    position: 'absolute', 
    right: 0,             
    top: 0,
    bottom: 0,            
    width: 6,             
    height: '100',
  },
});