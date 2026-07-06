import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const DEFAULT_MANAGED_MONGO_VERSION = process.env.MONGOMS_VERSION || '6.0.9';

const parseMongoVersion = (systemBinary: string): string | undefined => {
  try {
    const output = execFileSync(systemBinary, ['--version'], { encoding: 'utf-8' });
    const match = output.match(/(\d+\.\d+\.\d+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
};

export const createMongoMemoryServer = async (): Promise<MongoMemoryServer> => {
  // In Docker CI, a system mongod binary can be forced via MONGOMS_SYSTEM_BINARY.
  // Align requested version to avoid version-conflict warnings from mongodb-memory-server.
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY;

  if (systemBinary && fs.existsSync(systemBinary)) {
    const detectedVersion = parseMongoVersion(systemBinary);

    return MongoMemoryServer.create({
      binary: {
        version: process.env.MONGOMS_VERSION || detectedVersion,
      },
    });
  }

  // If system binary is missing or too old, ignore it and use managed binaries.
  if (systemBinary) {
    delete process.env.MONGOMS_SYSTEM_BINARY;
  }

  return MongoMemoryServer.create({
    binary: {
      version: DEFAULT_MANAGED_MONGO_VERSION,
    },
  });
};
