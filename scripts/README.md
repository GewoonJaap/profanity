# Scripts Directory

Contains utility scripts for the project.

## Seed Scripts (`seed/`)

Scripts for generating and uploading profanity vectors to Cloudflare Vectorize.

### Structure

```
seed/
├── index.ts      # Main entry point
├── config.ts     # Configuration (sources, output file)
├── types.ts      # Type definitions
├── fetcher.ts    # Remote list fetching logic
├── generator.ts  # Vector generation
└── logger.ts     # Logging utilities
```

### Usage

```bash
# Generate vectors
yarn seed

# Generate and upload in one command
yarn seed:upload
```

### Separation of Concerns

- **config.ts**: All configuration and constants
- **types.ts**: TypeScript interfaces and types
- **fetcher.ts**: HTTP fetching and data parsing
- **generator.ts**: Vector generation logic
- **logger.ts**: Console output and formatting
- **index.ts**: Orchestration of all components

Each module has a single responsibility and can be tested independently.
