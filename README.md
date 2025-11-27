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

## Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Create Vectorize index

```bash
wrangler vectorize create profanity-index --dimensions=384 --metric=cosine
```

### 3. Seed the vector database

Generate and upload profanity vectors in one command:

```bash
yarn seed:upload
```

Or run separately:

```bash
# Generate vectors
yarn seed

# Upload to Vectorize
wrangler vectorize insert profanity-index --file=profanity-vectors.json --upsert
```

### 4. Start development server

```bash
yarn dev
```

## API Usage

### POST /api/profanity/vector

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

**Response:**
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

**Response Fields:**
- `hasProfanity`: Boolean - whether profanity was found
- `matches`: Array - details per word
  - `word`: The analyzed word
  - `matchScore`: Similarity score (0-1)
  - `matchedProfanity`: Closest profanity match
  - `isProfane`: Whether this word is considered profane
- `overallScore`: Average profanity score across all words
- `text`: The original input text

## Example Usage

```bash
curl -X POST http://localhost:8787/api/profanity/vector \
  -H "Content-Type: application/json" \
  -d '{"text": "What the hell is this crap?"}'
```

## Deployment

```bash
yarn deploy
```

## Project Structure

```
src/
├── index.ts              # Main Hono app entry point
├── types.ts              # TypeScript interfaces
├── vectorUtils.ts        # Vector embedding utilities
├── routes/
│   └── profanity.ts      # Profanity detection endpoint
└── services/
    └── ProfanityService.ts  # Core detection logic

scripts/
└── seed/
    ├── index.ts          # Main seeding script
    ├── config.ts         # Configuration & sources
    ├── types.ts          # Type definitions
    ├── fetcher.ts        # Remote list fetching
    ├── generator.ts      # Vector generation
    └── logger.ts         # Logging utilities
```

## Threshold Tuning

The `threshold` parameter determines detection strictness:

- **0.9-1.0**: Very strict - exact matches only
- **0.8-0.9**: Strict - clear profanity
- **0.7-0.8**: Moderate - includes variations
- **0.6-0.7**: Lenient - may include false positives

## Anti-Circumvention Features

- **Text normalization**: Removes obfuscation characters
- **Leet speak conversion**: `sh1t` → `shit`, `4ss` → `ass`
- **Repeated character removal**: `shiiiiit` → `shit`
- **Invisible character detection**: Detects zero-width unicode tricks
- **Word variations**: Checks multiple variations of each word
- **Concatenated profanity**: Detects hidden profanity in concatenated text

## Supported Languages

27 languages supported including: English, Dutch, German, French, Spanish, Italian, Portuguese, Russian, Ukrainian, Polish, Czech, Arabic, Japanese, Korean, Chinese, Hindi, Thai, Turkish, Swedish, Norwegian, Danish, Finnish, Hungarian, Filipino, Esperanto, and Persian.

## Notes

- Current implementation uses a simple character-based embedding
- For production, consider using a proper embedding model (e.g., OpenAI, Cohere)
- Language sources can be extended in `scripts/seed/config.ts`

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
yarn cf-typegen
```

