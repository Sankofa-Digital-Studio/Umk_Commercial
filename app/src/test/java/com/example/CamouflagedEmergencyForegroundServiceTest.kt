package com.example

import com.example.service.CamouflagedEmergencyForegroundService
import com.example.service.EmergencyBootReceiver
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CamouflagedEmergencyForegroundServiceTest {

    @Test
    fun testServiceConstantsAndDisguisePersonas() {
        assertEquals("com.example.service.action.START_DISPATCH", CamouflagedEmergencyForegroundService.ACTION_START_DISPATCH)
        assertEquals("com.example.service.action.STOP_DISPATCH", CamouflagedEmergencyForegroundService.ACTION_STOP_DISPATCH)
        assertEquals("MUNICIPAL_PREPAID", CamouflagedEmergencyForegroundService.PERSONA_POWERCALC)
        assertEquals("DAILY_DEVOTIONAL", CamouflagedEmergencyForegroundService.PERSONA_DAILY_VERSE)
        assertEquals("SYSTEM_OPTIMIZER", CamouflagedEmergencyForegroundService.PERSONA_SYSTEM_OPTIMIZER)
        assertEquals("umkhuseli_utility_sync_channel", CamouflagedEmergencyForegroundService.CHANNEL_ID)
        assertEquals(40401, CamouflagedEmergencyForegroundService.NOTIFICATION_ID)
    }

    @Test
    fun testIntentExtrasAndBootReceiverKeys() {
        assertEquals("extra_disguise_persona", CamouflagedEmergencyForegroundService.EXTRA_DISGUISE_PERSONA)
        assertEquals("extra_beacon_token", CamouflagedEmergencyForegroundService.EXTRA_BEACON_TOKEN)
        assertEquals("extra_start_time_ms", CamouflagedEmergencyForegroundService.EXTRA_START_TIME_MS)

        assertEquals("umkhuseli_sos_doze_state", EmergencyBootReceiver.PREFS_NAME)
        assertEquals("key_is_beacon_active", EmergencyBootReceiver.KEY_IS_BEACON_ACTIVE)
        assertEquals("key_beacon_token", EmergencyBootReceiver.KEY_BEACON_TOKEN)
        assertEquals("key_beacon_start_time", EmergencyBootReceiver.KEY_BEACON_START_TIME)
        assertEquals("key_persona", EmergencyBootReceiver.KEY_PERSONA)
    }

    @Test
    fun testDozeCheckIntervalsAreBatterySafe() {
        val fifteenMinutesMs = 15 * 60 * 1000L
        assertEquals(fifteenMinutesMs, CamouflagedEmergencyForegroundService.DOZE_CHECK_INTERVAL_MS)
        assertEquals(500f, CamouflagedEmergencyForegroundService.MIN_DISTANCE_METERS)
    }

    @Test
    fun testAdversaryEthicalSafetyChannelInvariants() {
        // Channel ID and descriptions must never expose distress, SOS, violence or tracking
        val channelId = CamouflagedEmergencyForegroundService.CHANNEL_ID
        assertFalse(channelId.contains("sos", ignoreCase = true))
        assertFalse(channelId.contains("emergency", ignoreCase = true))
        assertFalse(channelId.contains("gbv", ignoreCase = true))
        assertFalse(channelId.contains("track", ignoreCase = true))
    }
}
