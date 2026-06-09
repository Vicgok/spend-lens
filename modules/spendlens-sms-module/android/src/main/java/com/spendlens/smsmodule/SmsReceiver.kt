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
        Log.d(TAG, "[SMS_NATIVE_RECEIVER] onReceive fired, action=${intent.action}")

        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            try {
                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                if (messages.isNullOrEmpty()) {
                    Log.w(TAG, "[SMS_NATIVE_RECEIVER] No messages extracted from intent – returning")
                    return
                }

                val firstMsg = messages[0]
                val sender = firstMsg.originatingAddress ?: ""
                val body = messages.joinToString("") { it.messageBody ?: "" }
                val date = System.currentTimeMillis()

                Log.d(TAG, "[SMS_NATIVE_RECEIVER] SMS received from: $sender, bodyLength=${body.length}")

                // P0 Requirement: "Scanning SMS..." notification
                showScanningNotification(context)

                // Trigger the Headless JS Task Service
                Log.d(TAG, "[SMS_NATIVE_RECEIVER] Starting SmsHeadlessTaskService")
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
                Log.d(TAG, "[SMS_NATIVE_RECEIVER] SmsHeadlessTaskService start requested")
            } catch (e: Exception) {
                Log.e(TAG, "[SMS_NATIVE_FATAL] SmsReceiver.onReceive threw exception: ${e.message}", e)
            }
        } else {
            Log.d(TAG, "[SMS_NATIVE_RECEIVER] Ignoring unrelated action: ${intent.action}")
        }
    }

    private fun showScanningNotification(context: Context) {
        try {
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
            Log.d(TAG, "[SMS_NATIVE_RECEIVER] Scanning notification posted")
        } catch (e: Exception) {
            Log.e(TAG, "[SMS_NATIVE_FATAL] showScanningNotification threw: ${e.message}", e)
        }
    }
}
