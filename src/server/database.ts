import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { z } from "zod"
import * as schema from "./schema"

const DatabaseEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().regex(/^postgres(?:ql)?:\/\//u),
})

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL harus berisi connection string PostgreSQL.")
    this.name = "DatabaseConfigurationError"
  }
}

function databaseUrl(): string {
  const environment = DatabaseEnvironmentSchema.safeParse(process.env)
  if (!environment.success) throw new DatabaseConfigurationError()
  return environment.data.DATABASE_URL
}

let queryClient: ReturnType<typeof postgres> | undefined

function databaseClient() {
  queryClient ??= postgres(databaseUrl(), {
    max: 1,
    prepare: false,
    ssl: "require",
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return queryClient
}

async function initialize() {
  const client = databaseClient()
  await client.unsafe(`
      BEGIN;
      CREATE SCHEMA IF NOT EXISTS kulio;
      CREATE TABLE IF NOT EXISTS kulio.collab_users (
        id TEXT PRIMARY KEY, display_name TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        expires_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kulio.accounts (
        user_id TEXT PRIMARY KEY REFERENCES kulio.collab_users(id),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kulio.personal_courses (
        user_id TEXT NOT NULL REFERENCES kulio.collab_users(id) ON DELETE CASCADE,
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(user_id,id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS personal_course_name
        ON kulio.personal_courses(user_id, lower(btrim(name)));
      CREATE TABLE IF NOT EXISTS kulio.personal_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES kulio.collab_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        course_id TEXT NOT NULL,
        due_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('belum_selesai','dikerjakan','selesai')),
        priority TEXT NOT NULL CHECK(priority IN ('rendah','sedang','tinggi')),
        progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100),
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(user_id,course_id) REFERENCES kulio.personal_courses(user_id,id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_groups (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        invite_code TEXT NOT NULL,
        invite_hash TEXT NOT NULL UNIQUE,
        invite_expires_at BIGINT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_members (
        group_id TEXT NOT NULL REFERENCES kulio.collab_groups(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        role TEXT NOT NULL CHECK(role IN ('owner','member')),
        joined_at TEXT NOT NULL,
        PRIMARY KEY(group_id,user_id)
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_tasks (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES kulio.collab_groups(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        course_id TEXT NOT NULL,
        due_at TEXT NOT NULL,
        notes TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES kulio.collab_users(id),
        all_members BOOLEAN NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_assignments (
        task_id TEXT NOT NULL REFERENCES kulio.collab_tasks(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        status TEXT NOT NULL CHECK(status IN ('belum_selesai','dikerjakan','selesai')),
        progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100),
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL REFERENCES kulio.collab_users(id),
        PRIMARY KEY(task_id,member_id)
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_reminders (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES kulio.collab_groups(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL REFERENCES kulio.collab_tasks(id) ON DELETE CASCADE,
        from_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        to_id TEXT NOT NULL REFERENCES kulio.collab_users(id),
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read_at TEXT
      );
      CREATE TABLE IF NOT EXISTS kulio.collab_limits (
        key TEXT PRIMARY KEY, started_at BIGINT NOT NULL, count INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS collab_member_user ON kulio.collab_members(user_id);
      CREATE INDEX IF NOT EXISTS collab_task_group ON kulio.collab_tasks(group_id);
      CREATE INDEX IF NOT EXISTS collab_inbox ON kulio.collab_reminders(to_id,created_at);
      CREATE INDEX IF NOT EXISTS personal_task_user_due ON kulio.personal_tasks(user_id,due_at);
      COMMIT;
  `)
  return drizzle(client, { schema })
}

let ready: ReturnType<typeof initialize> | undefined

export async function database() {
  ready ??= initialize()
  try {
    return await ready
  } catch (error: unknown) {
    ready = undefined
    throw error
  }
}
