// Email sending via Brevo HTTP API (replaces nodemailer SMTP — Render blocks SMTP)
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send an email via Brevo's transactional HTTP API.
 * Uses fetch() over HTTPS — works on every hosting platform.
 */
const sendViaBrev = async ({ from, fromName, to, subject, html, text, attachments }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const senderEmail = from || process.env.SENDER_EMAIL || process.env.EMAIL_USER;
  const senderName = fromName || "DocuVerse";

  const body = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html || undefined,
    textContent: text || undefined,
  };

  // Brevo attachments: [{ name, content (base64) }]
  if (attachments && attachments.length > 0) {
    body.attachment = attachments.map((a) => ({
      name: a.filename || "document.docx",
      content: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : a.content,
    }));
  }

  const resp = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Brevo API error ${resp.status}: ${errText}`);
  }

  const result = await resp.json();
  console.log("Brevo email sent:", result.messageId || JSON.stringify(result));
  return result;
};

// ─── HTML helpers ───────────────────────────────────────────────────

const buildDocuVerseHeaderHtml = (subtitle = "") => {
  const subtitleHtml = subtitle
    ? `<p style="margin:6px 0 0 0; color:#8b949e; font-size:12px;">${subtitle}</p>`
    : "";

  return `
    <div style="background:#0d1117; border:1px solid #30363d; border-radius:10px; padding:16px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle;">
            <div style="width:40px; height:40px; border-radius:10px; background:#0a0a0a; border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-weight:700;">
              <span style="color:#22d3ee; margin-right:1px;">&gt;</span>
              <span style="color:#ffffff;">_</span>
            </div>
          </td>
          <td style="padding-left:12px; vertical-align:middle;">
            <div style="font-family:Arial, sans-serif;">
              <div style="color:#ffffff; font-size:18px; font-weight:800; letter-spacing:-0.2px;">DocuVerse</div>
              ${subtitleHtml}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const buildDocuVerseFooterHtml = () => {
  return `
    <div style="margin-top:18px; color:#6e7781; font-size:12px; font-family:Arial, sans-serif;">
      This email was sent by DocuVerse. If you didn't request this, you can ignore it.
    </div>
  `;
};

// ─── Public email functions ─────────────────────────────────────────

const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

    await sendViaBrev({
      to: email,
      subject: "Please verify your email address",
      text: `Thank you for registering! Please verify your email address: ${verificationUrl}\nThis link expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial, sans-serif; line-height:1.6; color:#111;">
          ${buildDocuVerseHeaderHtml("Account verification")}
          <div style="padding:16px 2px 0 2px;">
            <h2 style="margin:0 0 8px 0; font-size:18px;">Verify your email</h2>
            <p style="margin:0 0 12px 0;">Thank you for registering with DocuVerse. Please verify your email to complete your registration.</p>
            <p style="margin:0 0 14px 0;">
              <a href="${verificationUrl}" style="background:#238636; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:8px; display:inline-block; font-weight:700;">Verify Email</a>
            </p>
            <p style="margin:0 0 10px 0; color:#444; font-size:12px;">Or copy this link:</p>
            <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background:#f6f8fa; border:1px solid #d0d7de; border-radius:8px; padding:10px; word-break:break-all;">${verificationUrl}</div>
            ${buildDocuVerseFooterHtml()}
          </div>
        </div>
      `,
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
    await sendViaBrev({
      fromName: "DocuVerse Security",
      to: email,
      subject: "Your password verification code",
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color:#111;">
          ${buildDocuVerseHeaderHtml("Security verification")}
          <div style="padding:16px 2px 0 2px;">
            <h2 style="margin:0 0 8px 0; font-size:18px;">Password verification code</h2>
            <p style="margin:0 0 10px 0;">Use this code to change your password:</p>
            <div style="font-size: 24px; font-weight: 800; letter-spacing: 6px; margin: 12px 0; padding: 12px 14px; border:1px solid #d0d7de; border-radius:10px; display:inline-block; background:#f6f8fa;">
              ${otp}
            </div>
            <p style="margin:10px 0 0 0;">This code expires in 10 minutes.</p>
            ${buildDocuVerseFooterHtml()}
          </div>
        </div>
      `,
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

    await sendViaBrev({
      to: email,
      subject: "Thank you for your suggestion",
      text: `Hi ${safeName},\n\nThank you for sharing your suggestion with DocuVerse.\n\nSuggestion: ${safeTitle}\nPriority: ${safePriority}\n\nWe received it successfully and our team will review it soon.\n\nRegards,\nDocuVerse Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#111;">
          ${buildDocuVerseHeaderHtml("Feature suggestion received")}
          <div style="padding:16px 2px 0 2px;">
            <h2 style="margin:0 0 8px 0; font-size:18px;">Thank you for your suggestion</h2>
            <p style="margin:0 0 10px 0;">Hi <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 12px 0;">We received your suggestion successfully and will review it soon.</p>
            <div style="padding:12px; border:1px solid #d0d7de; border-radius:10px; background:#f6f8fa;">
              <p style="margin:0;"><strong>Suggestion:</strong> ${safeTitle}</p>
              <p style="margin:6px 0 0 0;"><strong>Priority:</strong> ${safePriority}</p>
            </div>
            ${buildDocuVerseFooterHtml()}
          </div>
        </div>
      `,
    });

    console.log("Suggestion acknowledgement sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending suggestion acknowledgement:", error);
    return { ok: false, error: error?.message || "Unknown email error" };
  }
};

module.exports = { sendVerificationEmail, sendPasswordOTP, sendSuggestionAcknowledgement };
