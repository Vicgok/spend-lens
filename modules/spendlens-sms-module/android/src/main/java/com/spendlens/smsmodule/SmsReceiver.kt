package com.spendlens.smsmodule

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import androidx.core.app.NotificationCompat
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build

class SmsReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "SpendLensSmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isNullOrEmpty()) return

            val firstMsg = messages[0]
            val sender = firstMsg.originatingAddress ?: ""
            val body = messages.joinToString("") { it.messageBody ?: "" }
            val date = System.currentTimeMillis()

            Log.d(TAG, "SMS received from: $sender")

            // P0 Requirement: "Scanning SMS..." notification
            showScanningNotification(context)

            // Trigger the Headless JS Task Service
            try {
                val serviceIntent = Intent(context, SmsHeadlessTaskService::class.java).apply {
                    putExtra("body", body)
                    putExtra("sender", sender)
                    putExtra("date", date)
                }
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start Headless JS task service", e)
            }
        }
    }

    private fun showScanningNotification(context: Context) {
        val channelId = "spendlens_sms_alerts"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "SMS Alerts", NotificationManager.IMPORTANCE_LOW)
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(
                context, 
                0, 
                launchIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("SpendLens")
            .setContentText("Scanning SMS...")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
        
        if (pendingIntent != null) {
            builder.setContentIntent(pendingIntent)
        }

        notificationManager.notify(9999, builder.build())
    }
}
