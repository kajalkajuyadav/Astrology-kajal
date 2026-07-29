import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView, View, TouchableOpacity, StatusBar } from 'react-native';

const PrivacyPolicy = () => {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Privacy Policy</Text>
        <Text style={styles.brand}>WorkTrack 360</Text>

        {/* GOOGLE PLAY REQUIREMENT: Prominent Disclosure */}
        <View style={styles.disclosureBox}>
          <Text style={styles.disclosureTitle}>📍 Prominent Disclosure (Location)</Text>
          <Text style={styles.disclosureText}>
            WorkTrack 360 collects location data to enable **"Real-time Employee Tracking"** and **"Geofence-based Attendance"** even when the app is closed or not in use (background). 
            {"\n\n"}
            This data allows your employer to verify field visits and calculate working hours accurately. Location tracking is only active during your authorized "Punch In" sessions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>1. Information We Collect</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Precise Location:</Text> We collect GPS coordinates (Background & Foreground) to facilitate workforce management.{"\n"}
            • <Text style={styles.bold}>Personal Identity:</Text> Full Name, Employee ID, and Phone Number provided by your organization.{"\n"}
            • <Text style={styles.bold}>Financial Data:</Text> Salary details and Bank Information for automated payroll processing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>2. Purpose of Data Processing</Text>
          <Text style={styles.text}>
            • To calculate travel distance and optimize client visit schedules.{"\n"}
            • To automate attendance marking via Geofencing technology.{"\n"}
            • To generate monthly payslips and financial reports for your employer.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>3. Data Protection & Sharing</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>No Third-Party Sales:</Text> We do not sell your personal data to advertising agencies.{"\n"}
            • <Text style={styles.bold}>Access Control:</Text> Data is strictly accessible only to your Company Admin and HR Department.{"\n"}
            • <Text style={styles.bold}>Encryption:</Text> All data is transmitted and stored using industry-standard SSL Encryption.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>4. User Rights & Retention</Text>
          <Text style={styles.text}>
            Users may request the deletion of their location history through their HR department. Upon account termination, personal data is permanently purged from our active servers within 30 days.
          </Text>
        </View>

        <Text style={styles.footer}>Contact Support: support@malhotrait.com</Text>
        
        <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate("TermsOfService")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1A4B7C', marginBottom: 5 },
  brand: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold', marginBottom: 20 },
  disclosureBox: { 
    padding: 15, 
    backgroundColor: '#E1F5FE', 
    borderRadius: 8, 
    borderLeftWidth: 5, 
    borderLeftColor: '#0288D1', 
    marginBottom: 25 
  },
  disclosureTitle: { fontSize: 16, fontWeight: 'bold', color: '#01579B', marginBottom: 5 },
  disclosureText: { fontSize: 14, color: '#0277BD', lineHeight: 20, fontWeight: '500' },
  section: { marginBottom: 20 },
  subTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  text: { fontSize: 15, color: '#444', lineHeight: 22 },
  bold: { fontWeight: 'bold', color: '#222' },
  footer: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12 },
  button: {
    backgroundColor: '#1A4B7C',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center'
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default PrivacyPolicy;