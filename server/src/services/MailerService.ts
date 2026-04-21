import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS must be set to send mail')
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  })
  return transporter
}

export interface MailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendMailInput {
  to: string
  subject: string
  text: string
  attachments?: MailAttachment[]
}

export const MailerService = {
  async send(input: SendMailInput): Promise<void> {
    const t = getTransporter()
    const from = env.BACKUP_EMAIL_FROM || env.SMTP_USER
    await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: input.attachments
    })
    logger.info('mail sent', { to: input.to, subject: input.subject })
  }
}
