import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing in environment variables.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Creates an authenticated Supabase client using Clerk's session token.
 * Passes the Clerk JWT with template 'supabase' and apikey in fetch headers.
 *
 * @param {import('@clerk/clerk-react').ActiveSessionResource | null} session
 */
export const createClerkSupabaseClient = (session) => {
  return createClient(supabaseUrl || "", supabaseKey || "", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (url, options = {}) => {
        const headers = new Headers(options?.headers);
        headers.set("apikey", supabaseKey || "");
        if (session) {
          try {
            const token = await session.getToken({ template: "supabase" });
            if (token) {
              headers.set("Authorization", `Bearer ${token}`);
            }
          } catch (error) {
            console.warn("Clerk Supabase token notice:", error?.message || error);
          }
        }
        return fetch(url, { ...options, headers });
      },
    },
  });
};
