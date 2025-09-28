import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend operations (has elevated permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Database types for our knowledge base
export interface DocumentChunk {
    id: string
    content: string
    embedding: number[]
    source_url: string
    source_title: string
    chunk_index: number
    created_at: string
}

export interface DocumentMatch extends DocumentChunk {
    similarity: number
}
