package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.local.entity.SosBeaconBreadcrumbEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SosBeaconBreadcrumbDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBreadcrumb(breadcrumb: SosBeaconBreadcrumbEntity): Long

    @Query("SELECT * FROM sos_beacon_breadcrumbs WHERE deliveryStatus = 'PENDING' ORDER BY timestampEpochMs ASC")
    suspend fun getPendingBreadcrumbs(): List<SosBeaconBreadcrumbEntity>

    @Query("SELECT * FROM sos_beacon_breadcrumbs WHERE beaconToken = :token ORDER BY timestampEpochMs DESC")
    fun getBreadcrumbsByToken(token: String): Flow<List<SosBeaconBreadcrumbEntity>>

    @Query("SELECT * FROM sos_beacon_breadcrumbs WHERE beaconToken = :token ORDER BY timestampEpochMs DESC")
    suspend fun getBreadcrumbsByTokenList(token: String): List<SosBeaconBreadcrumbEntity>

    @Query("UPDATE sos_beacon_breadcrumbs SET deliveryStatus = :status, retryCount = :retryCount, lastAttemptEpochMs = :attemptMs WHERE id = :id")
    suspend fun updateDeliveryStatus(id: Long, status: String, retryCount: Int, attemptMs: Long)

    @Query("SELECT COUNT(*) FROM sos_beacon_breadcrumbs WHERE deliveryStatus = 'PENDING'")
    suspend fun countPending(): Int

    @Query("DELETE FROM sos_beacon_breadcrumbs WHERE timestampEpochMs < :cutoffEpochMs")
    suspend fun deleteExpiredBreadcrumbs(cutoffEpochMs: Long): Int

    @Query("DELETE FROM sos_beacon_breadcrumbs")
    suspend fun clearAll()
}
