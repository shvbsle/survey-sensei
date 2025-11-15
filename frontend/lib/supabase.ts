import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for frontend (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback to regular client if service key not available

// Type definitions for database tables
export type Product = {
  item_id: string
  title: string
  description?: string
  brand?: string
  price?: number
  source_platform?: string
  pictures?: string[]
  tags?: string[]
  embeddings?: number[]
  average_rating?: number
  review_count?: number
  created_at: string
  updated_at: string
}

export type User = {
  user_id: string
  email_id: string
  age?: number
  gender?: string
  location?: string
  base_zip?: string
  credit_score?: number
  total_spending?: number
  embeddings?: number[]
  created_at: string
  updated_at: string
}

export type Transaction = {
  transaction_id: string
  item_id: string
  user_id: string
  order_date: string
  actual_price: number
  discounted_price?: number
  delivery_date?: string
  transaction_status: string
  created_at: string
  updated_at: string
}

export type Review = {
  review_id: string
  item_id: string
  user_id: string
  transaction_id: string
  timestamp: string
  review_title?: string
  review_text: string
  review_stars: number
  manual_or_agent_generated: string
  embeddings?: number[]
  created_at: string
  updated_at: string
}

export type Survey = {
  scenario_id: string
  item_id: string
  user_id: string
  transaction_id: string
  survey_id?: string
  question_id: string
  question_number: number
  question: string
  options_object?: Record<string, any>
  selected_option?: string
  correctly_anticipates_user_sentiment?: boolean
  created_at: string
  updated_at: string
}

export type SurveySession = {
  session_id: string
  scenario_id: string
  user_id: string
  item_id: string
  total_questions: number
  questions_answered: number
  session_context?: Record<string, any>
  agent_metrics?: Record<string, any>
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}
