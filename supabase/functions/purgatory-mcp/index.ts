import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@^2.0.0'
import { pipeline } from 'npm:@supabase/middleware@1'
import { withOAuthProtectedResource, withSupabase } from 'npm:@supabase/server@1'
import { z } from 'npm:zod@^4.3.6'

type JsonRecord = Record<string, unknown>

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function matches(record: JsonRecord, query: string): boolean {
  return JSON.stringify(record).toLocaleLowerCase().includes(query.toLocaleLowerCase())
}

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] }
}

Deno.serve(
  pipeline(
    [
      // Advertise the OAuth resource metadata before the user-token check.
      withOAuthProtectedResource(),
      // Every data query runs as the signed-in user and is constrained by RLS.
      withSupabase({ auth: 'user' }),
    ],
    async (req, { supabase, userClaims }) => {
      const handler = createMcpHandler(() => {
        const server = new McpServer({ name: 'purgatory-read-only', version: '1.0.0' })

        const loadState = async () => {
          const { data, error } = await supabase
            .from('purgatory_state')
            .select('data, version, updated_at')
            .maybeSingle()

          if (error) throw new Error(`Could not read PURGATORY data: ${error.message}`)
          return {
            data: (data?.data ?? {}) as Record<string, unknown>,
            version: data?.version ?? null,
            updated_at: data?.updated_at ?? null,
          }
        }

        server.registerTool(
          'list_syllabus_files',
          {
            title: 'List syllabus files',
            description: 'List PDF resources the signed-in user has uploaded to PURGATORY private cloud storage.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async () => {
            const userId = typeof userClaims?.sub === 'string' ? userClaims.sub : ''
            if (!userId) throw new Error('Authentication required.')
            const folder = `${userId}/syllabus`
            const { data, error } = await supabase.storage
              .from('purgatory-files')
              .list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
            if (error) throw new Error(`Could not list syllabus files: ${error.message}`)
            return result({
              files: (data ?? []).filter((file) => file.name.endsWith('.pdf')).map((file) => ({
                id: file.name.replace(/\\.pdf$/i, ''),
                title: typeof file.metadata?.title === 'string' ? file.metadata.title : file.name,
                size_bytes: file.metadata?.size ?? null,
                uploaded_at: file.created_at ?? null,
              })),
            })
          },
        )

        server.registerTool(
          'get_syllabus_file',
          {
            title: 'Get syllabus file',
            description: 'Create a short-lived private download link for one syllabus PDF. Use the link to read the document; it expires after 60 seconds.',
            inputSchema: z.object({
              id: z.string().uuid().describe('The file id returned by list_syllabus_files.'),
            }),
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async ({ id }) => {
            const userId = typeof userClaims?.sub === 'string' ? userClaims.sub : undefined
            if (!userId) throw new Error('Authentication required.')
            const path = `${userId}/syllabus/${id}.pdf`
            const { data, error } = await supabase.storage
              .from('purgatory-files')
              .createSignedUrl(path, 60)
            if (error || !data?.signedUrl) throw new Error(`Could not open syllabus file: ${error?.message ?? 'File not found.'}`)
            return result({ id, expires_in_seconds: 60, download_url: data.signedUrl })
          },
        )

        server.registerTool(
          'get_purgatory_overview',
          {
            title: 'Get PURGATORY overview',
            description: 'Read counts and sync freshness for the signed-in user’s academic, workout, and private syllabus-file records. Does not return daily health metrics or habits.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async () => {
            const state = await loadState()
            const subjects = records(state.data.subjects)
            const tasks = records(state.data.tasks)
            const problems = records(state.data.problems)
            const contests = records(state.data.contests)
            const workouts = records(state.data.workouts)
            const upcomingExams = subjects
              .map((subject) => ({ subject: subject.name, date: subject.exam }))
              .filter((exam) => typeof exam.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(exam.date))
              .sort((a, b) => String(a.date).localeCompare(String(b.date)))
              .slice(0, 10)

            return result({
              updated_at: state.updated_at,
              counts: {
                subjects: subjects.length,
                academic_tasks: tasks.length,
                problems: problems.length,
                contests: contests.length,
                workouts: workouts.length,
              },
              upcoming_exams: upcomingExams,
              note: 'PDF contents can be read using list_syllabus_files and get_syllabus_file when files have been uploaded to private cloud storage.',
            })
          },
        )

        server.registerTool(
          'get_academic_records',
          {
            title: 'Get academic records',
            description: 'Read subjects, syllabus topics, academic tasks, and DSA practice records from the signed-in user’s PURGATORY cloud data.',
            inputSchema: z.object({
              query: z.string().trim().max(120).optional().describe('Optional text to match in a record, such as a subject, module, topic, or task.'),
              limit: z.number().int().min(1).max(100).default(50).describe('Maximum records per category.'),
            }),
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async ({ query = '', limit }) => {
            const state = await loadState()
            const categories = ['subjects', 'tasks', 'problems', 'contests'] as const
            const output: Record<string, { total: number; returned: number; items: JsonRecord[] }> = {}

            for (const category of categories) {
              const all = records(state.data[category])
              const filtered = query ? all.filter((record) => matches(record, query)) : all
              output[category] = {
                total: filtered.length,
                returned: Math.min(filtered.length, limit),
                items: filtered.slice(0, limit),
              }
            }

            return result({ updated_at: state.updated_at, query: query || null, records: output })
          },
        )

        server.registerTool(
          'get_workout_log',
          {
            title: 'Get workout log',
            description: 'Read workout sessions for the signed-in user. Daily health metrics and habits are not exposed by this tool.',
            inputSchema: z.object({
              from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Include sessions on or after this date (YYYY-MM-DD).'),
              to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Include sessions on or before this date (YYYY-MM-DD).'),
              limit: z.number().int().min(1).max(100).default(30).describe('Maximum number of sessions to return.'),
            }),
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async ({ from, to, limit }) => {
            const state = await loadState()
            const all = records(state.data.workouts)
            const filtered = all
              .filter((workout) => {
                const date = typeof workout.date === 'string' ? workout.date : ''
                return (!from || date >= from) && (!to || date <= to)
              })
              .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))

            return result({
              updated_at: state.updated_at,
              total: filtered.length,
              returned: Math.min(filtered.length, limit),
              sessions: filtered.slice(0, limit),
            })
          },
        )

        return server
      })

      return handler.fetch(req)
    },
  ),
)
