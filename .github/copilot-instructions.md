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

## Standards precedence (highest wins)

When guidance conflicts, follow this order:

1. **DEFRA Software Development Standards** (mandatory) — https://defra.github.io/software-development-standards/
2. **DEFRA Digital Service Manual** — https://digital.defra.gov.uk/service-manual
3. **GOV.UK Service Standard & Service Manual (GDS)** — https://www.gov.uk/service-manual
4. **Community best practice** — [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/), [12-factor](https://12factor.net/), widely-adopted Node.js/TypeScript patterns

> **DEFRA takes precedence over GDS. GDS takes precedence over community guidance.** Any deviation from a DEFRA standard MUST be raised as a formal exception through DEFRA's architectural governance (Delivery Architecture team: `delivery.architecture@defra.gov.uk`).

## The working framework (Triage → Read → Research → Plan Handoff → Plan Validation Research → Approval → Implement → Test → Iterate → Summarise)

This section is the **single source of truth** for the working loop. The custom agents ([Orchestrator](.github/agents/landings-consolidation-orchestrator.agent.md), [Planner](.github/agents/landings-consolidation-planner.agent.md), [Developer](.github/agents/landings-consolidation-developer.agent.md) and [Reviewer](.github/agents/landings-consolidation-reviewer.agent.md)) reference it and **must not restate or fork it**.

**Triage first — pick the right path by size and risk:**

- **Trivial / low-risk** (typo, comment/doc tweak, a small localised change with no impact on architecture, the consolidation pipeline, overuse/deminimus detection, risk scoring, species-alias matching, MongoDB/Mongoose persistence, external integrations, security or data correctness): skip the planner and heavy research. Do a light **Read → Implement → Test → Summarise**, and research only the specific point that is genuinely uncertain.
- **Non-trivial** (new feature, a consolidation/validation change, overuse/deminimus or risk-scoring changes, persistence, external integrations (Azure Blob reference data, Service Bus, MongoDB, vessel service), scheduled jobs, security, or anything affecting landing-data correctness or risky): run the full loop below.

Non-trivial loop:

1. **Read** — Read the relevant files/config in the repo for context before acting. Never assume; verify.
2. **Research** — Do thorough, risk-scoped research in the open and validate findings against DEFRA/GDS and framework/library guidance so advice reflects current APIs and policy. Cite sources.
3. **Clarify** — Ask the user targeted questions whenever requirements are ambiguous or missing. Surface requirement gaps explicitly with suggested fixes. Do not guess at intent.
4. **Plan handoff** — Delegate planning to the [Planner - Landings Consolidation](.github/agents/landings-consolidation-planner.agent.md) agent when one exists. The planning agent returns the complete implementation plan.
5. **Plan validation research** — Perform thorough research in the open to validate the plan against DEFRA/GDS and framework guidance, **focusing on the steps the planner flagged as risky or version-sensitive** (unfamiliar APIs, security, policy). Send targeted revisions back to the planner.
6. **Approval** — Present the complete validated plan to the user and obtain explicit approval before implementation. If changes are requested, update the plan, re-validate, and re-approve. **Cap the plan → validate → approve → implement replanning cycle at 3 iterations**; if it is still unresolved, stop and surface the blocker to the user.
7. **Implement** — Deliver one task at a time (or parallel independent tasks) from the approved plan. Stay focused on the requested outcome; do not scope-creep or refactor unrelated code. When a change introduces or alters architecture, capture the decision as an ADR and update the relevant docs **where the repo already keeps them** (e.g. `docs/`).
8. **Test / Validate** — Build (`npm run build`), run the test suite (`npm test`), lint (`npm run lint`), check errors, and confirm each task works before moving on.
9. **Iterate** — Refine until the user is satisfied with each task.
10. **Summarise** — End with a detailed **executive summary** of what changed, why, how it was validated, and any follow-ups or risks.

## Workflow agents

Non-trivial work is coordinated through four custom agents that all run the framework above:

| Agent | Role |
|-------|------|
| [Orchestrator - Landings Consolidation](.github/agents/landings-consolidation-orchestrator.agent.md) | Plans, delegates, verifies and reports; owns the Yes/No user-approval gate. Does **not** implement. |
| [Planner - Landings Consolidation](.github/agents/landings-consolidation-planner.agent.md) | Internal planning subagent; produces the approval-ready plan and the research behind it. |
| [Developer - Landings Consolidation](.github/agents/landings-consolidation-developer.agent.md) | Implements an already-approved plan end-to-end with tests. |
| [Reviewer - Landings Consolidation](.github/agents/landings-consolidation-reviewer.agent.md) | Read-only review against DEFRA standards; reports findings by severity. |

Research (§4.2) and plan-validation research (§4.5) use the [deep-research-defra-alignment](.github/skills/deep-research-defra-alignment/SKILL.md) skill. The [Speckit](.github/agents) agents (`speckit.*`) are a separate spec-driven toolset and are **not** part of this workflow.

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