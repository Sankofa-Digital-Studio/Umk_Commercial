package com.example.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Persisted emergency beacon coordinate breadcrumb for authenticated delivery under Android Doze.
 * Solves the legacy in-memory limitation by storing location fixes in local SQLite
 * across device reboots, screen-off states, and intermittent connectivity.
 */
@Entity(
    tableName = "sos_beacon_breadcrumbs",
    indices = [
        Index(value = ["beaconToken"]),
        Index(value = ["deliveryStatus"]),
        Index(value = ["timestampEpochMs"])
    ]
)
data class SosBeaconBreadcrumbEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val beaconToken: String,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float = 0f,
    val altitudeMeters: Double = 0.0,
    val speedMps: Float = 0f,
    val batteryPercentage: Int = 100,
    val isCharging: Boolean = false,
    val currentArea: String = "",
    val timestampEpochMs: Long = System.currentTimeMillis(),
    val deliveryStatus: String = STATUS_PENDING,
    val retryCount: Int = 0,
    val lastAttemptEpochMs: Long = 0L
) {
    companion object {
        const val STATUS_PENDING = "PENDING"
        const val STATUS_SENT = "SENT"
        const val STATUS_FAILED = "FAILED"
    }
}
