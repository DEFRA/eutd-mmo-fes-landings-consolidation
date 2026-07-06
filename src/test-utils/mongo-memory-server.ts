import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

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
    const version = process.env.MONGOMS_VERSION || parseMongoVersion(systemBinary);

    return MongoMemoryServer.create({
      binary: {
        version,
      },
    });
  }

  // If an invalid system binary path is exported, ignore it and use downloaded binaries.
  if (systemBinary && !fs.existsSync(systemBinary)) {
    delete process.env.MONGOMS_SYSTEM_BINARY;
  }

  return MongoMemoryServer.create();
};
