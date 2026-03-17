package com.asotorlogy

import android.content.Intent
import android.content.Context  // ✅ NEW
import android.net.Uri  // ✅ NEW
import android.provider.Settings  // ✅ NEW
import android.util.Log  // ✅ NEW
import android.app.AlarmManager
import android.app.PendingIntent
import com.facebook.react.bridge.*
import com.facebook.react.bridge.ReactApplicationContext

class LocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LocationServiceModule"

    @ReactMethod
    fun startService(baseUrl: String, token: String) {
        Log.d("LocationModule", "🔥 startService called: $baseUrl")
        // Persist config & enable tracking flag so service can restart after swipe/boot
        val prefs = reactContext.getSharedPreferences(LocationService.PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString("base_url", baseUrl)
            .putString("token", token)
            .putBoolean(LocationService.PREF_TRACKING_KEY, true)
            .apply()

        val intent = Intent(reactContext, LocationService::class.java)
        intent.putExtra("base_url", baseUrl)
        intent.putExtra("token", token)
        androidx.core.content.ContextCompat.startForegroundService(reactContext, intent)
        Log.d("LocationModule", "✅ Service STARTED")
    }

    @ReactMethod
    fun stopService() {
        Log.d("LocationModule", "🛑 stopService called")
        // Disable tracking flag so service won't auto-restart
        val prefs = reactContext.getSharedPreferences(LocationService.PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(LocationService.PREF_TRACKING_KEY, false).apply()

        val intent = Intent(reactContext, LocationService::class.java)
        reactContext.stopService(intent)

        // Also cancel interval alarms so scheduled sends stop immediately
        try {
            val alarmIntent = Intent(reactContext, IntervalAlarmReceiver::class.java)
            val flags = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
            val pending = PendingIntent.getBroadcast(reactContext, 123, alarmIntent, flags)
            val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            am.cancel(pending)
            Log.d("LocationModule", "❌ Interval send alarm cancelled from JS stopService")
        } catch (e: Exception) { /* ignore */ }

        Log.d("LocationModule", "✅ Service STOP command sent")
    }

    @ReactMethod  // 🔥 NEW
    fun requestBatteryOptimizationOff() {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${reactContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) // Required when launching outside an Activity
        }
        try {
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("LocationModule", "Failed to open battery settings: ${e.message}")
        }
    }
}
