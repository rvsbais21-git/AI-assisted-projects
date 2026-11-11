package com.rvsbais.purgatorybridge

import android.content.ContentValues
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

class MainActivity : ComponentActivity() {
    private var pendingJson: String? = null
    private lateinit var status: TextView
    private lateinit var connectButton: Button
    private lateinit var exportButton: Button
    private var healthClient: HealthConnectClient? = null

    private val requestedPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class)
    )

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        val missing = requestedPermissions - granted
        status.text = if (missing.isEmpty()) {
            "All selected data permissions are granted. You can export a snapshot."
        } else {
            "Some permissions were not granted. Only authorised data types will be included."
        }
        exportButton.isEnabled = true
    }

    private val createDocument = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri: Uri? ->
        val json = pendingJson
        pendingJson = null
        if (uri == null || json == null) {
            status.text = "Export cancelled."
            return@registerForActivityResult
        }
        try {
            contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(json) }
                ?: error("Could not open the selected destination.")
            status.text = "Export saved. Open PURGATORY in your browser and import this JSON file."
        } catch (error: Exception) {
            status.text = "Could not save export: ${error.localizedMessage}"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        refreshAvailability()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 36, 28, 28)
            setBackgroundColor(android.graphics.Color.rgb(12, 12, 16))
        }
        val scroll = ScrollView(this)
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.TOP
        }
        fun text(value: String, size: Float, color: Int, bold: Boolean = false): TextView =
            TextView(this).apply {
                this.text = value
                textSize = size
                setTextColor(color)
                if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
                setPadding(0, 0, 0, 18)
            }
        val white = android.graphics.Color.rgb(242, 238, 240)
        val muted = android.graphics.Color.rgb(165, 160, 170)
        content.addView(text("PURGATORY", 30f, white, true))
        content.addView(text("HEALTH CONNECT BRIDGE / 0.1", 12f, android.graphics.Color.rgb(220, 75, 98), true))
        content.addView(text(
            "Read-only access to the health data you choose to share. Nothing is uploaded to a server.",
            15f, muted
        ))
        status = text("Checking Health Connect availability…", 14f, white)
        content.addView(status)

        connectButton = Button(this).apply {
            this.text = "CONNECT / REVIEW PERMISSIONS"
            setOnClickListener { requestAccess() }
        }
        content.addView(connectButton, match())
        exportButton = Button(this).apply {
            this.text = "EXPORT HEALTH DATA JSON"
            isEnabled = false
            setOnClickListener { exportHealthData() }
        }
        content.addView(exportButton, match())
        content.addView(text(
            "Included data: daily steps, sleep sessions, exercise sessions, heart-rate samples, and weight records. " +
                "The first version reads up to the last 30 days. Permissions can be changed in Health Connect settings.",
            13f, muted
        ))
        content.addView(text(
            "TRANSFER: Save the JSON file, open PURGATORY, go to Data → Health Connect Import, and select the file.",
            13f, white, true
        ))
        scroll.addView(content)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)
    }

    private fun match() = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = 18 }

    private fun refreshAvailability() {
        when (HealthConnectClient.getSdkStatus(this)) {
            HealthConnectClient.SDK_AVAILABLE -> {
                healthClient = HealthConnectClient.getOrCreate(this)
                status.text = "Health Connect is available. Review permissions before reading data."
                connectButton.isEnabled = true
            }
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                status.text = "Install or update Health Connect, then return here."
                connectButton.isEnabled = false
            }
            else -> {
                status.text = "Health Connect is not available on this device."
                connectButton.isEnabled = false
            }
        }
    }

    private fun requestAccess() {
        val client = healthClient ?: return refreshAvailability()
        lifecycleScope.launch {
            try {
                val alreadyGranted = client.permissionController.getGrantedPermissions()
                val missing = requestedPermissions - alreadyGranted
                if (missing.isEmpty()) {
                    status.text = "Permissions already granted."
                    exportButton.isEnabled = true
                } else {
                    permissionLauncher.launch(missing)
                }
            } catch (error: Exception) {
                status.text = "Could not check permissions: ${error.localizedMessage}"
            }
        }
    }

    private suspend inline fun <reified T : Record> readRecordsSince(
        client: HealthConnectClient,
        start: Instant,
        end: Instant
    ): List<T> {
        val output = mutableListOf<T>()
        var pageToken: String? = null
        do {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = T::class,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    pageToken = pageToken
                )
            )
            output += response.records
            pageToken = response.pageToken
        } while (pageToken != null)
        return output
    }

    private fun exportHealthData() {
        val client = healthClient ?: return refreshAvailability()
        lifecycleScope.launch {
            exportButton.isEnabled = false
            status.text = "Reading authorised records…"
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val start = Instant.now().minus(30, ChronoUnit.DAYS)
                val end = Instant.now()
                val zone = ZoneId.systemDefault()
                val records = JSONArray()

                if (HealthPermission.getReadPermission(StepsRecord::class) in granted) {
                    val steps = readRecordsSince<StepsRecord>(client, start, end)
                    val byDay = steps.groupBy { it.startTime.atZone(zone).toLocalDate().toString() }
                    byDay.forEach { (date, dayRecords) ->
                        val total = dayRecords.sumOf { it.count }
                        records.put(JSONObject()
                            .put("id", "steps:$date")
                            .put("type", "steps_daily")
                            .put("date", date)
                            .put("value", total)
                            .put("unit", "steps")
                            .put("source", "Health Connect"))
                    }
                }
                if (HealthPermission.getReadPermission(SleepSessionRecord::class) in granted) {
                    readRecordsSince<SleepSessionRecord>(client, start, end).forEach { record ->
                        records.put(JSONObject()
                            .put("id", "sleep:${record.metadata.id}")
                            .put("type", "sleep_session")
                            .put("startTime", record.startTime.toString())
                            .put("endTime", record.endTime.toString())
                            .put("startDate", record.startTime.atZone(zone).toLocalDate().toString())
                            .put("durationMinutes", ChronoUnit.MINUTES.between(record.startTime, record.endTime))
                            .put("sourceApp", record.metadata.dataOrigin.packageName))
                    }
                }
                if (HealthPermission.getReadPermission(ExerciseSessionRecord::class) in granted) {
                    readRecordsSince<ExerciseSessionRecord>(client, start, end).forEach { record ->
                        records.put(JSONObject()
                            .put("id", "exercise:${record.metadata.id}")
                            .put("type", "exercise_session")
                            .put("startTime", record.startTime.toString())
                            .put("endTime", record.endTime.toString())
                            .put("date", record.startTime.atZone(zone).toLocalDate().toString())
                            .put("exerciseType", record.exerciseType)
                            .put("sourceApp", record.metadata.dataOrigin.packageName))
                    }
                }
                if (HealthPermission.getReadPermission(HeartRateRecord::class) in granted) {
                    readRecordsSince<HeartRateRecord>(client, start, end).forEach { record ->
                        record.samples.forEachIndexed { index, sample ->
                            records.put(JSONObject()
                                .put("id", "heart-rate:${record.metadata.id}:$index")
                                .put("type", "heart_rate_sample")
                                .put("time", sample.time.toString())
                                .put("date", sample.time.atZone(zone).toLocalDate().toString())
                                .put("beatsPerMinute", sample.beatsPerMinute)
                                .put("sourceApp", record.metadata.dataOrigin.packageName))
                        }
                    }
                }
                if (HealthPermission.getReadPermission(WeightRecord::class) in granted) {
                    readRecordsSince<WeightRecord>(client, start, end).forEach { record ->
                        records.put(JSONObject()
                            .put("id", "weight:${record.metadata.id}")
                            .put("type", "weight")
                            .put("time", record.time.toString())
                            .put("date", record.time.atZone(zone).toLocalDate().toString())
                            .put("kilograms", record.weight.inKilograms)
                            .put("sourceApp", record.metadata.dataOrigin.packageName))
                    }
                }

                val payload = JSONObject()
                    .put("schema", "purgatory.health-connect.v1")
                    .put("exportedAt", Instant.now().toString())
                    .put("rangeStart", start.toString())
                    .put("rangeEnd", end.toString())
                    .put("recordCount", records.length())
                    .put("records", records)
                pendingJson = payload.toString(2)
                status.text = "Prepared ${records.length()} records. Choose where to save the JSON export."
                createDocument.launch("purgatory-health-connect-${LocalDate.now()}.json")
            } catch (error: Exception) {
                status.text = "Export failed: ${error.localizedMessage}"
            } finally {
                exportButton.isEnabled = true
            }
        }
    }
}
