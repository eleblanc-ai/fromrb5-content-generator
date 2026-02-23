import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// ---- Database types --------------------------------------------------------

export type ContentType = 'flyer_text' | 'image' | 'tea_writeup' | 'communication'

export interface ContentItem {
  id: string
  type: ContentType
  prompt: string
  text_output: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: ContentItem
        Insert: Omit<ContentItem, 'id' | 'created_at'>
        Update: Partial<Omit<ContentItem, 'id' | 'created_at'>>
      }
    }
    Enums: {
      content_type: ContentType
    }
  }
}

// ---- Client singleton ------------------------------------------------------

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey
)
