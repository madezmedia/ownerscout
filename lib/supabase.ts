import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase env vars not set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

// Server-side client using the service role key.
// Never expose this to the frontend – it bypasses RLS.
export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { persistSession: false }
});
