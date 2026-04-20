import path from 'node:path'
import fs from 'node:fs'
import winston from 'winston'
import 'winston-daily-rotate-file'
import { env } from './env.js'

const logsDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const { combine, timestamp, printf, errors, colorize, json } = winston.format

const plain = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const m = stack ?? message
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `${ts} ${level}: ${m}${extra}`
})

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), errors({ stack: true }), plain),
      silent: env.NODE_ENV === 'test'
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'info'
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error'
    })
  ]
})

export const morganStream = {
  write: (message: string) => logger.info(message.trim())
}
