# Profanity Detection API

A profanity detector built with Hono, Cloudflare Workers and Vectorize.

## Features

- ✅ REST API endpoint for profanity detection
- ✅ Vector-based matching for accurate detection
- ✅ Word-by-word analysis with match scores
- ✅ Configurable threshold for sensitivity
- ✅ Multi-language support (27 languages)
- ✅ Advanced anti-circumvention detection
- ✅ Cloudflare Workers for edge deployment
- ✅ AI-powered embeddings using `@cf/baai/bge-small-en-v1.5`

## Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment

Create a `.dev.vars` file for local development:

```bash
# Generate a secure token
openssl rand -hex 32

# Add to .dev.vars
UPLOAD_TOKEN=your-generated-token-here
```

For production, set the secret:

```bash
wrangler secret put UPLOAD_TOKEN
```

### 3. Create Vectorize index

```bash
# Login to Cloudflare (if not already logged in)
wrangler login

# Create the Vectorize index
wrangler vectorize create profanity-index --dimensions=384 --metric=cosine

# Verify the index was created
wrangler vectorize list
```

### 4. Seed the vector database

The seeding process is now done via an API endpoint. To make it easier to gather the words and format the payload, you can use the `prepare-seed` helper script.

**Step 1: Prepare the seed data**

This will fetch all the words from the sources defined in `helpers/config.ts` and create a `seed-payload.json` file.

```bash
yarn prepare-seed
```

**Step 2: Seed the database via API**

This will send the `seed-payload.json` file to the seeding endpoint. Make sure your development server is running (`yarn dev`).

```bash
curl -X POST http://localhost:8787/api/admin/words \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_UPLOAD_TOKEN" \
  --data-binary "@seed-payload.json"
```

Remember to replace `YOUR_UPLOAD_TOKEN` with the token from your `.dev.vars` file.

### 5. Start development server

```bash
yarn dev
```

## Secrets & Environment Variables

### Local Development (`.dev.vars`)

```
UPLOAD_TOKEN=your-secret-token-here
```

### Production (Cloudflare Secrets)

```bash
# Set upload token
wrangler secret put UPLOAD_TOKEN

# Set in GitHub Actions
# Add UPLOAD_TOKEN to repository secrets
```

## API Usage

### `POST /api/profanity/vector`

Check text for profanity.

**Request Body:**
```json
{
  "text": "Your text to check here",
  "threshold": 0.8
}
```

**Parameters:**
- `text` (string, required): The text to check for profanity
- `threshold` (number, optional): Match threshold (0-1). Default: 0.8

**Success Response (200):**
```json
{
  "hasProfanity": true,
  "matches": [
    {
      "word": "damn",
      "matchScore": 0.95,
      "matchedProfanity": "damn",
      "isProfane": true
    },
    {
      "word": "hello",
      "matchScore": 0.12,
      "matchedProfanity": "hell",
      "isProfane": false
    }
  ],
  "overallScore": 0.54,
  "text": "damn hello"
}
```

### `POST /api/admin/words`

Seed the vector database with a list of words. Requires Bearer token authentication.

**Request Body:**
```json
{
  "words": ["word1", "word2", "word3"]
}
```

**Success Response (200):**
```json
{
  "message": "Successfully seeded 813 words.",
  "count": 813
}
```

## CORS Policy

Cross-Origin Resource Sharing (CORS) is configured to allow requests from the following origin:

- `profanity.christmas-tree.app`

This allows the frontend application at that domain to access the API.

## Project Structure

```
src/
├── index.ts              # Main Hono app entry point
├── types.ts              # TypeScript interfaces
├── vectorUtils.ts        # Vector embedding utilities
├── routes/
│   ├── profanity.ts      # Profanity detection endpoint
│   └── admin.ts          # Admin endpoints (e.g., seeding)
└── services/
    └── ProfanityService.ts  # Core detection logic
helpers/
├── config.ts             # Configuration for profanity word sources
└── prepare-seed-data.ts  # Helper script to prepare seed data
```

## Notes

- Embeddings are generated using the `@cf/baai/bge-small-en-v1.5` model from Cloudflare AI.
- Language sources can be extended in `helpers/config.ts`.

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
yarn cf-typegen
```
