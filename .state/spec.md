# Product Spec

**Created:** 2026-02-22
**Last Updated:** 2026-02-22
**Status:** Draft (Phase 1 Interview)

## Overview

A personal web app for generating AI-powered marketing and product content for a tea business. The user describes what they need in a freeform prompt, selects a content type, and the app generates the content using Claude (text) or Gemini (images). All generated content (text and images) is saved to Supabase for browsing and reuse. Designed for local development with eventual deployment to Vercel.

## Goals

- Quickly generate high-quality content for the tea business without context-switching to other tools
- Maintain a searchable/browsable history of all generated content
- Support multiple content types from a single interface

## Target Users

- Solo user: the tea business owner (technical)

## Core Features

1. **Freeform content generation** — user provides a free-text prompt describing what they need; app generates content using Claude (text) or Gemini (images)
2. **Content types:**
   - **Flyer text** — marketing copy and layout text for print or digital flyers
   - **Images** — AI-generated images for flyers, product labels, and Instagram posts (`gemini-3-pro-image-preview`)
   - **Tea writeups** — product descriptions for individual teas (flavor notes, origin, etc.)
   - **Communications** — emails and social media captions (Instagram, etc.)
3. **Image iteration** — after generating an image, user can give follow-up instructions ("make it warmer", "add text overlay", etc.) to refine it; each iteration is saved to history
4. **Content history** — browsable library of all previously generated content (text and images), stored in Supabase
5. **Copy/download** — copy text to clipboard or download generated images

## Constraints

- Personal tool, no auth required (single user)
- API keys (Anthropic, Gemini) stored as Supabase Edge Function secrets, never committed
- Supabase credentials stored in `.env` for the frontend client, never committed
- AI calls handled by Supabase Edge Functions (keys stay server-side)
- Frontend deployable to Vercel (static); Edge Functions deployed to Supabase
- Local dev: `supabase start` + `npm run dev`

## Architecture

- **Language:** TypeScript (frontend); TypeScript/Deno (Edge Functions)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Database/Storage:** Supabase (Postgres for content records, Storage bucket for images)
- **AI:**
  - Text generation: Anthropic Claude (`claude-sonnet-4-5`) via `npm:@anthropic-ai/sdk` — called from Supabase Edge Function
  - Image generation: Google Gemini (`gemini-3-pro-image-preview`) via `npm:@google/generative-ai` — called from Supabase Edge Function
- **API layer:** Supabase Edge Functions in `supabase/functions/` (Deno runtime, `npm:` specifiers for packages)
- **Project structure:** Feature-based, per `cosmo-instructions/architecture.md`
- **Verification command:** `npm run verify`
- **Local dev:** `supabase start` + `npm run dev`

## Data Model

### `content_items` table (Supabase)
- `id` — uuid, primary key
- `type` — enum: `flyer_text` | `image` | `tea_writeup` | `communication`
- `prompt` — text (user's input prompt)
- `text_output` — text (nullable, for text content)
- `image_url` — text (nullable, Supabase Storage URL for images)
- `parent_id` — uuid (nullable, references `content_items.id` — for image iterations)
- `created_at` — timestamp

## Style

- **Aesthetic:** Minimal editorial — clean layouts, generous whitespace, clear typographic hierarchy
- **Color palette:** Cool tones with light purples as the primary accent (e.g., lavender, soft violet); neutral whites/light grays for backgrounds; dark charcoal for text
- **Typography:** Clean sans-serif; editorial feel (not bubbly or playful)
- **UI density:** Spacious — not cramped; content and generated results should breathe
- **Tone:** Premium, calm, intentional — matches a quality tea brand

## Stack

- **Stack file:** cosmo-instructions/stacks/react-vite-supabase.md

## GitHub Integration

- **GitHub integration:** enabled (account: eleblanc-ai)
