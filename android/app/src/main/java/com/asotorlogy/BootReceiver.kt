package com.asotorlogy

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = context.getSharedPreferences(LocationService.PREF_NAME, Context.MODE_PRIVATE)
            val isTracking = prefs.getBoolean(LocationService.PREF_TRACKING_KEY, false)
            if (isTracking) {
                Log.d(LocationService.TAG, "📦 BootReceiver starting LocationService after boot")
                val svcIntent = Intent(context, LocationService::class.java)
                androidx.core.content.ContextCompat.startForegroundService(context, svcIntent)
            }
        }
    }
}
