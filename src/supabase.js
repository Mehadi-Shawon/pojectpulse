import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://muaqjidyvdqyjzaaucqp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YXFqaWR5dmRxeWp6YWF1Y3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDk0NTksImV4cCI6MjA4OTM4NTQ1OX0.AlPnUnJSSNB2zd8Qr20p-DKfpF4Dug8NyDX9E0RPx88' // paste full key here

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)