import cron, { type ScheduledTask } from 'node-cron'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { BackupService } from '../services/BackupService.js'
import { MailerService } from '../services/MailerService.js'

let scheduled: ScheduledTask | null = null
let running = false

export async function runBackupNow(): Promise<void> {
  if (running) {
    logger.warn('backup skipped: previous run still in progress')
    return
  }
  running = true
  try {
    const artifact = await BackupService.createArtifact()
    const counts = Object.entries(artifact.counts)
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n')
    const kb = (n: number) => (n / 1024).toFixed(1) + ' KB'
    const text = [
      `Nightly MongoDB backup for "${env.MONGO_DB_NAME}".`,
      '',
      `Generated: ${artifact.generatedAt}`,
      `Raw JSON size:    ${kb(artifact.rawBytes)}`,
      `Gzipped size:     ${kb(artifact.gzippedBytes)}`,
      '',
      'Document counts:',
      counts,
      '',
      'Restore: save the attachment and run `pnpm restore:backup -- --file=<path>` from /server.'
    ].join('\n')

    await MailerService.send({
      to: env.BACKUP_EMAIL_TO,
      subject: `[LBS] ${env.MONGO_DB_NAME} backup · ${artifact.generatedAt.slice(0, 10)}`,
      text,
      attachments: [
        { filename: artifact.filename, content: artifact.buffer, contentType: 'application/gzip' }
      ]
    })
    logger.info('backup delivered', {
      to: env.BACKUP_EMAIL_TO,
      filename: artifact.filename,
      gzippedBytes: artifact.gzippedBytes
    })
  } catch (err) {
    logger.error('backup job failed', { err: (err as Error).stack ?? err })
  } finally {
    running = false
  }
}

export function startBackupJob(): void {
  if (!env.BACKUP_ENABLED) {
    logger.info('backup job disabled (BACKUP_ENABLED=false)')
    return
  }
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('backup job enabled but SMTP_USER/SMTP_PASS missing; skipping schedule')
    return
  }
  if (!cron.validate(env.BACKUP_CRON)) {
    logger.error('invalid BACKUP_CRON expression; skipping schedule', { expr: env.BACKUP_CRON })
    return
  }
  scheduled?.stop()
  scheduled = cron.schedule(env.BACKUP_CRON, () => void runBackupNow(), {
    timezone: env.BACKUP_TIMEZONE
  })
  logger.info('backup job scheduled', {
    cron: env.BACKUP_CRON,
    timezone: env.BACKUP_TIMEZONE,
    to: env.BACKUP_EMAIL_TO
  })
}

export function stopBackupJob(): void {
  scheduled?.stop()
  scheduled = null
}
