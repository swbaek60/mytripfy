/**
 * 이메일 발송 유틸리티
 * 우선순위: Resend → AWS SES (폴백)
 *
 * 환경변수:
 *   RESEND_API_KEY        - Resend API 키 (주 발송 수단)
 *   AWS_ACCESS_KEY_ID     - AWS 자격증명 (폴백용, 선택)
 *   AWS_SECRET_ACCESS_KEY - AWS 자격증명 (폴백용, 선택)
 *   SES_FROM_EMAIL        - 발신 이메일 주소
 *   SES_FROM_NAME         - 발신자 이름
 */
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

export interface EmailResult {
  success: boolean
  messageId?: string
  provider?: 'resend' | 'ses'
  error?: unknown
}

// ── Resend ──────────────────────────────────────────────────────────
async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' }

  const resend = new Resend(apiKey)
  const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to]

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: toAddresses,
    subject: payload.subject,
    html: payload.html,
    ...(payload.text && { text: payload.text }),
    ...(payload.replyTo && { replyTo: payload.replyTo }),
  })

  if (error) {
    console.error('[email] Resend 발송 실패:', error)
    return { success: false, error, provider: 'resend' }
  }
  return { success: true, messageId: data?.id, provider: 'resend' }
}

// ── AWS SES (폴백) ───────────────────────────────────────────────────
async function sendViaSES(payload: EmailPayload): Promise<EmailResult> {
  const accessKey = process.env.AWS_ACCESS_KEY_ID
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKey || !secretKey) {
    return { success: false, error: 'AWS credentials not configured', provider: 'ses' }
  }

  const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
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
    return { success: true, messageId: result.MessageId, provider: 'ses' }
  } catch (error) {
    const err = error as { name?: string; message?: string }
    console.error('[email] SES 발송 실패:', err?.name, err?.message)
    return { success: false, error, provider: 'ses' }
  }
}

// ── 메인 발송 함수 ────────────────────────────────────────────────────
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  // 1) Resend 시도
  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(payload)
    if (result.success) return result
    console.warn('[email] Resend 실패, SES 폴백 시도...')
  }

  // 2) SES 폴백
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return sendViaSES(payload)
  }

  console.error('[email] 이메일 발송 수단 없음 - RESEND_API_KEY 또는 AWS 자격증명 필요')
  return { success: false, error: 'No email provider configured' }
}

// ── 다중 발송 ─────────────────────────────────────────────────────────
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
  const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as EmailResult).success).length
  const failed = results.length - succeeded
  return { succeeded, failed, total: results.length }
}
