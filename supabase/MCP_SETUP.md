# Connect PURGATORY to an assistant (read-only)

PURGATORY now has a read-only MCP endpoint for an assistant to fetch the signed-in user's structured academic and workout records and access syllabus PDFs in private cloud storage. It uses the existing Supabase Auth account and the row-level security rules in `schema.sql`; it does not use a service-role key.

## What it can read

The MCP tools expose:
- Subject names, exams, modules, syllabus topics, academic tasks, DSA problems, and contest records from the synchronized PURGATORY state.
- Workout sessions, dates, notes, exercises, sets, metrics, and loads.
- Record counts and the last cloud-sync time.
- Syllabus PDF titles and short-lived private download links for files uploaded to Supabase Storage.

It does not expose daily health metrics or habits. PDF uploads preserve the browser copy. The assistant gets a 60-second private download link only when requesting a specific file. Keep an independent JSON export as a backup.

## 1. Finish cloud sync in PURGATORY

1. Open the live site and go to **Data → Cloud Synchronisation**.
2. Create or sign in to your PURGATORY account.
3. If the cloud is empty, choose **UPLOAD THIS BROWSER DATA** on the browser that has the records you want. Confirm the counts before accepting.
4. Choosing **UPLOAD THIS BROWSER DATA** also copies academic PDFs in this browser into your private Storage bucket. New academic PDFs upload automatically after cloud sync is active. Keep the exported JSON backup until you have verified the cloud copy.

## 2. Check the Supabase database

If not already done, apply `schema.sql` using the earlier [Supabase setup guide](SETUP.md). It creates the private state row, row-level security rules, and private file bucket.

## 3. Deploy the read-only MCP endpoint

Install the Supabase CLI, sign in, and deploy this function to the project already used by PURGATORY:

```sh
supabase login
supabase link --project-ref dfqbdopeprehdkxurqgp
supabase functions deploy purgatory-mcp
```

The function endpoint is:

```
https://dfqbdopeprehdkxurqgp.supabase.co/functions/v1/purgatory-mcp
```

The function's gateway JWT check is disabled only so OAuth metadata discovery can happen before sign-in. The function itself requires a valid Supabase user token, and all database and Storage operations use the signed-in user's RLS-scoped client.

## 4. Enable Supabase OAuth for the assistant

In the Supabase Dashboard, under **Authentication → OAuth Server**:

1. Enable the OAuth 2.1 server and dynamic client registration.
2. Set the authorization path to `/AI-assisted-projects/oauth/consent/`.
3. Check that the project's JWT signing key is asymmetric (ES256 or RS256). The MCP function's user-token middleware does not accept legacy HS256 tokens; review the effect on existing sessions before changing signing keys.
4. Under **Authentication → URL Configuration**, use `https://rvsbais21-git.github.io` as the Site URL. Allow the following redirect URLs:
   - `https://rvsbais21-git.github.io/AI-assisted-projects/`
   - `https://rvsbais21-git.github.io/AI-assisted-projects/oauth/consent/`

The consent page shows the connecting app name, requested scopes, and return address before the user approves or denies access. Existing PURGATORY sign-in is reused. Approved clients can be reviewed or revoked in Supabase's OAuth grants.

## 5. Connect the endpoint

In Codex, add the remote MCP server URL from this guide using the Codex MCP server settings/CLI. The endpoint uses Supabase OAuth; sign in with your PURGATORY account when prompted and approve the read-only request.

For ChatGPT on the web, use **Settings → Connectors → Add custom MCP server**, enter the endpoint above, and complete its OAuth approval flow. Availability depends on your ChatGPT plan and workspace settings.

After connecting, the assistant can call:
- `get_purgatory_overview`
- `get_academic_records`
- `get_workout_log`
- `list_syllabus_files`
- `get_syllabus_file` (returns a short-lived private download URL for the selected PDF)

The connector has no write tools. Each signed-in user can access only their own files. The current app does not automatically download cloud PDFs into another browser's IndexedDB; the assistant can access those cloud files through the two file tools. Do not put a service-role key, database password, or OAuth secret in this public repository.
