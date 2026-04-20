import morgan from 'morgan'
import { morganStream } from '../config/logger.js'
import { env } from '../config/env.js'

// Healthz pings come from Render's uptime monitor every few seconds and drown
// out real request traffic. Log only every Nth hit so the line stays visible
// as a heartbeat without obstructing the rest of the log.
const HEALTHZ_SAMPLE_RATE = 1000
let healthzHits = 0

export const requestLogger = morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: morganStream,
  skip: (req) => {
    if (env.NODE_ENV === 'test') return true
    if (req.url === '/healthz' || req.url === '/api/healthz') {
      healthzHits += 1
      return healthzHits % HEALTHZ_SAMPLE_RATE !== 0
    }
    return false
  }
})
