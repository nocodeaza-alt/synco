export interface DigestTask {
  title: string
  stage: string
  priority: string | null
  goal: string | null
}

export interface DigestRequest {
  title: string
  from: string
  type: string
}

export interface DigestData {
  userName: string
  userEmail: string
  workspaceName: string
  tasksInProgress: DigestTask[]
  tasksAwaitingReview: DigestTask[]
  newRequests: DigestRequest[]
  teamDigest?: {
    totalDone: number
    totalInProgress: number
    pendingReviews: number
  }
}

const STAGE_LABEL: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  ready: 'Ready for review',
  review: 'Under review',
  done: 'Done',
  blocked: 'Blocked',
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#E5484D',
  high: '#F5A623',
  medium: '#5B4FE8',
  low: '#9CA3B5',
}

export function buildDigestHtml(data: DigestData): string {
  const greeting = `Good morning, ${data.userName.split(' ')[0]}!`

  const hasAnything =
    data.tasksInProgress.length > 0 ||
    data.tasksAwaitingReview.length > 0 ||
    data.newRequests.length > 0

  const inProgressRows = data.tasksInProgress
    .map(
      t => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;">
          <span style="font-size:14px;font-weight:600;color:#0F1B2D;">${t.title}</span>
          ${t.goal ? `<span style="font-size:11px;color:#9CA3B5;margin-left:8px;">${t.goal}</span>` : ''}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;text-align:right;">
          ${t.priority ? `<span style="font-size:11px;font-weight:700;color:${PRIORITY_COLOR[t.priority] ?? '#9CA3B5'};text-transform:uppercase;">${t.priority}</span>` : ''}
        </td>
      </tr>`
    )
    .join('')

  const reviewRows = data.tasksAwaitingReview
    .map(
      t => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;">
          <span style="font-size:14px;font-weight:600;color:#0F1B2D;">${t.title}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;text-align:right;">
          <span style="font-size:11px;font-weight:700;color:#F5A623;background:rgba(245,166,35,.14);padding:3px 8px;border-radius:99px;">REVIEW</span>
        </td>
      </tr>`
    )
    .join('')

  const requestRows = data.newRequests
    .map(
      r => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;">
          <span style="font-size:14px;font-weight:600;color:#0F1B2D;">${r.title}</span>
          <span style="font-size:12px;color:#9CA3B5;margin-left:6px;">from ${r.from}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F0F1F6;text-align:right;">
          <span style="font-size:11px;font-weight:700;color:#5B4FE8;">${r.type}</span>
        </td>
      </tr>`
    )
    .join('')

  const teamBlock =
    data.teamDigest
      ? `
      <div style="margin-top:28px;background:#F7F8FC;border-radius:14px;padding:18px 20px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:.6px;color:#B7BCCB;margin-bottom:12px;">TEAM TODAY</div>
        <table style="border-collapse:collapse;width:100%;">
          <tr>
            <td style="padding:0 24px 0 0;vertical-align:top;white-space:nowrap;">
              <div style="font-size:22px;font-weight:800;color:#0F1B2D;line-height:1.2;">${data.teamDigest.totalDone}</div>
              <div style="font-size:11px;color:#9CA3B5;margin-top:2px;">Done</div>
            </td>
            <td style="padding:0 24px 0 0;vertical-align:top;white-space:nowrap;">
              <div style="font-size:22px;font-weight:800;color:#0F1B2D;line-height:1.2;">${data.teamDigest.totalInProgress}</div>
              <div style="font-size:11px;color:#9CA3B5;margin-top:2px;">In progress</div>
            </td>
            <td style="padding:0;vertical-align:top;white-space:nowrap;">
              <div style="font-size:22px;font-weight:800;color:#F5A623;line-height:1.2;">${data.teamDigest.pendingReviews}</div>
              <div style="font-size:11px;color:#9CA3B5;margin-top:2px;">Pending review</div>
            </td>
          </tr>
        </table>
      </div>`
      : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,27,45,.08);">

    <!-- Header -->
    <div style="background:#0F1B2D;padding:24px 28px;">
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="vertical-align:middle;padding:0;">
            <table style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;padding:0 10px 0 0;">
                  <div style="width:28px;height:28px;background:#5B4FE8;border-radius:7px;text-align:center;line-height:28px;">
                    <span style="color:#fff;font-size:14px;font-weight:900;line-height:28px;">S</span>
                  </div>
                </td>
                <td style="vertical-align:middle;padding:0;">
                  <span style="color:#fff;font-size:16px;font-weight:800;letter-spacing:-.3px;">SYNCO</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="vertical-align:middle;padding:0;text-align:right;">
            <span style="color:#6B7385;font-size:13px;">${data.workspaceName}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:28px;">
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#0F1B2D;">${greeting}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7385;">Here's your daily summary for ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>

      ${!hasAnything ? `<p style="font-size:14px;color:#9CA3B5;text-align:center;padding:32px 0;">Nothing pending — enjoy a focused day! 🎯</p>` : ''}

      ${data.tasksInProgress.length > 0 ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:.6px;color:#B7BCCB;margin-bottom:12px;">IN PROGRESS · ${data.tasksInProgress.length}</div>
        <table style="width:100%;border-collapse:collapse;">${inProgressRows}</table>
      </div>` : ''}

      ${data.tasksAwaitingReview.length > 0 ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:.6px;color:#B7BCCB;margin-bottom:12px;">AWAITING YOUR REVIEW · ${data.tasksAwaitingReview.length}</div>
        <table style="width:100%;border-collapse:collapse;">${reviewRows}</table>
      </div>` : ''}

      ${data.newRequests.length > 0 ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:.6px;color:#B7BCCB;margin-bottom:12px;">NEW REQUESTS · ${data.newRequests.length}</div>
        <table style="width:100%;border-collapse:collapse;">${requestRows}</table>
      </div>` : ''}

      ${teamBlock}

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://synco.app'}/en/flow"
           style="display:inline-block;background:#5B4FE8;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:12px;">
          Open Work Flow →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;border-top:1px solid #F0F1F6;text-align:center;">
      <p style="margin:0;font-size:11px;color:#B7BCCB;">You're receiving this because you're a member of ${data.workspaceName}.<br>Daily digest is sent every weekday at 8 AM.</p>
    </div>
  </div>
</body>
</html>`
}
