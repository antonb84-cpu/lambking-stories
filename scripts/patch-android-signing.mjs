#!/usr/bin/env node
// Re-apply the release-signingConfig patch to
// `src-tauri/gen/android/app/build.gradle.kts` after a
// `tauri android init`. Without this, the regenerated gradle script
// has only debug signing and `tauri android build --apk` produces an
// unsigned APK at the `*-release-unsigned.apk` path. Idempotent — if
// the patch is already in place, the script is a no-op.
//
// Wired into the `tauri:build-android-{apk,aab}` npm scripts so it
// runs before every build. The chain is:
//   patch (this) → tauri android build → rename → bump versionCode
//
// Detection: presence of the BEGIN sentinel anywhere in the file.
// All inserted blocks are bracketed by matching BEGIN/END markers so
// the patch is also easy to spot / hand-remove.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GRADLE = resolve(ROOT, 'src-tauri/gen/android/app/build.gradle.kts')
const SENTINEL = '// BEGIN: managed by scripts/patch-android-signing.mjs'

if (!existsSync(GRADLE)) {
  console.log(`[patch-android-signing] no gradle file at ${GRADLE} — skipping (run \`pnpm tauri android init\` first)`)
  process.exit(0)
}

let content = readFileSync(GRADLE, 'utf8')

if (content.includes(SENTINEL)) {
  console.log(`[patch-android-signing] gradle already patched — skipping`)
  process.exit(0)
}

const before = content

// ── 1. keystoreProperties block (top-level), inserted after the
// tauriProperties block. ─────────────────────────────────────────────
const keystorePropsBlock = `

${SENTINEL}
val keystoreProperties = Properties().apply {
    val propFile = rootProject.file("key.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}
// END: managed by scripts/patch-android-signing.mjs`

content = content.replace(
  /(val tauriProperties = Properties\(\)\.apply \{[\s\S]*?\n\})(?=\n\nandroid \{)/,
  `$1${keystorePropsBlock}`
)
assertPatched('keystoreProperties block', before, content)

// ── 2. signingConfigs block inside `android {}`, inserted just before
// `buildTypes {}`. ───────────────────────────────────────────────────
const signingConfigsBlock = `    ${SENTINEL}
    signingConfigs {
        create("release") {
            keystoreProperties["keyAlias"]?.let { keyAlias = it as String }
            keystoreProperties["password"]?.let {
                keyPassword = it as String
                storePassword = it as String
            }
            keystoreProperties["storeFile"]?.let { storeFile = file(it as String) }
        }
    }
    // END: managed by scripts/patch-android-signing.mjs
`
const afterStep1 = content
content = content.replace(/(\n)(    buildTypes \{)/, `$1${signingConfigsBlock}$2`)
assertPatched('signingConfigs block', afterStep1, content)

// ── 3. `signingConfig = ...` inside the release build type, just
// before its closing brace. ──────────────────────────────────────────
const signingAssign = `            ${SENTINEL}
            if (keystoreProperties.isNotEmpty()) {
                signingConfig = signingConfigs.getByName("release")
            }
            // END: managed by scripts/patch-android-signing.mjs
`
const afterStep2 = content
content = content.replace(
  /(getByName\("release"\) \{[\s\S]*?proguardFiles\([\s\S]*?\n            \)\n)(        \})/,
  `$1${signingAssign}$2`
)
assertPatched('release signingConfig assignment', afterStep2, content)

writeFileSync(GRADLE, content, 'utf8')
console.log(`[patch-android-signing] applied 3 inserts to ${GRADLE.replace(ROOT, '.')}`)

function assertPatched(label, prev, next) {
  if (prev === next) {
    console.error(`[patch-android-signing] failed to apply: ${label}`)
    console.error(`  No regex match — Tauri's generated build.gradle.kts may have changed shape.`)
    console.error(`  Inspect ${GRADLE.replace(ROOT, '.')} and update scripts/patch-android-signing.mjs accordingly.`)
    process.exit(1)
  }
}
