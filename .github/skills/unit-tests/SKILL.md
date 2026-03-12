---
name: unit-tests
description: 'Expert unit test engineer for MMO FES Landings Consolidation. Use when: writing unit tests, updating tests for code changes, fixing failing tests, improving code coverage, fixing SonarQube issues.'
---

# Landings Consolidation — Unit Tests Skill

Expert in writing and maintaining unit tests for the MMO FES Landings Consolidation service.

## When to Use

- Writing unit tests for new or modified code
- Fixing failing tests after code changes
- Improving code coverage to meet thresholds
- Fixing SonarQube issues or code smells

## Coverage Requirements

- **Overall target**: >90% line coverage
- Run tests: `npm test` (single run with coverage report)
- Watch mode: `npm run test:watch`

## Test Framework & Tools

- **Jest** as test runner with ts-jest
- **mongodb-memory-server** for MongoDB integration tests
- **jest.spyOn()** for mocking
- Test files in `test/` directory mirroring `src/` structure

## Mocking Patterns

### MongoDB Memory Server

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### Cache Mocking

```typescript
jest.mock('../../src/data/cache', () => ({
  getCachedVessels: jest.fn().mockReturnValue(mockVessels),
  getCachedSpecies: jest.fn().mockReturnValue(mockSpecies),
  updateCache: jest.fn(),
}));
```

### Logger

```typescript
const mockLoggerInfo = jest.spyOn(logger, 'info').mockImplementation();
const mockLoggerError = jest.spyOn(logger, 'error').mockImplementation();
expect(mockLoggerInfo).toHaveBeenCalledWith('[PREFIX][ACTION][DETAIL]');
```

### Date Mocking

```typescript
jest.spyOn(Date, 'now').mockImplementation(() => 1693751375000);
```

## What to Test

1. **Consolidation pipeline** — CSV parsing, data transformation, persistence
2. **Species alias matching** — verify `getSpeciesAliases()` lookups resolve correctly
3. **Overuse detection** — boundary values around deminimus threshold (50kg)
4. **Risk scoring** — known input weights produce expected scores
5. **RSS→PLN mapping** — vessel lookup with known and unknown vessels
6. **Cache atomicity** — verify `updateCache()` is called, not direct mutation
7. **Cron jobs** — scheduled task execution including error scenarios
8. **Error handling** — partial failure tolerance in batch processing

## SonarQube Issue Resolution

When fixing SonarQube issues, **NEVER modify functionality**. If existing tests fail after a fix, revert it. Only structural refactoring is allowed.

## Workflow

1. Identify the source file(s) that need tests
2. Find existing test file or create new one mirroring `src/` → `test/` path
3. Read the source code to understand all branches and edge cases
4. Write tests following the Arrange/Act/Assert pattern
5. Run `npm test` and check coverage output
6. If coverage < 90%, identify uncovered lines and add targeted tests
7. Check problems tab for SonarQube issues
