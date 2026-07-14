# MMO FES Landings Consolidation - Copilot Instructions

## Project Overview
This is a TypeScript/Node.js microservice that consolidates fisheries landing data for the MMO (Marine Management Organisation) FES (Fisheries Export Service). It processes landing reports from multiple sources (Landing Declarations, Catch Recordings, E-logs) against catch certificates to detect overuse and validation issues.

## Core Architecture

### Service Layer Pattern
- **Entry Point**: `src/start.ts` → `src/server.ts` (Hapi.js server)
- **Main Service**: `src/services/consolidateLanding.service.ts` - contains primary business logic
- **Handlers**: `src/handler/jobs.ts` - API endpoints for consolidation jobs
- **Persistence**: `src/landings/persistence/` - MongoDB operations via Mongoose
- **Data Layer**: `src/data/cache.ts` - in-memory caching of reference data

### Key Data Flow
1. Landing data from CFEAS → Consolidation jobs → Weight validation → Overuse detection
2. Cache reference data (vessels, species aliases, conversion factors) from Azure Blob Storage
3. Process catch certificates against landing data to identify mismatches

## Development Workflows

### Local Development
```bash
npm run start          # Development server with nodemon/ts-node
npm run build         # TypeScript compilation to dist/
npm run test          # Jest with >90% coverage target
npm run test:watch    # Watch mode for TDD
npm run lint          # ESLint with TypeScript rules
```

### Environment Configuration
- Development: loads from local CSV files in `data/` directory
- Production: loads reference data from Azure Blob Storage
- Environment detection: `appConfig.inDev` (NODE_ENV=development)

## Project-Specific Patterns

### Logging Convention
All log messages follow structured format with context:
```typescript
logger.info(`[LANDINGS-CONSOLIDATION][${operation}][${identifier}]`);
logger.error(`[LANDINGS-CONSOLIDATION][${operation}][ERROR][${error}]`);
```

### Data Processing Pipeline
1. **Transform** (`src/landings/transformations/landing.ts`) - normalize incoming data
2. **Query** (`src/landings/query/`) - business rule validation (overuse, deminimus checks)
3. **Persist** (`src/landings/persistence/`) - database operations

### Risk Scoring System
- Combines vessel risk, species risk, and exporter behavior scores
- Cached scoring data refreshed via scheduled jobs
- Functions in `src/data/risking.ts` calculate total risk scores

### Species Alias Handling
Critical for data matching - species codes may have multiple aliases loaded from reference data. Always check `getSpeciesAliases()` when matching species between landing data and certificates.

## Testing Conventions

### Structure
- Test files mirror source structure: `test/` matches `src/`
- Use MongoDB Memory Server for integration tests
- Mock external dependencies (blob storage, shared libraries)
- >90% coverage target overall

### Key Test Patterns
```typescript
// Always use describe blocks matching the service/function name
describe('consolidateLandings', () => {
  // Setup MongoDB memory server in beforeAll
  // Use factory functions for test data creation
  // Test both happy path and error scenarios
});
```

## External Dependencies

### Critical Integrations
- **MongoDB/Mongoose**: Primary data store with strict schema validation
- **Azure Blob Storage**: Reference data source (species, vessels, conversion factors)
- **mmo-shared-reference-data**: Shared types and business logic library
- **Application Insights**: Telemetry and monitoring

### Caching Strategy
- All reference data loaded into memory on startup
- Scheduled refresh jobs (`node-cron`) update cache periodically
- Cache invalidation via `/v1/jobs/purge` endpoint

## Configuration Notes

### Branch Strategy
- GitFlow workflow required - feature branches must follow naming conventions
- Azure pipeline triggered on: main, develop, hotfix/*, feature/*, epic/*
- Pipeline failure if branch naming standards not followed

### API Authentication
- Basic auth in production (`@hapi/basic`)
- No auth in development mode
- All job endpoints under `/v1/jobs/` and `/v1/landings/`

## Key Business Logic

### Consolidation Process
The main consolidation flow in `consolidateLanding.service.ts`:
1. Map RSS numbers to PLN (Port Landing Number) via vessel service
2. Find affected catch certificates for each landing
3. Build species index from certificates for weight comparison
4. Apply overuse detection and deminimus rules
5. Update consolidated landing records

### Critical Validations
- **Overuse**: Export weight exceeds landed weight across all certificates
- **Deminimus**: Species weight differences within 50kg tolerance
- **Retrospective**: Landing data within expected timeframes

## Skills

Use `/develop` for implementation, coding, and research tasks. Use `/unit-tests` for writing tests, coverage, and SonarQube issues.

## Defra standards and governance

This service must comply with [Defra software development standards](https://github.com/DEFRA/software-development-standards) — the single source of truth. The rules below encode those standards; they do not replace them. When a standard changes, update this file.

### Quality gates

All code must pass these checks before merging:

- Linter passes (`npm run lint`)
- All tests pass (`npm test`)
- Coverage ≥90% global (Statements/Branches/Functions/Lines), ≥95% core business logic, 100% error-handling and security-critical paths — no decrease from the SonarCloud baseline
- SonarQube/SonarCloud quality gate passes; security hotspots reviewed and resolved
- At least one approving review from another developer
- No unresolved security vulnerabilities in dependencies

### Security and PII

- Follow [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- Never commit secrets — load all configuration and credentials from environment variables (`src/config.ts`), never `process.env` scattered through code
- **Never log PII**: names, addresses, emails, phone numbers, NI numbers, bank details, usernames, passwords, API keys, tokens
- Validate and sanitise all external input; use parameterised queries for database access
- Avoid `eval`, dynamic `Function()`, or executing user-supplied data; validate and normalise file paths

### Dependencies

- New dependencies must be widely used, actively maintained, and compatible with the current Node.js LTS
- `mmo-shared-reference-data` is the SSOT for shared types and queries — never duplicate its logic
- Do not introduce a second HTTP framework, ORM, or date library without an approved exception

### Logging

- Structured logging with bracketed context tags and `_correlationId` propagation
- Levels: `error` (failures), `warn` (handled but unexpected), `info` (business events), `debug` (development only)

### How Copilot should respond

- Follow conventions already in the codebase — check existing patterns first
- Prefer modifying existing files over creating new ones when the change fits naturally
- Provide minimal diffs touching only the necessary files; do not refactor unrelated code
- Always include or update tests for changed behaviour
- If a request conflicts with these instructions — a discouraged library, a skipped test, a hard-coded secret, or a broken quality gate — flag it explicitly and do not proceed silently

### Licence

All code is published under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) unless an approved exception exists.

<!-- STANDARDS NOTE: These instructions reflect Defra software development standards (https://github.com/DEFRA/software-development-standards). Review this file periodically or after any Defra standards update. -->