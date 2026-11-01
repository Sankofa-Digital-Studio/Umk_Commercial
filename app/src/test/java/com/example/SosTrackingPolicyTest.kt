package com.example

import com.example.service.SosTrackingPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SosTrackingPolicyTest {

    @Test
    fun test72HourMaximumBeaconExpiration() {
        val now = 1_700_000_000_000L
        val seventyTwoHoursMs = 72 * 60 * 60 * 1000L

        // Fresh beacon (10 mins old)
        assertFalse(SosTrackingPolicy.isBeaconExpired(now - (10 * 60 * 1000L), now))

        // 71 hours old (still active)
        assertFalse(SosTrackingPolicy.isBeaconExpired(now - (71 * 60 * 60 * 1000L), now))

        // Exactly 72 hours old (expired)
        assertTrue(SosTrackingPolicy.isBeaconExpired(now - seventyTwoHoursMs, now))

        // 73 hours old (expired)
        assertTrue(SosTrackingPolicy.isBeaconExpired(now - (73 * 60 * 60 * 1000L), now))

        // Invalid / zero start time
        assertFalse(SosTrackingPolicy.isBeaconExpired(0L, now))
    }

    @Test
    fun testBatterySafetyHaltingThreshold() {
        // Below 5% battery, halt tracking to preserve handset voice call capability (10111 / 0800 428 428)
        assertTrue(SosTrackingPolicy.shouldHaltForBattery(5))
        assertTrue(SosTrackingPolicy.shouldHaltForBattery(4))
        assertTrue(SosTrackingPolicy.shouldHaltForBattery(1))

        // 6% and above should not halt
        assertFalse(SosTrackingPolicy.shouldHaltForBattery(6))
        assertFalse(SosTrackingPolicy.shouldHaltForBattery(15))
        assertFalse(SosTrackingPolicy.shouldHaltForBattery(50))
        assertFalse(SosTrackingPolicy.shouldHaltForBattery(100))
    }

    @Test
    fun testCadenceResolutionAcrossLifecycleAndBatteryBudget() {
        val now = 1_700_000_000_000L
        val startJustNow = now - (2 * 60 * 1000L) // 2 mins ago (inside 15-min burst window)
        val startHourAgo = now - (60 * 60 * 1000L) // 60 mins ago (outside burst window)

        // 1. Initial 15-min emergency burst window (every 60 seconds)
        val burstInterval = SosTrackingPolicy.resolveIntervalMs(
            startTimeEpochMs = startJustNow,
            batteryPct = 80,
            hasShiftedSignificantly = false,
            nowEpochMs = now
        )
        assertEquals(SosTrackingPolicy.BURST_CADENCE_MS, burstInterval)
        assertEquals(60_000L, burstInterval)

        // 2. Active movement outside burst window (every 3 minutes)
        val movingInterval = SosTrackingPolicy.resolveIntervalMs(
            startTimeEpochMs = startHourAgo,
            batteryPct = 75,
            hasShiftedSignificantly = true,
            nowEpochMs = now
        )
        assertEquals(SosTrackingPolicy.MOVING_CADENCE_MS, movingInterval)
        assertEquals(180_000L, movingInterval)

        // 3. Stationary deep Doze mode (every 15 minutes)
        val stationaryInterval = SosTrackingPolicy.resolveIntervalMs(
            startTimeEpochMs = startHourAgo,
            batteryPct = 70,
            hasShiftedSignificantly = false,
            nowEpochMs = now
        )
        assertEquals(SosTrackingPolicy.DOZE_STATIONARY_CADENCE_MS, stationaryInterval)
        assertEquals(900_000L, stationaryInterval)

        // 4. Critical battery <= 15% drops to 30-minute interval
        val criticalBatteryInterval = SosTrackingPolicy.resolveIntervalMs(
            startTimeEpochMs = startJustNow,
            batteryPct = 12,
            hasShiftedSignificantly = true,
            nowEpochMs = now
        )
        assertEquals(SosTrackingPolicy.CRITICAL_BATTERY_CADENCE_MS, criticalBatteryInterval)
        assertEquals(1_800_000L, criticalBatteryInterval)

        // 5. Emergency halt when battery <= 5%
        val haltInterval = SosTrackingPolicy.resolveIntervalMs(
            startTimeEpochMs = startJustNow,
            batteryPct = 3,
            hasShiftedSignificantly = true,
            nowEpochMs = now
        )
        assertEquals(0L, haltInterval)
    }

    @Test
    fun testSignificantDistanceShiftCalculation() {
        // Welkom Flamingo Park (-27.9620, 26.7320)
        val lat1 = -27.9620
        val lon1 = 26.7320

        // Displaced by ~600 meters
        val lat2 = -27.9674
        val lon2 = 26.7320
        val dist = SosTrackingPolicy.calculateDistanceMeters(lat1, lon1, lat2, lon2)
        assertTrue(dist >= 500.0)
        assertTrue(SosTrackingPolicy.isSignificantShift(lat1, lon1, lat2, lon2))

        // Minor drift (~50 meters)
        val lat3 = -27.9624
        val lon3 = 26.7320
        val smallDist = SosTrackingPolicy.calculateDistanceMeters(lat1, lon1, lat3, lon3)
        assertTrue(smallDist < 500.0)
        assertFalse(SosTrackingPolicy.isSignificantShift(lat1, lon1, lat3, lon3))

        // Initial fix (null previous coordinates) must always register as significant shift
        assertTrue(SosTrackingPolicy.isSignificantShift(null, null, lat1, lon1))
    }
}
