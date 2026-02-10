// email sending using nodemailer
const nodemailer = require("nodemailer");

const buildTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendVerificationEmail = async (email, token) => {
  try {

    console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
    console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);

    // create email transporter
    const transporter = buildTransporter();

    // verification URL
    const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

    // email content
    const mailOptions = {
      from: `"Authentication App" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Please verify your email address",
      text: `
        Thank you for registering! Please verify your email address to complete your registration.
        ${verificationUrl}
        This verification link will expire in 10 mins.
        If you did not create an account, please ignore this email.
      `,
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
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password Verification Code</h2>
          <p>Use this code to change your password:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
            ${otp}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
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

module.exports = { sendVerificationEmail, sendPasswordOTP };
