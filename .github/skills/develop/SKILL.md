---
name: develop
description: 'Expert Node.js/TypeScript/Hapi developer for MMO FES Landings Consolidation. Use when: implementing features, fixing bugs, refactoring code, researching codebase, planning solutions. Covers consolidation pipeline, species matching, overuse detection, risk scoring.'
license: OGL-UK-3.0
metadata:
  author: mmo-fes
  version: "1.0"
---

# Landings Consolidation — Developer Skill

Expert software engineer for the MMO FES Landings Consolidation service. Reads the codebase, researches, plans, reasons, writes production-ready code following project conventions.

## When to Use

- Implementing consolidation pipeline changes
- Working with species alias matching or overuse detection
- Modifying risk scoring weights or tolerance thresholds
- Adding new cron jobs or modifying scheduled tasks
- Any production code writing task

## Workflow

### Before Making Changes

1. Search codebase for similar patterns using search tools
2. Check existing tests to understand expected behavior
3. Verify types in `mmo-shared-reference-data` — never duplicate shared library logic
4. Review related files and usages for the functions/types being changed

### During Implementation

1. Follow all mandatory rules from the auto-loaded instruction files (`nodejs-hapi.instructions.md`, `typescript.instructions.md`)
2. Handle errors with catch-and-log pattern — continue processing remaining items on partial failure
3. Refer to the code examples in **Project Conventions** below for reference implementations

### After Implementation

1. Run build: `npm run build`
2. Run lint: `npm run lint`
3. Verify no TypeScript errors in problems panel
4. Invoke the `/unit-tests` skill to write or update tests
5. Review git diff to ensure no accidental changes

## Project Conventions

### Consolidation Pipeline

```typescript
// Transform → Query → Persist
const csvData = await readCsvFromBlob(blobClient);
const landings = parseLandings(csvData);
const validated = await validateAgainstCatchCerts(landings);
await persistConsolidatedLandings(validated);
```

### Species Alias Matching

```typescript
// Species lookups must use getSpeciesAliases() for alias resolution
const aliases = getSpeciesAliases(speciesCode);
const matchedSpecies = allSpecies.find(s =>
  aliases.includes(s.speciesCode) || s.speciesCode === speciesCode
);
```

### Overuse Detection

```typescript
// Overuse: exported weight exceeds landed weight
// Deminimus: 50kg tolerance for small discrepancies
const overuse = exportedWeight - landedWeight;
const isDeminimus = overuse > 0 && overuse <= DEMINIMUS_THRESHOLD; // 50kg
const isOveruse = overuse > DEMINIMUS_THRESHOLD;
```

### Risk Scoring

```typescript
// Combined weighting from vessel, species, and exporter behavior
const riskScore = calculateRiskScore({
  vesselWeight: getVesselWeight(vesselId),
  speciesWeight: getSpeciesWeight(speciesCode),
  exporterWeight: getExporterBehaviorWeight(exporterId),
});
```

### RSS to PLN Vessel Mapping

```typescript
// Vessels identified by RSS number, mapped to PLN for display
const vessel = vesselLookup.get(rssNumber);
const plnNumber = vessel?.pln || 'UNKNOWN';
```

### Cache Refresh from Azure Blob

```typescript
const newData = await loadReferenceData();
updateCache('key', newData); // Atomic reference swap — never mutate existing
```

### Scheduled Jobs

```typescript
cron.schedule(expression, async () => {
  logger.info('[SCHEDULED-JOBS][TASK][STARTED]');
  try { await task(); }
  catch (error) { logger.error(`[SCHEDULED-JOBS][TASK][ERROR][${error}]`); }
});
```

## Anti-Patterns

> Mandatory rules in the instruction files also apply. The items below are additional anti-patterns specific to this skill:

- Ignoring species alias matching — always use `getSpeciesAliases()`
- Hardcoding deminimus threshold instead of using `DEMINIMUS_THRESHOLD` constant
- Duplicating types or logic already available in `mmo-shared-reference-data`
- Skipping RSS→PLN mapping for vessel display
