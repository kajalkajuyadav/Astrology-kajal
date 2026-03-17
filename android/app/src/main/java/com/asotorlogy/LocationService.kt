package com.asotorlogy

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.net.Uri // ✅ Added
import android.os.*
import android.provider.Settings // ✅ Added
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class LocationService : Service() {

    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    
    // WakeLock for keeping CPU running
    private var wakeLock: PowerManager.WakeLock? = null
    
    private var isTracking = false

    // OkHttp Client configuration
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS) // Timeout badhaya
        .readTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    companion object {
        const val CHANNEL_ID = "location_service_channel"
        const val NOTIFICATION_ID = 101
        const val TAG = "LocationService"
        
        // Timing
        const val INTERVAL_MS = 240_000L // 4 minutes

        // Accuracy threshold (flag as low accuracy if greater)
        const val ACCURACY_THRESHOLD_METERS = 200f

        // Storage Keys
        const val PREF_NAME = "location_service_prefs"
        const val KEY_LAST_UPDATE = "last_update_time"
        const val PREF_TRACKING_KEY = "is_tracking_enabled" // New Key
    }

    override fun onCreate() {
        super.onCreate()
        
        // 1. WakeLock Acquire (CPU ko sone mat do)
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
      wakeLock = powerManager.newWakeLock(
    PowerManager.PARTIAL_WAKE_LOCK,
    "LocationService::Lock"
)

// ✅ Timeout based acquire
wakeLock?.acquire(10 * 60 * 60 * 1000L)
        createNotificationChannel()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {

wakeLock?.let { lock ->
    if (!lock.isHeld) {
      wakeLock?.acquire(10 * 60 * 60 * 1000L)
        Log.d(TAG, "🔋 WakeLock refreshed")
    }
}

                val location = result.lastLocation ?: return
                
                // 2. Accuracy Check (Thoda lenient kiya 200m tak). We will send even low-accuracy points but mark them.
                val isLowAccuracy = location.accuracy > ACCURACY_THRESHOLD_METERS
                if (isLowAccuracy) {
                    Log.d(TAG, "⚠️ Low Accuracy (${location.accuracy}m) — will send marked lowAccuracy")
                }

                // 3. Time Throttling (4 minute gap to match server expectations)
                val prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                val lastTime = prefs.getLong(KEY_LAST_UPDATE, 0L)
                val currentTime = System.currentTimeMillis()
                
                // 4 minutes gap required
                if (currentTime - lastTime < INTERVAL_MS) {
                    return
                }

                prefs.edit().putLong(KEY_LAST_UPDATE, currentTime).apply()
                Log.d(TAG, "📍 New Location: ${location.latitude}, ${location.longitude}")

                // 4. Send Data (Directly or via Queue). Pass lowAccuracy flag if needed.
                processLocationData(location, isLowAccuracy)
            }
        }
    }

   override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

    intent?.getStringExtra("base_url")?.let {
        getSharedPreferences(PREF_NAME, MODE_PRIVATE)
            .edit()
            .putString("base_url", it)
            .apply()
    }

    intent?.getStringExtra("token")?.let {
        getSharedPreferences(PREF_NAME, MODE_PRIVATE)
            .edit()
            .putString("token", it)
            .apply()
    }

    val prefs = getSharedPreferences(PREF_NAME, MODE_PRIVATE)
    prefs.edit().putBoolean(PREF_TRACKING_KEY, true).apply()

    cancelScheduledRestart()

    val notification = createNotification("HRMS Tracking Active")

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(
            NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )
    } else {
        startForeground(NOTIFICATION_ID, notification)
    }
val powerManager = getSystemService(POWER_SERVICE) as PowerManager
if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
    Log.e(TAG, "⚠️ NOT whitelisted from battery optimization")
}
    if (!isTracking) {
        if (checkLocationPermission()) {
            startLocationUpdates()
            isTracking = true
        } else {
            Log.e(TAG, "❌ Permission missing")
            stopSelf()
        }
    }

    return START_STICKY
}


 override fun onDestroy() {
    Log.e(TAG, "🔥 Service destroyed by system")

    if (wakeLock?.isHeld == true) {
        wakeLock?.release()
    }

    fusedClient.removeLocationUpdates(locationCallback)
    isTracking = false

    // 🔥 AUTO-RESTART IF TRACKING ENABLED
    val prefs = getSharedPreferences(PREF_NAME, MODE_PRIVATE)
    if (prefs.getBoolean(PREF_TRACKING_KEY, false)) {
        scheduleRestart()
    }

    super.onDestroy()
}


    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "🛑 onTaskRemoved called - scheduling restart")
        scheduleRestart()
        super.onTaskRemoved(rootIntent)
    }

    private fun scheduleRestart() {
        val prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val isTracking = prefs.getBoolean(PREF_TRACKING_KEY, false)
        if (!isTracking) return

        val intent = Intent(this, RestartServiceReceiver::class.java)
        val pendingId = 0
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        val pending = PendingIntent.getBroadcast(this, pendingId, intent, flags)

        val alarmMgr = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val triggerAt = SystemClock.elapsedRealtime() + 2000 // 2 seconds later
        try {
            // Try to set an exact alarm (may require SCHEDULE_EXACT_ALARM on some devices)
            alarmMgr.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pending)
            Log.d(TAG, "⏰ Restart scheduled in 2s (exact)")
        } catch (se: SecurityException) {
            // If we don't have exact alarm permission, fall back to an inexact alarm to avoid crashing
            Log.w(TAG, "⚠️ Exact alarm not permitted: ${se.message}. Falling back to inexact alarm.")
            alarmMgr.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pending)
            Log.d(TAG, "⏰ Restart scheduled in 2s (inexact fallback)")
        }
    }

    private fun cancelScheduledRestart() {
        val intent = Intent(this, RestartServiceReceiver::class.java)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        val pending = PendingIntent.getBroadcast(this, 0, intent, flags)
        val alarmMgr = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmMgr.cancel(pending)
        Log.d(TAG, "❌ Cancelled scheduled restart")
    }
    override fun onBind(intent: Intent?): IBinder? = null

    // ---------------- LOCATION CONFIG ----------------

  private fun startLocationUpdates() {

    val request = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        60_000L   // 1 minute interval (important)
    )
        .setMinUpdateIntervalMillis(60_000L)
        .setMaxUpdateDelayMillis(0L)   // 🔥 disable batching
        .setWaitForAccurateLocation(false)
        .build()

    try {
        fusedClient.requestLocationUpdates(
            request,
            locationCallback,
            Looper.getMainLooper()
        )
        Log.d(TAG, "✅ Location updates started properly")
    } catch (e: SecurityException) {
        Log.e(TAG, "Permission error: ${e.message}")
    }
}


    // ---------------- INTELLIGENT DATA HANDLING ----------------

    private fun processLocationData(location: Location, lowAccuracy: Boolean = false) {
        val prefs = getSharedPreferences(PREF_NAME, MODE_PRIVATE)
        val baseUrl = prefs.getString("base_url", "") ?: ""
        val token = prefs.getString("token", "") ?: ""

        if (baseUrl.isEmpty() || token.isEmpty()) {
            Log.e(TAG, "❌ Config missing (URL/Token)")
            return
        }

        val locationJson = JSONObject().apply {
            put("latitude", location.latitude)
            put("longitude", location.longitude)
            put("deviceTimestamp", System.currentTimeMillis())
            // Extra info for debugging
            put("accuracy", location.accuracy)
            if (lowAccuracy) put("lowAccuracy", true)
        }

        // Direct send attempt. Per user request we DO NOT store failed locations to persistent queue.
        sendLocationAPI(baseUrl, token, locationJson) { success ->
            if (!success) {
                // Drop the data and log; no offline persistence
                Log.w(TAG, "⚠️ Send failed; dropping location (no offline storage)")
            }
        }
    }

    // Single API Call Function
    private fun sendLocationAPI(baseUrl: String, token: String, jsonData: JSONObject, onResult: (Boolean) -> Unit) {
        val url = "$baseUrl/employees/location"
        val body = jsonData.toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $token")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "❌ API Fail: ${e.message}")
                onResult(false)
            }

            override fun onResponse(call: Call, response: Response) {
                val isSuccess = response.isSuccessful
                response.close()
                if (isSuccess) {
                    Log.d(TAG, "✅ Sent Successfully")
                    onResult(true)
                } else {
                    Log.e(TAG, "❌ Server Error Code: ${response.code}")
                    // Agar server error 500 hai toh retry mat karo, lekin agar 408/503 hai toh karo.
                    // Filhal hum safe side ke liye false bhejte hain.
                    onResult(false)
                }
            }
        })
    }

    // ---------------- OFFLINE QUEUE LOGIC ----------------
    // Offline queue persistence removed per user request. Failed sends will be dropped (logged) and not stored locally.

    // ---------------- NOTIFICATION & PERMISSIONS ----------------

    private fun checkLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun createNotification(text: String): Notification {
        val pendingIntentFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE
        } else { 0 }

        val notificationIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, pendingIntentFlag)

        // Action: Open Battery Optimization Settings (Whitelist)
        val batteryIntent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:$packageName")
        }
        val batteryPending = PendingIntent.getActivity(this, 1, batteryIntent, pendingIntentFlag)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Canx HRMS")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_manage, "Whitelist", batteryPending)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MAX) 
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking Service",
                NotificationManager.IMPORTANCE_HIGH
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}