import AsyncStorage from "@react-native-async-storage/async-storage";
import BaseUrl from "../../url/env"; // Adjust the path as needed

const LOGIN_URL = `https://api.canxinternational.in/api/v1/employees/signin`;

/**
 * Handles the login API call, token saving, and error processing.
 * @param {string} phone - The user's phone number.
 * @param {string} password - The user's password.
 * @returns {object} { success: boolean, message: string }
 */
export const loginUser = async (phone, password) => {
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, password }),
    });

    // 1. Try to parse JSON
    const json = await response.json().catch(() => {
        // If JSON parsing fails (e.g., non-JSON response from server)
        return null;
    });

    if (json === null) {
        return { 
            success: false, 
            message: "Failed to read server response." 
        };
    }
    
    // 2. Check the API's custom success key
    if (json.success !== true) {
      // API-level error (e.g., invalid credentials)
      const msg = json.message || "Login failed. Check your details.";
      return { 
          success: false, 
          message: msg 
      };
    }

    // 3. Extract and Save Token
    let token = null;
    
    // Check for the token in data (your example structure) or data.token
    if (typeof json.data === 'string' && json.data.split('.').length === 3) {
        token = json.data; // Token directly in data field
    } else if (json.data && typeof json.data.token === 'string') {
        token = json.data.token; // Token in data.token field
    }

    if (!token) {
      return { 
          success: false, 
          message: "Login successful, but session information is missing." 
      };
    }

    await AsyncStorage.setItem("authToken", token);
    
    // 4. Success case
    return { 
        success: true, 
        message: json.message || "Login Successful" 
    };

  } catch (err) {
    // Network or catastrophic error
    console.log("Error Message from Catch:", err.message); // ⬅️ यह line जोड़ दें
    console.error("🔥 CRITICAL EXCEPTION / NETWORK ERROR:", err);
    return {
      success: false,
      message: err.message || "A network or server error occurred.",
    };
  }
};