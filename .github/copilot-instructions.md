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

## The working framework (Triage → Read → Research → Clarify → Plan → Approval → Implement → Test → Iterate → Summarise)

This section is the **single source of truth** for the working loop. The custom agents ([Orchestrator](.github/agents/landings-consolidation-orchestrator.agent.md), [Planner](.github/agents/landings-consolidation-planner.agent.md), [Developer](.github/agents/landings-consolidation-developer.agent.md) and [Reviewer](.github/agents/landings-consolidation-reviewer.agent.md)) reference it and **must not restate or fork it**. The guiding principle is **match effort to risk**: do the least work that still delivers the change safely and to standard.

**Triage first — pick one of three gears by size and risk:**

- **Trivial** (typo, comment/doc tweak, a small localised change with no impact on architecture, the consolidation pipeline, overuse/deminimus detection, risk scoring, species-alias matching, MongoDB/Mongoose persistence, external integrations, security or data correctness): skip the planner, research and review. Do a light **Read → Implement → Test → Summarise**, and research only the one point that is genuinely uncertain.
- **Standard** (a normal consolidation/validation change or fix, with **no** new architecture, external integration, or security surface): use a **lightweight inline plan** (a short Objective · Plan · Files · Validation · Risks note from the Developer agent — no heavyweight Planner), get approval, then implement and test. Run a **single** risk-scoped research pass **only if** something is genuinely uncertain.
- **Complex** (new architecture, overuse/deminimus or risk-scoring rule changes, a new external integration (Azure Blob reference data, Service Bus, MongoDB, vessel service), scheduled-job changes, a security surface, or multi-item delivery): run the full loop with the Planner agent below.

**Manual override.** The user can force a gear — e.g. "treat this as trivial", "just a lightweight/standard plan", "force the full plan", "skip the planner" — and that instruction wins over the automatic classification. Always honour a request for **more** rigour. When the user asks for **less** rigour than the risk warrants, comply but **briefly flag the risk first**, and never drop the approval gate or security for a change that genuinely touches architecture, external integrations, security or data correctness.

The loop (Standard and Complex; Trivial uses the light path above):

1. **Read** — Read the relevant files/config in the repo for context before acting. Never assume; verify.
2. **Research (single pass, risk-scoped)** — When something is genuinely uncertain — an unfamiliar or version-sensitive API, security, or DEFRA/GDS policy — do **one** thorough, risk-scoped research pass in the open and validate findings against DEFRA/GDS and framework/library guidance so advice reflects current APIs and policy. Cite sources. **Do not run a second, separate validation research round** — the plan is checked against these same cited sources. Well-trodden or cosmetic steps need little or no research.
3. **Clarify** — Ask the user targeted questions whenever requirements are ambiguous or missing. Surface requirement gaps explicitly with suggested fixes. Do not guess at intent.
4. **Plan** — For **Complex** work, delegate planning to the [Planner - Landings Consolidation](.github/agents/landings-consolidation-planner.agent.md) agent, which returns a complete plan with its research already cited. For **Standard** work, produce the lightweight inline plan directly — no separate planning agent. Either way, **check** the plan's risky/version-sensitive steps are covered and cited; only send a targeted revision back if a genuine gap is found (do not re-research what is already cited).
5. **Approval** — Present the plan to the user and obtain explicit approval before implementation. If changes are requested, update the plan and re-present. **Cap the plan → approve → implement cycle at 3 iterations**; if it is still unresolved, stop and surface the blocker to the user.
6. **Implement** — Deliver one task at a time (or parallel independent tasks) from the approved plan. Stay focused on the requested outcome; do not scope-creep or refactor unrelated code. When a change introduces or alters architecture, capture the decision as an ADR and update the relevant docs **where the repo already keeps them** (e.g. `docs/`).
7. **Test / Validate** — Build (`npm run build`), run the test suite (`npm test`), lint (`npm run lint`), check errors, and confirm each task works before moving on.
8. **Iterate** — Refine until the user is satisfied with each task.
9. **Summarise** — End with a detailed **executive summary** of what changed, why, how it was validated, and any follow-ups or risks.

**Code review is optional and on-request.** A full code review is **not** part of the default loop. Run it only when the user asks for one. At the end of implementation, if no review has been run, **offer** one (a single Yes/No question); invoke the reviewer only on an explicit Yes.

## Workflow agents

Standard and Complex work is coordinated through four custom agents that all run the framework above:

| Agent | Role |
|-------|------|
| [Orchestrator - Landings Consolidation](.github/agents/landings-consolidation-orchestrator.agent.md) | Plans, delegates, verifies and reports; owns the Yes/No user-approval gate and the end-of-work review offer. Does **not** implement. |
| [Planner - Landings Consolidation](.github/agents/landings-consolidation-planner.agent.md) | Internal planning subagent; produces the approval-ready plan and the single research pass behind it. Invoked for **Complex** work. |
| [Developer - Landings Consolidation](.github/agents/landings-consolidation-developer.agent.md) | Implements an already-approved plan end-to-end with tests; authors the lightweight inline plan for **Standard** work. |
| [Reviewer - Landings Consolidation](.github/agents/landings-consolidation-reviewer.agent.md) | Read-only review against DEFRA standards; reports findings by severity. **Optional, on-request only** — not run by default. |

Research (§4.2) uses the [deep-research-defra-alignment](.github/skills/deep-research-defra-alignment/SKILL.md) skill — a single risk-scoped pass run by the **Planner** (Complex work) or the **Developer** (Standard work). The [Speckit](.github/agents) agents (`speckit.*`) are a separate spec-driven toolset and are **not** part of this workflow.

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