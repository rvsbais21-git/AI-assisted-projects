# PURGATORY — Supabase setup

This directory contains the first, non-destructive stage of the cross-device sync migration.

## Current architecture

- `index.html` remains the existing app. Browser data remains the active source until cloud migration is configured and verified.
- `purgatory-v02` in localStorage is the current application dataset.
- Academic resource files are stored separately in IndexedDB database `purgatory-resources-v1`.
- Supabase will hold one versioned JSONB state document per authenticated user and private resource files in Storage.
- A compare-and-swap RPC prevents silent overwrites when two devices edit concurrently.

## 1. Create a Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Choose a strong database password and keep it private.
3. Wait for provisioning to finish.
4. Open Project Settings → API and copy the Project URL and Publishable key (older projects may call this the anon key).
5. Never put a service_role or secret key in the website or GitHub.

## 2. Create the database and storage policies

1. Open SQL Editor in the Supabase dashboard.
2. Open `schema.sql` from this repository.
3. Paste the complete file into a new SQL query and run it.
4. Confirm that `public.purgatory_state` and the private `purgatory-files` bucket exist.

The SQL enables Row Level Security, restricts each account to its own row and files, and adds an optimistic-concurrency RPC.

## 3. Configure authentication

For the first rollout, use email/password authentication with email confirmation. Add the PURGATORY site to Authentication → URL Configuration:

- Site URL: `https://rvsbais21-git.github.io/AI-assisted-projects/`
- Redirect URL: `https://rvsbais21-git.github.io/AI-assisted-projects/`

Use the same account on each device.

## 4. Do not migrate data yet

Do not clear browser storage, uninstall the browser, or use PURGATORY's Reset button during migration.

The next implementation stage will add sign-in, one-time local-to-cloud import with preview and confirmation, automatic upload, initial download on new devices, realtime notifications, conflict handling, and IndexedDB PDF migration.

The app must not sync until the user signs in and explicitly confirms the initial import. This prevents an empty device from overwriting an existing dataset.

## 5. Credentials

When the app integration is ready, enter only the Project URL and Publishable key (or legacy anon key). Never enter a service-role key, database password, OAuth client secret, or access token into PURGATORY.

## Pricing

Supabase has a free plan with usage limits. Check current plan limits, pausing/inactivity rules and usage before relying on it as the only copy of records. Keep regular exports.

## Migration safety checklist

- [ ] Supabase project created
- [ ] SQL schema executed successfully
- [ ] Auth URL configured
- [ ] Project URL and publishable key copied
- [ ] Existing local JSON exported
- [ ] IndexedDB resources exported or migrated
- [ ] Cloud import preview matches local record counts
- [ ] Second device signs in and downloads the same dataset
- [ ] Two-device edit/conflict test passed
- [ ] Backup and restore tested
