import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://vdztquuwphfxuuzepvno.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkenRxdXV3cGhmeHV1emVwdm5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkzMjc4MiwiZXhwIjoyMDc5NTA4NzgyfQ.ETM3ra8OPp_EJ_ymjbIzg4c8wBFbbz_jdmWqIuRrb1s'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-application-name': 'zeladoria-ld-backend',
    },
  },
})

export type SupabaseAdminClient = typeof supabaseAdmin