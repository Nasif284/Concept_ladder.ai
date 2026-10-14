import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing in environment variables.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

/**
 * Creates an authenticated Supabase client using Clerk's session token.
 * Passes the Clerk JWT with template 'supabase' in the Authorization header.
 *
 * @param {import('@clerk/clerk-react').ActiveSessionResource | null} session
 */
export const createClerkSupabaseClient = (session) => {
  return createClient(supabaseUrl || "", supabaseKey || "", {
    global: {
      headers: async () => {
        if (!session) return {};
        try {
          const token = await session.getToken({ template: "supabase" });
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (error) {
          console.error("Failed to retrieve Clerk Supabase token:", error);
          return {};
        }
      },
    },
  });
};
