import React, { useState } from "react";
import { View, Text, TouchableOpacity, StatusBar, Image, StyleSheet, SafeAreaView } from "react-native";
import PaymentScreen from "./PaymentScreen";
import OrderScreen from "./OrderScreen";
import ManualVisitEntryScreen from "./ManualVisitEntryScreen";
import { useNavigation } from "@react-navigation/native";

const MyVisitsScreen = () => {
  const [activeTab, setActiveTab] = useState("Payment");
  const navigation = useNavigation()
  const renderScreen = () => {
    switch (activeTab) {
      case "Payment":
        return <PaymentScreen />;
      case "Order":
        return <OrderScreen />;
      case "Naya Entry":
        return <ManualVisitEntryScreen />;
      default:
        return <PaymentScreen />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require("../img/arrowback.png")} style={{ height: 20, width: 20 }} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Your Visits</Text>

        <View style={{ width: 24 }} />
        {/* right side empty for alignment */}
      </View>
      {/* ------------ HEADER ------------- */}


      {/* ------------ TABS ------------- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("Payment")}
          style={[styles.tab, activeTab === "Payment" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "Payment" && styles.activeTabText]}>
            Payment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("Order")}
          style={[styles.tab, activeTab === "Order" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "Order" && styles.activeTabText]}>
            Order
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("Naya Entry")}
          style={[styles.tab, activeTab === "Naya Entry" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "Naya Entry" && styles.activeTabText]}>
            New Entry
          </Text>
        </TouchableOpacity>
      </View>


      {/* ------------ SCREEN RENDER ------------- */}

      {renderScreen()}
    </View>
    </SafeAreaView>
  );
};

export default MyVisitsScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,},
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e6e6e6',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#000',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
