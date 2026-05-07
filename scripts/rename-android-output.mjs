#!/usr/bin/env node
// Duplicate the gradle-produced .apk / .aab to <bundleId>.<ext> so the
// final artifact has a stable, recognizable filename for upload AND
// gradle's original output stays put — handy for debugging, build-cache
// awareness, and re-running the script idempotently. The bundle ID is
// read from src-tauri/tauri.conf.json so the script stays correct if
// the identifier ever changes.
//
// Usage:
//   node scripts/rename-android-output.mjs apk
//   node scripts/rename-android-output.mjs aab
//
// If gradle emitted multiple files (e.g. ABI splits — separate APKs
// per architecture), each gets a copy named <bundleId>-<arch>.<ext> so
// the duplicates don't collide.

import { copyFileSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const format = (process.argv[2] || '').toLowerCase()
if (format !== 'apk' && format !== 'aab') {
  console.error(`[rename-android-output] usage: node scripts/rename-android-output.mjs <apk|aab>`)
  process.exit(1)
}

const conf = JSON.parse(readFileSync(join(ROOT, 'src-tauri', 'tauri.conf.json'), 'utf8'))
const bundleId = conf.identifier
if (!bundleId) {
  console.error(`[rename-android-output] tauri.conf.json has no "identifier"`)
  process.exit(1)
}

const subdir = format === 'apk' ? 'apk' : 'bundle'
const root = join(ROOT, 'src-tauri', 'gen', 'android', 'app', 'build', 'outputs', subdir)

function walk(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.isFile() && p.endsWith(`.${format}`) && !p.includes('unsigned')) out.push(p)
  }
  return out
}

const found = walk(root)
if (found.length === 0) {
  console.error(`[rename-android-output] no .${format} files under ${root}`)
  process.exit(1)
}

const archRe = /-(arm64-v8a|armeabi-v7a|x86_64|x86|universal)-/i
// `walk()` returns previous duplicates too, so skip anything that's
// already named after the bundle ID — re-running the script after a
// rebuild would otherwise copy a copy of itself onto itself.
const sources = found.filter((p) => !basename(p).startsWith(`${bundleId}.`) && !basename(p).startsWith(`${bundleId}-`))
if (!sources.length) {
  console.log(`[rename-android-output] no fresh ${format} outputs to duplicate (only pre-existing ${bundleId}.* found)`)
  process.exit(0)
}
for (const src of sources) {
  const dir = dirname(src)
  const stem = basename(src, extname(src))
  const archMatch = stem.match(archRe)
  const arch = archMatch ? archMatch[1].toLowerCase() : null
  // Single universal output → bare bundleId. Split outputs → bundleId-<arch>.
  const useArch = sources.length > 1 && arch
  const dstName = useArch ? `${bundleId}-${arch}.${format}` : `${bundleId}.${format}`
  const dst = join(dir, dstName)
  if (src === dst) {
    console.log(`[rename-android-output] already named: ${dst}`)
    continue
  }
  copyFileSync(src, dst)
  console.log(`[rename-android-output] ${basename(src)} → ${dstName} (duplicated, original kept)`)
  console.log(`  ${dst}`)
}
