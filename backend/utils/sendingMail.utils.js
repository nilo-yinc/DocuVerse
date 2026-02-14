// email sending using nodemailer
const dns = require("dns");
const nodemailer = require("nodemailer");

// Custom DNS lookup that forces IPv4 — Render blocks IPv6 to Gmail
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  options = Object.assign({}, options, { family: 4 });
  return dns.lookup(hostname, options, callback);
};

const buildTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,              // direct SSL on port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    dnsLookup: ipv4Lookup,     // force IPv4 DNS resolution
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
};

const buildDocuVerseHeaderHtml = (subtitle = "") => {
  const subtitleHtml = subtitle
    ? `<p style="margin:6px 0 0 0; color:#8b949e; font-size:12px;">${subtitle}</p>`
    : "";

  // Email-safe layout: tables + inline styles (avoid SVG; keep it simple for Gmail)
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
      This email was sent by DocuVerse. If you didn’t request this, you can ignore it.
    </div>
  `;
};

const sendVerificationEmail = async (email, token) => {
  try {

    // create email transporter
    const transporter = buildTransporter();

    // verification URL
    const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

    // email content
    const mailOptions = {
      from: `"DocuVerse" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Please verify your email address",
      text: `
        Thank you for registering! Please verify your email address to complete your registration.
        ${verificationUrl}
        This verification link will expire in 10 mins.
        If you did not create an account, please ignore this email.
      `,
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
      `
    };

    // send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: %s ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

const sendPasswordOTP = async (email, otp) => {
  try {
    const transporter = buildTransporter();
    const mailOptions = {
      from: `"DocuVerse Security" <${process.env.SENDER_EMAIL}>`,
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
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Password OTP sent: %s ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password OTP:", error);
    return { ok: false, error: error?.message || "Unknown email error" };
  }
};

const sendSuggestionAcknowledgement = async ({ email, name, title, priority }) => {
  try {
    const transporter = buildTransporter();
    const safeName = name || "there";
    const safeTitle = title || "your idea";
    const safePriority = priority || "Medium";

    const mailOptions = {
      from: `"DocuVerse" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Thank you for your suggestion",
      text: `Hi ${safeName},

Thank you for sharing your suggestion with DocuVerse.

Suggestion: ${safeTitle}
Priority: ${safePriority}

We received it successfully and our team will review it soon.
We appreciate your feedback and support.

Regards,
DocuVerse Team`,
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
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Suggestion acknowledgement sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending suggestion acknowledgement:", error);
    return { ok: false, error: error?.message || "Unknown email error" };
  }
};

module.exports = { sendVerificationEmail, sendPasswordOTP, sendSuggestionAcknowledgement };
