// Re-export the SSR-aware browser client for backwards compatibility.
// All existing `import { supabase } from "@/lib/supabase"` continue to work.
export { supabaseBrowser as supabase } from "./supabase-browser";
