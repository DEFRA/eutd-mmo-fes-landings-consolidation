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

const isVersionAtLeast42 = (version: string): boolean => {
  const [majorStr, minorStr] = version.split('.');
  const major = Number(majorStr);
  const minor = Number(minorStr);

  if (Number.isNaN(major) || Number.isNaN(minor)) {
    return false;
  }

  return major > 4 || (major === 4 && minor >= 2);
};

export const createMongoMemoryServer = async (): Promise<MongoMemoryServer> => {
  // In Docker CI, a system mongod binary can be forced via MONGOMS_SYSTEM_BINARY.
  // Align requested version to avoid version-conflict warnings from mongodb-memory-server.
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY;

  if (systemBinary && fs.existsSync(systemBinary)) {
    const detectedVersion = parseMongoVersion(systemBinary);

    // Mongoose 8 (mongodb driver 6) requires MongoDB >= 4.2.
    if (detectedVersion && isVersionAtLeast42(detectedVersion)) {
      return MongoMemoryServer.create({
        binary: {
          version: process.env.MONGOMS_VERSION || detectedVersion,
        },
      });
    }
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
