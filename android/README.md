# PURGATORY Health Connect companion

This is a minimal Android companion for the existing PURGATORY GitHub Pages dashboard. It reads selected Health Connect records and exports a versioned JSON file. It does not upload data or replace the dashboard.

## Included in v0.1

- Read-only permissions for steps, sleep sessions, exercise sessions, heart-rate samples, and weight.
- Explicit user-triggered export.
- A 30-day initial read window.
- JSON file saved through Android's document picker.
- No account, backend, analytics SDK, or network permission.

## Build

1. Open the repository's `android/` folder in Android Studio.
2. Allow Gradle sync and install the Android SDK platform/build tools requested by the project.
3. Run the `app` configuration on an Android device with Health Connect available.
4. Review and grant only the Health Connect data permissions you want to share.

Android 14+ includes Health Connect as a system component. On Android 13 and lower, install the Health Connect app from Google Play first.

## Transfer into PURGATORY

1. In the companion, tap **EXPORT HEALTH DATA JSON**.
2. Save the generated file.
3. Open the PURGATORY dashboard in the same browser where you keep your records.
4. Go to **Data → Health Connect Import**.
5. Select the file, review the record counts, and explicitly confirm the merge.

The dashboard stores imported records in a separate `healthConnectRecords` collection in its existing local database. Existing manually entered workouts and daily metrics are not overwritten.

## Important

- Health Connect permissions can be revoked at any time.
- The companion rechecks granted permissions before each export.
- The first version reads up to 30 days of records.
- Steps are grouped by calendar day using the device's local time zone. Multiple source records on a day are summed; if multiple apps write overlapping step records, the total may overcount. Review this limitation when comparing sources.
- The app is a source prototype. It must be built and tested on a real Android device before relying on it.
