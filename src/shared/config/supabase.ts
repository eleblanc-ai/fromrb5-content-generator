import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// ---- Database types --------------------------------------------------------

export type ContentType = 'flyer_text' | 'image' | 'tea_writeup' | 'communication'

export type FlyerFormat = 'instagram_post' | 'instagram_story'

export type FlyerRenderMode = 'ai_composed' | 'overlay'

export interface FlyerBrief {
  campaignGoal: string
  productName: string
  keyDetails: string
  cta: string
  tone: string
  colorVibe: string
  fontVibe: string
  formatConstraints: string
  format: FlyerFormat
  renderMode: FlyerRenderMode
}

export interface FlyerCopyBlock {
  headline: string
  tagline: string
  body: string
  cta: string
}

export interface FlyerGenerationRequest {
  type: 'flyer_text'
  prompt: string
  flyer: FlyerBrief
  copyOverride?: FlyerCopyBlock
  parentId?: string
  refinementMessage?: string
}

export interface ContentItem {
  id: string
  type: ContentType
  prompt: string
  text_output: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string
}

export interface Thread {
  id: string
  title: string
  format: FlyerFormat
  render_mode: FlyerRenderMode
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  content: string
  flyer_item_id: string | null
  created_at: string
}

export interface BrandSettings {
  id: string
  brand_name: string
  brand_tagline: string
  color_palette: string[]
  font_preference: string
  logo_url: string | null
}

export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: ContentItem
        Insert: Omit<ContentItem, 'id' | 'created_at'>
        Update: Partial<Omit<ContentItem, 'id' | 'created_at'>>
        Relationships: []
      }
      threads: {
        Row: Thread
        Insert: Omit<Thread, 'id' | 'created_at'>
        Update: Partial<Omit<Thread, 'id' | 'created_at'>>
        Relationships: []
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
        Relationships: []
      }
      brand_settings: {
        Row: BrandSettings
        Insert: Omit<BrandSettings, 'id'>
        Update: Partial<Omit<BrandSettings, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
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
