package com.spendlens.smsmodule

import android.Manifest
import android.app.PendingIntent
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class SpendLensSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SpendLensSmsModule")

    AsyncFunction("readSmsInbox") { promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("ERR_NO_CONTEXT", "React application context is not available", null)
        return@AsyncFunction
      }

      val readSmsPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS)
      if (readSmsPermission != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted", null)
        return@AsyncFunction
      }

      try {
        val smsList = mutableListOf<Map<String, Any>>()
        val uri = Uri.parse("content://sms/inbox")
        val projection = arrayOf("address", "body", "date")
        
        // Strictly filter to the last 10 days
        val tenDaysAgo = System.currentTimeMillis() - (10L * 24 * 60 * 60 * 1000)
        val selection = "date >= ?"
        val selectionArgs = arrayOf(tenDaysAgo.toString())
        
        val cursor: Cursor? = context.contentResolver.query(
          uri,
          projection,
          selection,
          selectionArgs,
          "date DESC"
        )

        cursor?.use {
          val indexAddress = it.getColumnIndexOrThrow("address")
          val indexBody = it.getColumnIndexOrThrow("body")
          val indexDate = it.getColumnIndexOrThrow("date")

          while (it.moveToNext()) {
            val map = mapOf(
              "address" to it.getString(indexAddress),
              "body" to it.getString(indexBody),
              "date" to it.getLong(indexDate).toDouble()
            )
            smsList.add(map)
          }
        }
        promise.resolve(smsList)
      } catch (e: Exception) {
        promise.reject("ERROR", e.message, e)
      }
    }

    AsyncFunction("showNotification") { title: String, message: String, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("ERR_NO_CONTEXT", "React application context is not available", null)
        return@AsyncFunction
      }

      try {
        val channelId = "spendlens_sms_alerts"
        val channelName = "SMS Alerts"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = "Alerts when new financial SMS is parsed"
          }
          notificationManager.createNotificationChannel(channel)
        }

        val iconId = context.resources.getIdentifier("ic_launcher", "mipmap", context.packageName)

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
          .setSmallIcon(if (iconId != 0) iconId else android.R.drawable.ic_dialog_info)
          .setContentTitle(title)
          .setContentText(message)
          .setPriority(NotificationCompat.PRIORITY_DEFAULT)
          .setAutoCancel(true)

        if (pendingIntent != null) {
          builder.setContentIntent(pendingIntent)
        }

        if (Build.VERSION.SDK_INT >= 33) {
          if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            promise.resolve("PERMISSION_DENIED")
            return@AsyncFunction
          }
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
        promise.resolve("SUCCESS")
      } catch (e: Exception) {
        promise.reject("ERROR", e.message, e)
      }
    }
  }
}
