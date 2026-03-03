# Product Spec

**Created:** 2026-02-22
**Last Updated:** 2026-03-01
**Status:** Approved

## Overview

A flyer creation studio for a tea business that outputs **actual final flyer assets** (not just copy guidance) for social formats. The app generates and edits flyer variants for Instagram Post and Instagram Story, supports two rendering modes (AI fully composed or programmatic text overlay), and saves all outputs/metadata in Supabase.

## Goals

- Produce publish-ready flyer creatives quickly for Instagram Post and Story
- Generate multiple variant options per brief and enable quick refinement loops
- Preserve all briefs, variants, and exports in history for reuse and iteration

## Target Users

- Solo user: tea business owner (technical)

## Core Features

1. **Flyer brief form (full brief, required)**
  - Inputs include campaign goal, product/tea name, key details, CTA, brand style controls (tone/color/font vibe), and format constraints
2. **Supported formats (V1)**
  - Instagram Post (square)
  - Instagram Story (vertical)
3. **Two flyer rendering modes (V1)**
  - **Mode A:** AI-generated final flyer image (text baked into the generated image)
  - **Mode B:** AI background generation + programmatic text overlay to render final flyer deterministically
4. **Variant generation and refinement**
  - Generate 3 variants per format
  - Quick regenerate for a selected variant
  - Editable text fields (headline/body/CTA etc.) + re-render final flyer
5. **Output and export**
  - Download PNG and JPG
  - Export package (zip of generated variants)
6. **History and persistence**
  - Save briefs, variant outputs, selected mode, format, and metadata in Supabase
  - Keep lineage for regenerated/edited variants

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
- **Database/Storage:** Supabase (Postgres for briefs/variants metadata, Storage for flyer image assets and zip exports)
- **AI:**
  - Text generation: Anthropic Claude (`claude-sonnet-4-5`) for structured flyer copy variants
  - Image generation: Google Gemini (`gemini-3-pro-image-preview`) for flyer background or fully composed flyers
- **Rendering:**
  - Mode A: image model returns final composed flyer
  - Mode B: app/service applies deterministic text overlay on generated background using format-specific layout templates
- **API layer:** Supabase Edge Functions in `supabase/functions/`
- **Project structure:** Feature-based, per `cosmo-instructions/architecture.md`
- **Verification command:** `npm run verify`
- **Local dev:** `supabase start` + `npm run dev`

## Data Model

### `content_items` table (existing; reused/extended)
- `id` — uuid, primary key
- `type` — enum (currently includes `image`; flyer variants stored as image entries with metadata)
- `prompt` — text (brief or generation prompt)
- `text_output` — text (nullable; copy guidance / serialized copy blocks)
- `image_url` — text (nullable; flyer asset URL)
- `parent_id` — uuid (nullable; lineage for regenerate/edit)
- `created_at` — timestamp

### Metadata requirement (to capture in implementation)
- Store format (`instagram_post` | `instagram_story`), render mode (`ai_composed` | `overlay`), and variant index for each output

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
