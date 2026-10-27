import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zojwkdaiezebrpdobhwb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvandrZGFpZXplYnJwZG9iaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMzk4NTIsImV4cCI6MjEwODYxNTg1Mn0.Z9WnGMOmcxQdObdGNvwhBxO3_8-1IQKmzl2Ofn_U_bM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)