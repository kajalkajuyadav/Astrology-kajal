import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BaseUrl } from "../../url/env";

const OrderScreen = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrderVisits = async (pageNo = 1, isRefresh = false) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!isRefresh) setLoading(true);

      const res = await fetch(
        `${BaseUrl}/visits?purpose=ORDER&page=${pageNo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      console.log("ORDER VISITS:", data);

      if (data.success === true) {
        // Pagination logic
        if (pageNo === 1) {
          setVisits(data.data.visits);
        } else {
          setVisits((prev) => [...prev, ...data.data.visits]);
        }

        setTotalPages(data.data.totalPages);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.log("Order API Error:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchOrderVisits(1);
  }, []);

  // Load More when scrolling
  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrderVisits(nextPage);
    }
  };

  // Pull to Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrderVisits(1, true);
  };

  // UI for each visit
  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.amount}>₹{item.amount}</Text>
        </View>

        <Text style={styles.text}>
          Payment Mode: <Text style={styles.bold}>{item.paymentMode}</Text>
        </Text>

        <Text style={styles.text}>
          Purpose: <Text style={styles.bold}>{item.purpose}</Text>
        </Text>

        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}

        // Pull to refresh
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }

        // Pagination - Load more
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}

        ListFooterComponent={
          page < totalPages ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ margin: 10 }} />
          ) : null
        }
      />
    </View>
  );
};

export default OrderScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  clientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
  },

  text: {
    fontSize: 14,
    marginTop: 5,
    color: "#444",
  },

  bold: {
    fontWeight: "600",
    color: "#111",
  },

  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
  },
});
