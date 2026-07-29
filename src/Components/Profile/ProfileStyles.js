import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // 🔹 Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    elevation: 4,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  header1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerRow2: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
    marginLeft: 12,
  },

  headerText1: {
    color: "#4CAF50",
    fontWeight: "bold",
  },

  // 🔹 Title Section
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },

  // 🔹 Scroll
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // 🔹 Card
  card1: {
    marginTop: 20,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 10,
  },

  // 🔹 ID Card
  idCard: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 10,
    overflow: "hidden",
  },

  idCardBanner: {
    width: 50,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  bannerText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
    fontSize: 14,
    transform: [{ rotate: "-90deg" }],
    width: 150,
    textAlign: "center",
    letterSpacing: 1,
  },

  idCardContent: {
    flex: 1,
    padding: 5,
  },

  idCardCompany: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    textTransform: "uppercase",
  },

  profileName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },

  profileTitle: {
    fontSize: 15,
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 16,
  },

  // 🔹 Profile Image
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 70,
    alignSelf: "center",
    borderWidth: 3,
    borderColor: "#F3F4F6",
    marginVertical: 10,
    overflow: "hidden",
  },

  profilePicture1: {
    width: 30,
    height: 30,
    borderRadius: 30,
    alignSelf: "center",
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },

  profilePictureContainer: {
    width: 80,
    height: 80,
    borderRadius: 80,
    alignSelf: "center",
    overflow: "hidden",
  },

  textAvatarFallback: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },

  // 🔹 Info Section
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },

  infoContainer: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  infoLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },

  infoValue: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },

  // 🔹 Button
  applyButton: {
    marginLeft: "auto",
    backgroundColor: "#F97316",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // 🔹 Empty State
  emptyCardText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 16,
    marginLeft: 10,
  },

  // 🔹 Slip Item
  slipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },

  slipIconContainer: {
    backgroundColor: "#D1FAE5",
    borderRadius: 50,
    padding: 6,
  },

  slipTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  slipTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },

  slipSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  // 🔹 Loader
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: 18,
    color: "#3B82F6",
    fontWeight: "600",
  },
});

export default styles;