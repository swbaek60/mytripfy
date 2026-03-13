const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
const LOGO_URL = `${SITE_URL}/logo.png`

/** 기본 locale (수신자 locale을 모를 때 사용) */
const DEFAULT_EMAIL_LOCALE = 'en'

/** 이메일 공통 레이아웃: 로고 + 본문 + 푸터. locale으로 푸터/링크 언어 경로 반영 */
function layout(content: string, locale: string = DEFAULT_EMAIL_LOCALE) {
  const localePath = locale || DEFAULT_EMAIL_LOCALE
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>mytripfy</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;border:1px solid #e2e8f0;">

        <!-- 헤더: 로고 -->
        <tr>
          <td style="padding:28px 32px 24px;text-align:center;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
              <img src="${LOGO_URL}" alt="mytripfy" width="140" style="display:block;max-width:140px;height:auto;border:0;" />
            </a>
          </td>
        </tr>

        <!-- 본문 -->
        <tr>
          <td style="padding:28px 32px 32px;color:#334155;font-size:15px;line-height:1.6;">
            ${content}
          </td>
        </tr>

        <!-- 푸터 -->
        <tr>
          <td style="padding:20px 32px;text-align:center;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} mytripfy &middot;
              <a href="${SITE_URL}" style="color:#f59e0b;text-decoration:none;">Visit</a> &middot;
              <a href="${SITE_URL}/${localePath}/profile/edit" style="color:#f59e0b;text-decoration:none;">Preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(text: string, href: string, color = '#f59e0b') {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${href}" style="
        display:inline-block;
        background:${color};
        color:#fff;
        text-decoration:none;
        padding:14px 32px;
        border-radius:50px;
        font-size:15px;
        font-weight:700;
        letter-spacing:0.3px;
      ">${text}</a>
    </div>`
}

function infoBox(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px;">${label}</td>
      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${value}</td>
    </tr>`
}

// ─────────────────────────────────────────────
// 가이드 문의 (contact-guide)
// ─────────────────────────────────────────────
export function contactGuideEmail({
  guideName,
  senderName,
  message,
  messagesUrl,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  guideName: string
  senderName: string
  message: string
  messagesUrl: string
  locale?: string
}) {
  const subject = `New inquiry from ${senderName} – mytripfy`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Hi ${guideName},</h2>
    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
      You have a new message from <strong>${senderName}</strong>:
    </p>
    <div style="background:#f8fafc;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Reply to this email or use the link below.</p>
    ${ctaButton('Reply on mytripfy', messagesUrl)}
  `, locale)
  return { subject, html }
}

// ─────────────────────────────────────────────
// 1. 새 가이드 요청 → 매칭 가이드에게
// ─────────────────────────────────────────────
export function guideRequestNotifyEmail({
  guideName,
  requesterName,
  requestTitle,
  country,
  city,
  startDate,
  endDate,
  languages,
  requestId,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  guideName: string
  requesterName: string
  requestTitle: string
  country: string
  city?: string
  startDate: string
  endDate: string
  languages?: string[]
  requestId: string
  locale?: string
}) {
  const subject = `🧭 New guide request in ${country} – Apply now!`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Hi ${guideName}! 👋</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      A traveler is looking for a guide in your region. Check it out!
    </p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:18px;font-weight:700;color:#92400e;margin-bottom:12px;">${requestTitle}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoBox('📍 Destination', city ? `${country} · ${city}` : country)}
        ${infoBox('📅 Dates', `${startDate} – ${endDate}`)}
        ${infoBox('👤 Requester', requesterName)}
        ${languages && languages.length > 0 ? infoBox('🗣️ Languages', languages.join(', ')) : ''}
      </table>
    </div>

    <p style="margin:0 0 4px;color:#4b5563;font-size:14px;">
      Be one of the first to apply and increase your chances of being selected!
    </p>
    ${ctaButton('View & Apply →', `${SITE_URL}/${locale}/guides/requests/${requestId}`)}

    <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
      You received this because your guide regions match this request.
    </p>
  `, locale)
  return { subject, html }
}

// ─────────────────────────────────────────────
// 2. 가이드 신청 → 요청 작성자에게
// ─────────────────────────────────────────────
export function guideApplicationEmail({
  ownerName,
  guideName,
  guideAvatarUrl,
  requestTitle,
  requestId,
  message,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  ownerName: string
  guideName: string
  guideAvatarUrl?: string
  requestTitle: string
  requestId: string
  message?: string
  locale?: string
}) {
  const subject = `🎉 ${guideName} applied to your guide request!`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Hi ${ownerName}! 🎉</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Great news! A guide has applied for your request.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${guideAvatarUrl
          ? `<img src="${guideAvatarUrl}" width="48" height="48" style="border-radius:50%;object-fit:cover;" />`
          : `<div style="width:48px;height:48px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>`
        }
        <div>
          <div style="font-size:17px;font-weight:700;color:#065f46;">${guideName}</div>
          <div style="font-size:12px;color:#6b7280;">Applied to: ${requestTitle}</div>
        </div>
      </div>
      ${message ? `
        <div style="background:white;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="font-size:12px;color:#9ca3af;margin-bottom:4px;">Message from guide:</div>
          <div style="font-size:14px;color:#374151;line-height:1.6;">${message}</div>
        </div>
      ` : ''}
    </div>

    <p style="margin:0 0 4px;color:#4b5563;font-size:14px;">
      Review the guide's profile and accept or decline the application.
    </p>
    ${ctaButton('Review Application →', `${SITE_URL}/${locale}/guides/requests/${requestId}`, '#10b981')}
  `, locale)
  return { subject, html }
}

// ─────────────────────────────────────────────
// 3. 신청 수락 → 가이드에게
// ─────────────────────────────────────────────
export function guideApplicationAcceptedEmail({
  guideName,
  ownerName,
  requestTitle,
  requestId,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  guideName: string
  ownerName: string
  requestTitle: string
  requestId: string
  locale?: string
}) {
  const subject = `🎊 Your guide application was accepted!`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Congratulations, ${guideName}! 🎊</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Your application has been accepted. Time to connect with the traveler!
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoBox('📋 Request', requestTitle)}
        ${infoBox('👤 Traveler', ownerName)}
      </table>
    </div>

    <p style="margin:0 0 4px;color:#4b5563;font-size:14px;">
      Send a message to coordinate the details of your guide service.
    </p>
    ${ctaButton('View Request & Message →', `${SITE_URL}/${locale}/guides/requests/${requestId}`, '#3b82f6')}
  `, locale)
  return { subject, html }
}

// ─────────────────────────────────────────────
// 동행 (Companion) 이메일 템플릿
// ─────────────────────────────────────────────

// 5. 동행 신청 → 호스트에게
export function companionApplicationEmail({
  hostName,
  applicantName,
  applicantAvatarUrl,
  postTitle,
  postId,
  message,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  hostName: string
  applicantName: string
  applicantAvatarUrl?: string
  postTitle: string
  postId: string
  message?: string
  locale?: string
}) {
  const subject = `✈️ ${applicantName} applied to join your trip!`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Hi ${hostName}! ✈️</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Someone wants to join your trip. Check them out!
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${applicantAvatarUrl
          ? `<img src="${applicantAvatarUrl}" width="48" height="48" style="border-radius:50%;object-fit:cover;" />`
          : `<div style="width:48px;height:48px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>`
        }
        <div>
          <div style="font-size:17px;font-weight:700;color:#1e40af;">${applicantName}</div>
          <div style="font-size:12px;color:#6b7280;">Applied to: ${postTitle}</div>
        </div>
      </div>
      ${message ? `
        <div style="background:white;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="font-size:12px;color:#9ca3af;margin-bottom:4px;">Message:</div>
          <div style="font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${message}"</div>
        </div>
      ` : ''}
    </div>
    ${ctaButton('Review Application →', `${SITE_URL}/${locale}/companions/${postId}`, '#3b82f6')}
  `, locale)
  return { subject, html }
}

// 6. 동행 수락 → 신청자에게
export function companionApplicationAcceptedEmail({
  applicantName,
  hostName,
  postTitle,
  postId,
  country,
  startDate,
  endDate,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  applicantName: string
  hostName: string
  postTitle: string
  postId: string
  country: string
  startDate: string
  endDate: string
  locale?: string
}) {
  const subject = `🎉 You're in! "${postTitle}"`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Congratulations, ${applicantName}! 🎉</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      You've been accepted to join the trip!
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:18px;font-weight:700;color:#065f46;margin-bottom:12px;">🌍 ${postTitle}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoBox('📍 Destination', country)}
        ${infoBox('📅 Dates', `${startDate} – ${endDate}`)}
        ${infoBox('👤 Host', hostName)}
      </table>
    </div>

    <p style="margin:0 0 4px;color:#4b5563;font-size:14px;">
      Join the group chat to coordinate with your travel companions!
    </p>
    ${ctaButton('View Trip & Group Chat →', `${SITE_URL}/${locale}/companions/${postId}`, '#10b981')}
  `, locale)
  return { subject, html }
}

// 7. 동행 거절 → 신청자에게
export function companionApplicationRejectedEmail({
  applicantName,
  postTitle,
  postId,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  applicantName: string
  postTitle: string
  postId: string
  locale?: string
}) {
  const subject = `Trip application update – ${postTitle}`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Hi ${applicantName}</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Unfortunately, your application for <strong>${postTitle}</strong> was not accepted this time.
    </p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">
      Don't give up! There are many more amazing trips looking for companions like you. 
      Keep exploring and apply to other trips!
    </p>
    ${ctaButton('Browse More Trips →', `${SITE_URL}/${locale}/companions`, '#6b7280')}
  `, locale)
  return { subject, html }
}

// ─────────────────────────────────────────────
// 4. 신청 거절 → 가이드에게
// ─────────────────────────────────────────────
export function guideApplicationRejectedEmail({
  guideName,
  requestTitle,
  requestId,
  locale = DEFAULT_EMAIL_LOCALE,
}: {
  guideName: string
  requestTitle: string
  requestId: string
  locale?: string
}) {
  const subject = `Guide application update – ${requestTitle}`
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Hi ${guideName}</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Unfortunately, your application for <strong>${requestTitle}</strong> was not selected this time.
    </p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;">
      Don't be discouraged! There are many more travelers looking for guides like you. 
      Keep your profile updated and apply to more requests.
    </p>
    ${ctaButton('Browse Guide Requests →', `${SITE_URL}/${locale}/guides/requests`, '#6b7280')}
  `, locale)
  return { subject, html }
}
