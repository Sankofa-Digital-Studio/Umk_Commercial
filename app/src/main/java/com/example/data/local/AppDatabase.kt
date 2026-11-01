package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.local.dao.GuardianDao
import com.example.data.local.dao.IncidentDao
import com.example.data.local.dao.RegisteredContactDao
import com.example.data.local.dao.SafeJourneyDao
import com.example.data.local.dao.SosBeaconBreadcrumbDao
import com.example.data.local.dao.UserProfileDao
import com.example.data.local.entity.GuardianEntity
import com.example.data.local.entity.IncidentEntity
import com.example.data.local.entity.RegisteredContactEntity
import com.example.data.local.entity.SafeJourneyEntity
import com.example.data.local.entity.SosBeaconBreadcrumbEntity
import com.example.data.local.entity.UserProfileEntity

@Database(
    entities = [
        IncidentEntity::class,
        GuardianEntity::class,
        UserProfileEntity::class,
        SafeJourneyEntity::class,
        RegisteredContactEntity::class,
        SosBeaconBreadcrumbEntity::class
    ],
    version = 6,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun incidentDao(): IncidentDao
    abstract fun guardianDao(): GuardianDao
    abstract fun userProfileDao(): UserProfileDao
    abstract fun safeJourneyDao(): SafeJourneyDao
    abstract fun registeredContactDao(): RegisteredContactDao
    abstract fun sosBeaconBreadcrumbDao(): SosBeaconBreadcrumbDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "sankofa_safe_vault.db"
                )
                    .fallbackToDestructiveMigration(true)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
