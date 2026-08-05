import { createAdminClient } from '@/utils/supabase/server'

export async function createUserNotification(input: {
  userId: string
  type: string
  title: string
  message?: string
  referenceId?: string
  referenceType?: string
}) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    reference_id: input.referenceId ?? null,
    reference_type: input.referenceType ?? null,
  })
}

/** Companion application → host in-app + push queue */
export async function notifyCompanionApplication(input: {
  hostId: string
  postId: string
  postTitle: string
  applicantName: string
}) {
  await createUserNotification({
    userId: input.hostId,
    type: 'companion_application',
    title: 'New companion application',
    message: `${input.applicantName} applied to "${input.postTitle}"`,
    referenceId: input.postId,
    referenceType: 'companion_post',
  })
  await queuePushForUser(input.hostId, {
    title: 'New companion application',
    body: `${input.applicantName} wants to join your trip`,
    data: { type: 'companion_application', postId: input.postId },
  })
}

async function queuePushForUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> }
) {
  const admin = createAdminClient()
  const { data: tokens } = await admin
    .from('push_device_tokens')
    .select('token, platform')
    .eq('user_id', userId)

  if (!tokens?.length) return

  // FCM/APNs delivery: set FCM_SERVER_KEY and call sendPushToToken per token.
  // Tokens are stored for Capacitor app push when configured.
  if (process.env.FCM_SERVER_KEY) {
    for (const row of tokens) {
      await sendFcm(row.token, payload).catch(err => {
        console.error('[push] FCM failed', err)
      })
    }
  }
}

async function sendFcm(
  token: string,
  payload: { title: string; body: string; data?: Record<string, string> }
) {
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
    }),
  })
  if (!res.ok) throw new Error(await res.text())
}
