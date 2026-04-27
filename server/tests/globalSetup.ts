/**
 * Vitest global setup — runs ONCE per `vitest run`, before any test forks
 * spawn. We use it to warm `mongodb-memory-server`'s binary cache so the
 * per-fork `MongoMemoryServer.create()` calls don't race on the lockfile
 * at `~/.cache/mongodb-binaries/<version>.lock`.
 *
 * Without this, on a clean CI cache N parallel forks all try to download
 * the same MongoDB binary; whichever fork finishes the download first
 * tries to release the lock — but the lock is now owned by a different
 * process, so it throws:
 *
 *   Error: Cannot unlock file ".../mongodb-binaries/X.Y.Z.lock", because
 *   it is not locked by this process
 *
 * Pre-fetching here means the binary is on disk before any fork starts,
 * and each fork just reads from the cache.
 */
import { MongoBinary } from 'mongodb-memory-server'

export async function setup(): Promise<void> {
  await MongoBinary.getPath({})
}

export async function teardown(): Promise<void> {
  // Nothing to clean up — `MongoBinary.getPath` only populates the cache.
}
