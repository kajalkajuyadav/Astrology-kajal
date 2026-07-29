import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";

const slides = [
    {
        id: 1,
        title: "Live Employee Location Tracking",
        description:
            "End-to-end encryption with sub-100ms latency globally.",
        image: require("../img/marker.png"),
    },

    {
        id: 2,
        title: "Travel Distance Calculation",
        description:
            "Intuitive analytics powered by advanced neural networks.",
        image: require("../img/distance.png"),
    },

    {
        id: 3,
        title: "Salary Slip Generation",
        description:
            "Experience next-generation productivity with AI tools.",
        image: require("../img/salary.png"),
    },

    {
        id: 4,
        title: "Leave Management",
        description:
            "Experience next-generation productivity with AI tools.",
        image: require("../img/year.png"),
    },
];

const OnboardingScreen = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentSlide = slides[currentIndex];
    const navigation = useNavigation();
    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            navigation.navigate("Login");
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
            />

            <LinearGradient
                colors={["#08131f", "#12091f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoWrapper}>
                       <Image
                                     source={require("../img/WorkTracklogoh.png")}
                                     style={styles.topLogo}
                                     resizeMode="contain"
                                   />
                    </View>

                    {/* Progress */}
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={["#00d2ff", "#9d50bb"]}
                            style={[
                                styles.progress,
                                {
                                    width: `${((currentIndex + 1) / slides.length) * 100}%`,
                                },
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.iconWrapper}>
                        <Image
                            source={currentSlide.image}
                            style={styles.slideImage}
                            tintColor={"#00d2ff"}
                        />
                    </View>

                    <Text style={styles.title}>
                        {currentSlide.title}
                    </Text>

                    <Text style={styles.description}>
                        {currentSlide.description}
                    </Text>

                    {/* Pagination */}
                    <View style={styles.dotContainer}>
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentIndex === index &&
                                    styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    {/* Skip */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.skipBtn}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    {/* Next */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.nextWrapper}
                        onPress={handleNext}
                    >
                        <LinearGradient
                            colors={["#00d2ff", "#9d50bb"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextBtn}
                        >
                            <Text style={styles.nextText}>
                                {currentIndex ===
                                    slides.length - 1
                                    ? "Finish"
                                    : "Next"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
     topLogo: {
    width: "100%",
    height: "100%",
  },
logoWrapper: {
    width: 130, // Rigid width prevents squeezing
    height: 40,
    justifyContent: "center",
  },
    gradient: {
        flex: 1,
        paddingHorizontal: 18,
        paddingBottom: 35,
        backgroundColor: "#06080c",
    },
    slideImage: {
        width: 45,
        height: 45,
        resizeMode: "contain",
    },
    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    logoText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },

    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 10,
        overflow: "hidden",
    },

    progress: {
        height: "100%",
        borderRadius: 10,
    },

    /* Content */
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent:"center"
    },

    iconWrapper: {
        width: 90,
        height: 90,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 35,
    },

    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "400",
        textAlign: "center",
    },

    description: {
        color: "#a0a0a0",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 32,
        marginTop: 18,
        paddingHorizontal: 20,
    },

    /* Dots */
    dotContainer: {
        flexDirection: "row",
        marginTop: 40,
        alignItems: "center",
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginHorizontal: 5,
    },

    activeDot: {
        width: 28,
        backgroundColor: "#00d2ff",
    },

    /* Buttons */
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },

    skipBtn: {
        flex: 1,
        height: 58,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
    },

    skipText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },

    nextWrapper: {
        flex: 1.4,
    },

    nextBtn: {
        height: 58,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },

    nextText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});