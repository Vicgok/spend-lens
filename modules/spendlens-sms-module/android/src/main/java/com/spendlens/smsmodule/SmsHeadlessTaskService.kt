package com.spendlens.smsmodule

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class SmsHeadlessTaskService : HeadlessJsTaskService() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelId = "spendlens_headless_sync"
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(channelId, "SMS Background Service", NotificationManager.IMPORTANCE_MIN)
            notificationManager.createNotificationChannel(channel)
            
            val builder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("SpendLens")
                .setContentText("Scanning SMS...")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                
            startForeground(9999, builder.build())
        }
    }

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras
        if (extras != null) {
            val body = extras.getString("body")
            val sender = extras.getString("sender")
            val date = extras.getLong("date")
            
            val bundle = Arguments.createMap().apply {
                putString("body", body)
                putString("sender", sender)
                putDouble("date", date.toDouble())
            }
            
            return HeadlessJsTaskConfig(
                "SpendLensSmsTask",
                bundle,
                10000, // Timeout in ms for background processing
                true // Allow running in foreground
            )
        }
        return null
    }
}
