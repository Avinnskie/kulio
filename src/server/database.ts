import "server-only"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"

const filePath = path.resolve(/*turbopackIgnore: true*/ process.env["DATABASE_PATH"] ?? ".data/ruangtugas.db")
async function initialize() {
  await mkdir(path.dirname(filePath), { recursive: true })
  const client = createClient({ url: `file:${filePath}` })
  await client.executeMultiple(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS collab_users (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS collab_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES collab_users(id), expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS accounts (user_id TEXT PRIMARY KEY REFERENCES collab_users(id), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS personal_courses (
    user_id TEXT NOT NULL REFERENCES collab_users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(user_id,id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS personal_course_name ON personal_courses(user_id,name COLLATE NOCASE);
  CREATE TABLE IF NOT EXISTS personal_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES collab_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    due_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('belum_selesai','dikerjakan','selesai')),
    priority TEXT NOT NULL CHECK(priority IN ('rendah','sedang','tinggi')),
    progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100),
    notes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id,course_id) REFERENCES personal_courses(user_id,id) ON UPDATE CASCADE ON DELETE RESTRICT
  );
  CREATE TABLE IF NOT EXISTS collab_groups (id TEXT PRIMARY KEY, title TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES collab_users(id), invite_code TEXT NOT NULL, invite_hash TEXT NOT NULL UNIQUE, invite_expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS collab_members (group_id TEXT NOT NULL REFERENCES collab_groups(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES collab_users(id), role TEXT NOT NULL CHECK(role IN ('owner','member')), joined_at TEXT NOT NULL, PRIMARY KEY(group_id,user_id));
  CREATE TABLE IF NOT EXISTS collab_tasks (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES collab_groups(id) ON DELETE CASCADE, title TEXT NOT NULL, course_id TEXT NOT NULL, due_at TEXT NOT NULL, notes TEXT NOT NULL, priority TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES collab_users(id), all_members INTEGER NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS collab_assignments (task_id TEXT NOT NULL REFERENCES collab_tasks(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES collab_users(id), status TEXT NOT NULL CHECK(status IN ('belum_selesai','dikerjakan','selesai')), progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100), version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL REFERENCES collab_users(id), PRIMARY KEY(task_id,member_id));
  CREATE TABLE IF NOT EXISTS collab_reminders (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES collab_groups(id) ON DELETE CASCADE, task_id TEXT NOT NULL REFERENCES collab_tasks(id) ON DELETE CASCADE, from_id TEXT NOT NULL REFERENCES collab_users(id), to_id TEXT NOT NULL REFERENCES collab_users(id), message TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT);
  CREATE TABLE IF NOT EXISTS collab_limits (key TEXT PRIMARY KEY, started_at INTEGER NOT NULL, count INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS collab_member_user ON collab_members(user_id);
  CREATE INDEX IF NOT EXISTS collab_task_group ON collab_tasks(group_id);
  CREATE INDEX IF NOT EXISTS collab_inbox ON collab_reminders(to_id,created_at);
  CREATE INDEX IF NOT EXISTS personal_task_user_due ON personal_tasks(user_id,due_at);
`)
  return drizzle(client, { schema })
}
let ready: ReturnType<typeof initialize> | undefined

export async function database() {
  ready ??= initialize()
  return ready
}
