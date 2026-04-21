/**
 * Trigger a one-off backup (dump + email) outside the scheduled cron. Handy
 * for verifying SMTP credentials or taking an ad-hoc snapshot before a risky
 * migration.
 *
 * Usage:
 *   pnpm backup:now           # uses .env.local
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { runBackupNow } from '../src/jobs/backupJob.js'

async function main() {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME })
  await runBackupNow()
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
