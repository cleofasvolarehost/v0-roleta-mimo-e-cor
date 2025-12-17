import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vsohqwhskvuvcvgkyilx.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzb2hxd2hza3Z1dmN2Z2t5aWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDIzOTYsImV4cCI6MjA4MTQ3ODM5Nn0.4MnIoi-qvg596DjZtNYiexrwrHVWVUF281c8c3aMrgQ"

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}