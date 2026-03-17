package com.asotorlogy

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class RestartServiceReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val prefs = context.getSharedPreferences(LocationService.PREF_NAME, Context.MODE_PRIVATE)
        val isTracking = prefs.getBoolean(LocationService.PREF_TRACKING_KEY, false)
        if (isTracking) {
            Log.d(LocationService.TAG, "🔁 RestartServiceReceiver starting LocationService")
            val svcIntent = Intent(context, LocationService::class.java)
            androidx.core.content.ContextCompat.startForegroundService(context, svcIntent)
        } else {
            Log.d(LocationService.TAG, "🔕 Tracking disabled, not restarting")
        }
    }
}
