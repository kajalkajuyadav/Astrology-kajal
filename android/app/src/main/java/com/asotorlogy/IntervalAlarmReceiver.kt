package com.asotorlogy

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class IntervalAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("IntervalAlarmReceiver", "⏰ Interval alarm fired — starting service for scheduled send")
        try {
            val serviceIntent = Intent(context, LocationService::class.java)
            serviceIntent.putExtra("immediate_send", true)
            serviceIntent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND)

            androidx.core.content.ContextCompat.startForegroundService(context, serviceIntent)
        } catch (e: Exception) {
            Log.e("IntervalAlarmReceiver", "Failed to start LocationService: ${e.message}")
        }
    }
}
