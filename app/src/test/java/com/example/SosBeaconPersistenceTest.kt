package com.example

import com.example.data.local.entity.SosBeaconBreadcrumbEntity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class SosBeaconPersistenceTest {

    @Test
    fun testBreadcrumbEntityInstantiationAndDefaults() {
        val breadcrumb = SosBeaconBreadcrumbEntity(
            beaconToken = "test_beacon_welkom_001",
            latitude = -27.9620,
            longitude = 26.7320,
            accuracyMeters = 8.5f,
            altitudeMeters = 1380.0,
            speedMps = 1.2f,
            batteryPercentage = 84,
            isCharging = false,
            currentArea = "Flamingo Park, Welkom"
        )

        assertEquals("test_beacon_welkom_001", breadcrumb.beaconToken)
        assertEquals(-27.9620, breadcrumb.latitude, 0.0001)
        assertEquals(26.7320, breadcrumb.longitude, 0.0001)
        assertEquals(8.5f, breadcrumb.accuracyMeters)
        assertEquals(84, breadcrumb.batteryPercentage)
        assertEquals(false, breadcrumb.isCharging)
        assertEquals("Flamingo Park, Welkom", breadcrumb.currentArea)
        assertEquals(SosBeaconBreadcrumbEntity.STATUS_PENDING, breadcrumb.deliveryStatus)
        assertEquals(0, breadcrumb.retryCount)
        assertEquals(0L, breadcrumb.lastAttemptEpochMs)
    }

    @Test
    fun testBreadcrumbStatusTransitions() {
        val pending = SosBeaconBreadcrumbEntity(
            id = 101L,
            beaconToken = "token_44",
            latitude = -26.2041,
            longitude = 28.0473
        )
        assertEquals(SosBeaconBreadcrumbEntity.STATUS_PENDING, pending.deliveryStatus)

        val sent = pending.copy(
            deliveryStatus = SosBeaconBreadcrumbEntity.STATUS_SENT,
            lastAttemptEpochMs = System.currentTimeMillis()
        )
        assertEquals(SosBeaconBreadcrumbEntity.STATUS_SENT, sent.deliveryStatus)

        val failed = pending.copy(
            deliveryStatus = SosBeaconBreadcrumbEntity.STATUS_FAILED,
            retryCount = 5,
            lastAttemptEpochMs = System.currentTimeMillis()
        )
        assertEquals(SosBeaconBreadcrumbEntity.STATUS_FAILED, failed.deliveryStatus)
        assertEquals(5, failed.retryCount)
    }
}
