import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@mytripfy.com'
const FROM_NAME = process.env.SES_FROM_NAME || 'mytripfy'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  /** 가이드 문의 등: 수신자가 답장 시 이 주소로 감 */
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: EmailPayload) {
  const toAddresses = Array.isArray(to) ? to : [to]

  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: {
      ToAddresses: toAddresses,
    },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
        ...(text && {
          Text: {
            Data: text,
            Charset: 'UTF-8',
          },
        }),
      },
    },
  })

  try {
    const result = await sesClient.send(command)
    return { success: true, messageId: result.MessageId }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; Code?: string }
    console.error('[SES] 이메일 발송 실패:', err?.name || err?.Code, err?.message || String(error))
    return { success: false, error }
  }
}

// 여러 수신자에게 개별 발송 (BCC 대신 각자에게)
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
