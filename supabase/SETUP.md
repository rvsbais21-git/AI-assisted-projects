# PURGATORY — Supabase setup

PURGATORY stores its main records in browser `localStorage` by default. The app now includes optional cloud sync with Supabase for cross-device access. Academic resource files remain in IndexedDB and are not yet cloud-synced.

## Current architecture

- `purgatory-v02` in localStorage is the browser's application dataset.
- Academic resource files are stored separately in IndexedDB database `purgatory-resources-v1`.
- Supabase holds one versioned JSONB state document per authenticated user and a private Storage bucket for a future file-sync stage.
- Row Level Security restricts each account to its own state and files.
- A compare-and-swap RPC prevents silent overwrites when two devices edit concurrently.

## 1. Confirm the Supabase project

The app is currently configured for the Supabase project `dfqbdopeprehdkxurqgp`. If this is your project, use it; do not create a second project unless you intend to move the app. Open Project Settings → API to confirm the project URL and Publishable key. A publishable key may be in the public website code; it must only be used with the RLS policies in this setup.

Never put a `service_role` or secret key in the website or GitHub.

## 2. Create the database and storage policies

If they are not already present:

1. Open SQL Editor in the Supabase dashboard.
2. Open `schema.sql` from this repository.
3. Paste the complete file into a new SQL query and run it.
4. Confirm that `public.purgatory_state` and the private `purgatory-files` bucket exist.

The SQL enables Row Level Security, restricts each account to its own row and files, and adds the optimistic-concurrency RPC.

## 3. Configure sign-in

In Supabase Authentication → URL Configuration, allow the PURGATORY site:

- Site URL: `https://rvsbais21-git.github.io/AI-assisted-projects/`
- Redirect URL: `https://rvsbais21-git.github.io/AI-assisted-projects/`

Use the same account on each device.

## 4. Turn on cloud sync

1. Keep an export of your local records using the app's **Data → EXPORT JSON** control.
2. In the app, open **Data → Cloud Synchronisation** and create or sign in to your account.
3. On the browser holding the records you want to keep, choose **UPLOAD THIS BROWSER DATA** and confirm the record counts.
4. On another device, sign in and choose **USE CLOUD DATA** to download the cloud copy.
5. Verify the records on both devices and keep the export as a backup.

Sync begins only after you choose the initial source. If the browser and cloud copies later diverge, sync pauses so neither copy is silently overwritten. Uploaded PDF resources are not included in this sync stage.

For automatic assistant access to the structured cloud records, follow [MCP_SETUP.md](MCP_SETUP.md).

## Credentials and backups

Use only the Project URL and Publishable key (or legacy anon key) in the website. Never put a service-role key, database password, OAuth client secret, or access token in PURGATORY or this public repository.

Supabase plans have usage limits and may have inactivity or pausing rules. Check current limits before relying on it as your only copy of the records, and keep regular exports.

## Safety checklist

- [ ] Supabase project confirmed
- [ ] SQL schema executed successfully
- [ ] Authentication redirect URLs configured
- [ ] Existing local JSON exported
- [ ] Cloud import preview matches local record counts
- [ ] Second device signs in and downloads the same dataset
- [ ] Two-device edit/conflict behavior checked
- [ ] Backup and restore tested
