import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_EXTERNAL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY_EXTERNAL

export const supabaseExternal = createClient(supabaseUrl, supabaseKey)

export default supabaseExternal
