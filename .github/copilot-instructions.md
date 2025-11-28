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