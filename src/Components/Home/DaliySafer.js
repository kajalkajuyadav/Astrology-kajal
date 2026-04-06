import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import DaliyClaim from './DaliyClaim';
import Offline from './Offline';

const DaliySafer = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('online');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1FA2FF" }}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#1FA2FF" />

    <View style={styles.container}>
      {/* -------- HEADER -------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require("../img/arrowback.png")} style={{ height: 20, width: 20 }} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Daliy Safer</Text>

        <View style={{ width: 24 }} />
        {/* right side empty for alignment */}
      </View>

      {/* -------- TABS -------- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('online')}
          style={[styles.tab, activeTab === 'online' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
            Online
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('offline')}
          style={[styles.tab, activeTab === 'offline' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>
            Offline
          </Text>
        </TouchableOpacity>
      </View>

      {/* -------- TAB CONTENT -------- */}
      {activeTab === 'online' && (
        <DaliyClaim />
      )}

      {activeTab === 'offline' && (
        <Offline />
      )}

    </View>
    </SafeAreaView>
  );
};

export default DaliySafer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  /* TABS */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e6e6e6',
    marginHorizontal: 10,
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

  /* CONTENT */
  contentBox: {
    marginTop: 30,
    alignItems: 'center',
  },
  contentText: {
    fontSize: 18,
    color: '#333',
  },
});
