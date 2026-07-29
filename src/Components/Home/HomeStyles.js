import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    elevation: 4,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  greeting: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  profilePicture: {
    width: 30,
    height: 30,
    borderRadius: 40,
    alignSelf: "center",
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },

  timeCard: {
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // Android Shadow
    elevation: 2,
  },

  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap:4
  },
  

  timeLabel: {
   color: "rgba(255, 255, 255, 0.9)", // Thoda soft white
    fontSize: 12, // Header label ko thoda chota rakhein
    fontWeight: "500",
    textTransform: 'uppercase'
  },

  timeBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 5,
  },

  timeContainer: {
    flex: 1,
  },

  time: {
    color: "#ffffff",
    fontSize: 21, // Time ko bada aur bold rakhein
    fontWeight: "800",
    letterSpacing: 1,
  },

  date: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },

  locationCard: {
    backgroundColor: "#E6FBF3",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 16,
  },

  locationText: {
    color: "#065F46",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },

  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginLeft: 10,
  },

  mapContainer: {
    height: 200,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
    elevation: 2,
    marginHorizontal: 16,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  checkContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#989090ff",
    elevation: 1,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
  },

  checkStatusText: {
    fontWeight: "700",
    fontSize: 16,
  },

  checkButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    width: "48%",
    elevation: 2,
  },

  checkinText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
  },

  quickActions: {
    marginTop: 25,
    marginBottom: 40,
    marginHorizontal: 16,
  },

  quickTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

 actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },

  controlText: {
    color: "#fff",
    fontWeight: "700",
  },

 actionCard: {
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
   
  },
  cardContainer: {
    width: "48%", // Grid layout
    marginBottom: 15,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white circle
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardIcon: {
    height: 28,
    width: 28,
  },
actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  headerRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  headerIcon: {
    backgroundColor: "#1A4B7C",
    width: 30,
    height: 30,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    color: "#fff",
    fontWeight: "bold",
  },

  headerText: {
    color: "#1A4B7C",
    fontWeight: "bold",
  },

  headerText1: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});

export default styles;