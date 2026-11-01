package com.example.service

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Governs Android Doze Mode SOS beacon cadence, battery budget, consent lifecycle,
 * and 72-hour maximum beacon lifespan under LEGACY-B1.
 */
object SosTrackingPolicy {
    // 72-Hour Maximum Beacon Lifespan (Adversary and Privacy Safeguard)
    const val MAX_BEACON_DURATION_MS = 72 * 60 * 60 * 1000L // 72 hours

    // Initial Emergency Burst Cadence (First 15 Minutes after SOS Trigger)
    const val BURST_WINDOW_MS = 15 * 60 * 1000L // 15 minutes
    const val BURST_CADENCE_MS = 60 * 1000L // 1 minute

    // Active Moving Cadence (Displacement >= 500 meters)
    const val MOVING_CADENCE_MS = 3 * 60 * 1000L // 3 minutes

    // Doze Stationary Cadence (Conserves battery during Stage 6 loadshedding / night)
    const val DOZE_STATIONARY_CADENCE_MS = 15 * 60 * 1000L // 15 minutes

    // Critical Battery Cadence & Protection Thresholds
    const val CRITICAL_BATTERY_CADENCE_MS = 30 * 60 * 1000L // 30 minutes
    const val CRITICAL_BATTERY_PERCENT = 15 // Under 15% drops to 30 min checks
    const val EMERGENCY_HALT_BATTERY_PERCENT = 5 // Under 5% halts background tracking to preserve 10111 dialing

    // Significant Distance Threshold (in meters)
    const val MIN_SHIFT_DISTANCE_METERS = 500f

    // Outbox Delivery Retry Parameters
    const val MAX_DELIVERY_RETRIES = 5
    const val RETRY_BACKOFF_BASE_MS = 30 * 1000L // 30s initial backoff

    /**
     * Determines whether the active SOS beacon has exceeded its statutory/ethical 72-hour lifespan.
     */
    fun isBeaconExpired(startTimeEpochMs: Long, nowEpochMs: Long = System.currentTimeMillis()): Boolean {
        if (startTimeEpochMs <= 0L) return false
        return (nowEpochMs - startTimeEpochMs) >= MAX_BEACON_DURATION_MS
    }

    /**
     * Determines whether background tracking should halt to protect the survivor's handset
     * from complete battery exhaustion, guaranteeing power remains to place emergency voice calls.
     */
    fun shouldHaltForBattery(batteryPct: Int): Boolean {
        return batteryPct in 1..EMERGENCY_HALT_BATTERY_PERCENT
    }

    /**
     * Resolves the adaptive interval for the next Doze location sample based on
     * elapsed beacon duration, battery level, and spatial displacement.
     */
    fun resolveIntervalMs(
        startTimeEpochMs: Long,
        batteryPct: Int,
        hasShiftedSignificantly: Boolean,
        nowEpochMs: Long = System.currentTimeMillis()
    ): Long {
        if (shouldHaltForBattery(batteryPct)) {
            return 0L
        }

        // Critical battery throttling takes precedence to prolong survivor lifeline
        if (batteryPct <= CRITICAL_BATTERY_PERCENT && batteryPct > 0) {
            return CRITICAL_BATTERY_CADENCE_MS
        }

        val elapsedMs = if (startTimeEpochMs > 0L) (nowEpochMs - startTimeEpochMs) else 0L

        // Initial 15-minute emergency burst window
        if (elapsedMs < BURST_WINDOW_MS) {
            return BURST_CADENCE_MS
        }

        // Active movement tracking
        if (hasShiftedSignificantly) {
            return MOVING_CADENCE_MS
        }

        // Deep Doze stationary cadence
        return DOZE_STATIONARY_CADENCE_MS
    }

    /**
     * Calculates Haversine distance in meters between two coordinates.
     */
    fun calculateDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371000.0 // Earth radius in meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    /**
     * Evaluates if new coordinates represent a significant displacement.
     */
    fun isSignificantShift(lastLat: Double?, lastLng: Double?, currentLat: Double, currentLng: Double): Boolean {
        if (lastLat == null || lastLng == null) return true
        val distance = calculateDistanceMeters(lastLat, lastLng, currentLat, currentLng)
        return distance >= MIN_SHIFT_DISTANCE_METERS
    }
}
