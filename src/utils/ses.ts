import { Resend } from 'resend'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@mytripfy.com'
const FROM_NAME = process.env.SES_FROM_NAME || 'mytripfy'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

async function sendViaResend(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: { name: 'CONFIG', message: 'RESEND_API_KEY not set' } }

  const resend = new Resend(apiKey)
  const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to]

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toAddresses,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text && { text: payload.text }),
      ...(payload.replyTo && { replyTo: payload.replyTo }),
    })
    if (error) {
      console.error('[Resend] 발송 실패:', error)
      return { success: false, error }
    }
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[Resend] 에러:', error)
    return { success: false, error }
  }
}

async function sendViaSES(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return { success: false, error: { name: 'CONFIG', message: 'AWS credentials not set' } }
  }

  const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to]
  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: { ToAddresses: toAddresses },
    ReplyToAddresses: payload.replyTo ? [payload.replyTo] : undefined,
    Message: {
      Subject: { Data: payload.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: payload.html, Charset: 'UTF-8' },
        ...(payload.text && { Text: { Data: payload.text, Charset: 'UTF-8' } }),
      },
    },
  })

  try {
    const result = await sesClient.send(command)
    return { success: true, messageId: result.MessageId }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; Code?: string }
    console.error('[SES] 발송 실패:', err?.name || err?.Code, err?.message || String(error))
    return { success: false, error }
  }
}

export async function sendEmail(payload: EmailPayload) {
  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(payload)
    if (result.success) return result
    console.warn('[Email] Resend failed, trying SES fallback...')
  }

  return sendViaSES(payload)
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  htmlFactory: (name: string) => string
) {
  const results = await Promise.allSettled(
    recipients.map(({ email, name }) =>
      sendEmail({ to: email, subject, html: htmlFactory(name || 'Traveler') })
    )
  )
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - succeeded
  return { succeeded, failed, total: results.length }
}
