// Email sending via Google Apps Script gateway (HTTPS → Gmail)
// Works on ANY hosting (Render, Vercel, etc.) — no SMTP, no domain verification

/**
 * Send an email via the Google Apps Script web app gateway.
 * The Apps Script calls GmailApp.sendEmail() internally.
 */
const sendViaGateway = async ({ to, subject, html, text, fromName, replyTo, attachments }) => {
  const gatewayUrl = process.env.GMAIL_APPS_SCRIPT_URL;
  const token = process.env.GMAIL_APPS_SCRIPT_TOKEN || 'docuverse-email-secret-2026';

  if (!gatewayUrl) throw new Error("GMAIL_APPS_SCRIPT_URL is not set");

  const body = {
    token,
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
    fromName: fromName || 'DocuVerse',
    replyTo: replyTo || undefined,
  };

  if (attachments && attachments.length > 0) {
    body.attachments = attachments.map((a) => ({
      filename: a.filename || "document.docx",
      content: Buffer.isBuffer(a.content) ? a.content.toString("base64") : a.content,
      contentType: a.contentType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }));
  }

  const resp = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: 'follow',
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gmail gateway error ${resp.status}: ${errText}`);
  }

  const result = await resp.json();
  if (result.error) throw new Error(`Gmail gateway error: ${result.error}`);
  console.log("Email sent via Gmail gateway:", JSON.stringify(result));
  return result;
};

// ─── Shared email wrapper ───────────────────────────────────────────

const wrapInDarkTemplate = (headerTitle, headerSubtitle, bodyContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#161b22 0%,#0d1117 100%);border:1px solid #30363d;border-radius:12px 12px 0 0;padding:20px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="width:44px;height:44px;border-radius:10px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.12);text-align:center;line-height:44px;font-family:'Courier New',monospace;font-weight:700;font-size:18px;">
            <span style="color:#22d3ee;">&gt;</span><span style="color:#fff;">_</span>
          </div>
        </td>
        <td style="padding-left:14px;vertical-align:middle;">
          <div style="color:#e6edf3;font-size:20px;font-weight:800;letter-spacing:-0.3px;">${headerTitle}</div>
          ${headerSubtitle ? `<div style="color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:0.5px;margin-top:3px;">${headerSubtitle}</div>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#161b22;border-left:1px solid #30363d;border-right:1px solid #30363d;padding:24px;">
    ${bodyContent}
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0d1117;border:1px solid #30363d;border-top:none;border-radius:0 0 12px 12px;padding:16px 24px;">
    <p style="margin:0;color:#484f58;font-size:11px;line-height:1.5;">
      This is an automated delivery from DocuVerse. If you didn't request this, you can safely ignore it.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

// ─── Public email functions ─────────────────────────────────────────

const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

    const bodyContent = `
      <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">Hello,</p>
      <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">
        Thank you for registering with DocuVerse. Please verify your email to complete your registration.
      </p>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr><td>
          <a href="${verificationUrl}" style="display:inline-block;background:#238636;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
            ✅ Verify Email Address
          </a>
        </td></tr>
      </table>

      <!-- Link Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px 16px;">
          <p style="margin:0 0 6px 0;color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">🔗 Verification Link</p>
          <a href="${verificationUrl}" style="color:#58a6ff;font-size:12px;word-break:break-all;text-decoration:none;">${verificationUrl}</a>
        </td></tr>
      </table>

      <p style="margin:16px 0 0 0;color:#8b949e;font-size:12px;">This link expires in <strong style="color:#e6edf3;">10 minutes</strong>.</p>
    `;

    await sendViaGateway({
      to: email,
      subject: "Please verify your email address — DocuVerse",
      html: wrapInDarkTemplate("DocuVerse", "Account Verification", bodyContent),
      text: `Thank you for registering! Verify your email: ${verificationUrl}\nThis link expires in 10 minutes.`,
    });

    console.log("Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

const sendPasswordOTP = async (email, otp) => {
  try {
    const digits = String(otp).split('');
    const otpBoxes = digits.map(d =>
      `<td style="width:42px;height:50px;background:#0d1117;border:1px solid #30363d;border-radius:8px;text-align:center;vertical-align:middle;font-size:24px;font-weight:800;color:#e6edf3;font-family:'Courier New',monospace;letter-spacing:0;">${d}</td>`
    ).join('<td style="width:8px;"></td>');

    const bodyContent = `
      <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">Hello,</p>
      <p style="margin:0 0 20px 0;color:#c9d1d9;font-size:14px;">
        Use the following code to verify your password change:
      </p>

      <!-- OTP Code -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
        <tr>${otpBoxes}</tr>
      </table>

      <!-- Expiry Warning -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px 16px;text-align:center;">
          <p style="margin:0;color:#8b949e;font-size:12px;">⏱️ This code expires in <strong style="color:#f0883e;">10 minutes</strong></p>
        </td></tr>
      </table>

      <p style="margin:16px 0 0 0;color:#484f58;font-size:12px;">If you didn't request this code, please ignore this email or contact support.</p>
    `;

    await sendViaGateway({
      to: email,
      subject: "Your verification code — DocuVerse",
      html: wrapInDarkTemplate("DocuVerse", "Security Verification", bodyContent),
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    });

    console.log("Password OTP sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending password OTP:", error);
    return { ok: false, error: error?.message || "Unknown email error" };
  }
};

const sendSuggestionAcknowledgement = async ({ email, name, title, priority }) => {
  try {
    const safeName = name || "there";
    const safeTitle = title || "your idea";
    const safePriority = priority || "Medium";

    const priorityColor = safePriority.toLowerCase() === 'high' ? '#f85149'
      : safePriority.toLowerCase() === 'low' ? '#3fb950' : '#f0883e';

    const bodyContent = `
      <p style="margin:0 0 16px 0;color:#c9d1d9;font-size:14px;">Hi <strong style="color:#e6edf3;">${safeName}</strong>,</p>
      <p style="margin:0 0 20px 0;color:#c9d1d9;font-size:14px;">
        Thank you for sharing your suggestion with DocuVerse! We received it successfully and our team will review it soon.
      </p>

      <!-- Suggestion Details Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:16px;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#8b949e;font-size:12px;padding:4px 0;width:100px;vertical-align:top;">💡 Suggestion:</td>
              <td style="color:#e6edf3;font-size:13px;font-weight:600;padding:4px 0;">${safeTitle}</td>
            </tr>
            <tr>
              <td style="color:#8b949e;font-size:12px;padding:4px 0;width:100px;vertical-align:top;">📊 Priority:</td>
              <td style="padding:4px 0;">
                <span style="display:inline-block;background:${priorityColor};color:#ffffff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:0.3px;">${safePriority}</span>
              </td>
            </tr>
            <tr>
              <td style="color:#8b949e;font-size:12px;padding:4px 0;width:100px;vertical-align:top;">📌 Status:</td>
              <td style="padding:4px 0;">
                <span style="display:inline-block;background:#1f6feb;color:#ffffff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:0.3px;">Under Review</span>
              </td>
            </tr>
          </table>

        </td></tr>
      </table>

      <p style="margin:16px 0 0 0;color:#8b949e;font-size:12px;">We appreciate your feedback — it helps us build a better product. 🚀</p>
    `;

    await sendViaGateway({
      to: email,
      subject: "Thank you for your suggestion — DocuVerse",
      html: wrapInDarkTemplate("DocuVerse", "Feature Suggestion Received", bodyContent),
      text: `Hi ${safeName},\n\nThank you for your suggestion.\n\nSuggestion: ${safeTitle}\nPriority: ${safePriority}\nStatus: Under Review\n\nWe'll review it soon.\n\nDocuVerse Team`,
    });

    console.log("Suggestion acknowledgement sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending suggestion acknowledgement:", error);
    return { ok: false, error: error?.message || "Unknown email error" };
  }
};

module.exports = { sendVerificationEmail, sendPasswordOTP, sendSuggestionAcknowledgement };
