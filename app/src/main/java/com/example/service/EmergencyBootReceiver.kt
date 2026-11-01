package com.example.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

/**
 * BroadcastReceiver to recover active SOS tracking and outbox delivery after device reboot
 * or app package update under Android 14+ requirements.
 */
class EmergencyBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isBeaconActive = prefs.getBoolean(KEY_IS_BEACON_ACTIVE, false)
            val startTimeMs = prefs.getLong(KEY_BEACON_START_TIME, 0L)
            val beaconToken = prefs.getString(KEY_BEACON_TOKEN, null)
            val persona = prefs.getString(KEY_PERSONA, CamouflagedEmergencyForegroundService.PERSONA_POWERCALC)
                ?: CamouflagedEmergencyForegroundService.PERSONA_POWERCALC

            if (isBeaconActive && !beaconToken.isNullOrBlank()) {
                val now = System.currentTimeMillis()
                if (SosTrackingPolicy.isBeaconExpired(startTimeMs, now)) {
                    // Beacon has exceeded 72 hours: safely mark expired and do not restart
                    prefs.edit()
                        .putBoolean(KEY_IS_BEACON_ACTIVE, false)
                        .putLong(KEY_BEACON_EXPIRED_TIME, now)
                        .apply()
                    return
                }

                // Check location permissions before starting foreground service (Android 14 requirement)
                val hasFine = ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (hasFine || hasCoarse) {
                    CamouflagedEmergencyForegroundService.start(
                        context = context,
                        persona = persona,
                        beaconToken = beaconToken,
                        startTimeMs = startTimeMs
                    )
                }
            }
        }
    }

    companion object {
        const val PREFS_NAME = "umkhuseli_sos_doze_state"
        const val KEY_IS_BEACON_ACTIVE = "key_is_beacon_active"
        const val KEY_BEACON_START_TIME = "key_beacon_start_time"
        const val KEY_BEACON_TOKEN = "key_beacon_token"
        const val KEY_PERSONA = "key_persona"
        const val KEY_BEACON_EXPIRED_TIME = "key_beacon_expired_time"
    }
}
