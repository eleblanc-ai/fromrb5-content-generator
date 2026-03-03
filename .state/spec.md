# Product Spec

**Created:** 2026-02-22
**Last Updated:** 2026-03-03
**Status:** Approved (V2 revision)

## Overview

A flyer creation studio for a tea business that outputs **actual final flyer assets** (not just copy guidance) for social formats. The app generates and edits flyer variants for Instagram Post and Instagram Story, supports two rendering modes (AI fully composed or programmatic text overlay), organises work into **isolated per-flyer threads** (ChatGPT/Claude style), and persists a **brand kit** that auto-applies to every generation.

## Goals

- Produce publish-ready flyer creatives quickly for Instagram Post and Story
- Collect all refinement work for a single flyer into one isolated thread (not a flat history list)
- Enable true back-and-forth conversational refinement within each thread
- Apply consistent brand identity (colors, logo, fonts, name/tagline) to every generated flyer automatically

## Target Users

- Solo user: tea business owner (technical)

## Core Features

1. **Flyer brief form (full brief, required)**
  - Inputs: campaign goal, product/tea name, key details, CTA, brand style controls (tone/color/font vibe), format constraints
2. **Supported formats**
  - Instagram Post (square 1080×1080)
  - Instagram Story (vertical 1080×1920)
3. **Two flyer rendering modes**
  - **Mode A:** AI-generated final flyer image (text baked into generated image)
  - **Mode B:** AI background generation + programmatic text overlay (Canvas 2D, deterministic)
4. **Variant generation and refinement**
  - 3 variants per format, per generation turn
  - Quick regenerate for a selected variant
  - Editable copy fields (headline/tagline/body/CTA) + re-render final flyer
5. **Output and export**
  - Download PNG per variant
  - Export package (zip of all variants)
6. **Thread-based navigation (V2)**
  - Each flyer brief creates an isolated thread
  - ChatGPT/Claude-style sidebar lists all threads by title + date
  - Selecting a thread shows its full history in the main panel
  - New thread button starts a fresh brief
7. **Conversational refinement within threads (V2)**
  - Chat input in thread detail view
  - User messages ("make it more minimal") → `generate-flyer` called with thread history as context → new flyer variants appended to thread
  - Both user message and assistant response (new flyer) stored as `messages` rows
8. **Brand kit (V2)**
  - Brand settings panel (accessible from header)
  - Settings: brand name, brand tagline, color palette (up to 5 hex values), font preference, logo upload
  - Persisted in `brand_settings` Supabase table
  - Auto-injected into every `generate-flyer` call (Claude prompt + Gemini visual prompt)
  - Logo overlaid onto Mode B canvas output (bottom-right corner)

## Constraints

- Personal tool, no auth required (single user)
- API keys (Anthropic, Gemini) stored as Supabase Edge Function secrets, never committed
- Supabase credentials stored in `.env` for frontend client, never committed
- AI calls handled by Supabase Edge Functions (keys stay server-side)
- Frontend deployable to Vercel (static); Edge Functions deployed to Supabase
- Local dev: `supabase start` + `npm run dev`

## Architecture

- **Language:** TypeScript (frontend); TypeScript/Deno (Edge Functions)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Database/Storage:** Supabase (Postgres for briefs/variants metadata, Storage for flyer image assets, logo, and zip exports)
- **AI:**
  - Text generation: Anthropic Claude (`claude-sonnet-4-5`) for structured flyer copy variants
  - Image generation: Google Gemini (`gemini-3-pro-image-preview`) for flyer background or fully composed flyers
- **Rendering:**
  - Mode A: image model returns final composed flyer
  - Mode B: app applies deterministic text overlay on generated background using format-specific layout templates; logo drawn via Canvas 2D
- **API layer:** Supabase Edge Functions in `supabase/functions/`
- **Project structure:** Feature-based, per `cosmo-instructions/architecture.md`
- **Verification command:** `npm run verify`
- **Local dev:** `supabase start` + `npm run dev`

## Data Model

### `content_items` (existing)
- `id` — uuid, primary key
- `type` — enum (tea_writeup | image | flyer_text)
- `prompt` — text
- `text_output` — text (nullable; serialized copy blocks + flyer metadata)
- `image_url` — text (nullable; flyer asset URL)
- `parent_id` — uuid (nullable; lineage for regenerate/edit)
- `created_at` — timestamp

### `threads` (V2)
- `id` — uuid, primary key
- `title` — text (first few words of brief prompt)
- `format` — text (instagram_post | instagram_story)
- `render_mode` — text (ai_composed | overlay)
- `created_at` — timestamp

### `messages` (V2)
- `id` — uuid, primary key
- `thread_id` — uuid FK → threads
- `role` — text (user | assistant)
- `content` — text (user prompt text or assistant status message)
- `flyer_item_id` — uuid FK → content_items (nullable; links to the flyer row for assistant turns)
- `created_at` — timestamp

### `brand_settings` (V2, singleton)
- `id` — uuid, primary key
- `brand_name` — text
- `brand_tagline` — text
- `color_palette` — text[] (hex values, up to 5)
- `font_preference` — text
- `logo_url` — text (nullable; Supabase Storage URL)

## Style

- **Aesthetic:** Minimal editorial, premium tea-brand look
- **Color palette:** Cool tones with soft violets + clean neutrals
- **Typography:** Clean sans-serif, readable for social graphics
- **UI density:** Spacious
- **Tone:** Premium, calm, intentional

## Stack

- **Stack file:** cosmo-instructions/stacks/react-vite-supabase.md

## GitHub Integration

- **GitHub integration:** enabled (account: eleblanc-ai)
