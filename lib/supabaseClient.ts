// Client-side Supabase client. No auth for MVP — every write carries a
// session id from localStorage (see getSessionId below) instead of a real
// user id.
//
// FE note: this file expects to live inside the Next.js app so
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are available at
// build time. Drop it into the app's lib/ folder as-is.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_ID_KEY = "cpm_session_id";

/** Returns this browser's anonymous session id, creating one on first call. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}
