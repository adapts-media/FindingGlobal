import nodemailer from "nodemailer";

/**
 * Send an email using nodemailer.
 * Falls back to console logging if SMTP environment variables are not set.
 */
export async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  const from = SMTP_FROM || "no-reply@findingglobal.com";

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("\n==================================================");
    console.log(`[EMAIL FALLBACK] To: ${to}`);
    console.log(`[EMAIL FALLBACK] Subject: ${subject}`);
    console.log(`[EMAIL FALLBACK] Text: ${text}`);
    console.log("==================================================\n");
    return { mock: true, success: true };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587", 10),
    secure: SMTP_PORT === "465",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Finding Global" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email] Sent message to ${to}: ${info.messageId}`);
    return { mock: false, success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error.message || error);
    console.log("\n==================================================");
    console.log(`[EMAIL FALLBACK - SEND FAILURE] To: ${to}`);
    console.log(`[EMAIL FALLBACK - SEND FAILURE] Subject: ${subject}`);
    console.log(`[EMAIL FALLBACK - SEND FAILURE] Text: ${text}`);
    console.log("==================================================\n");
    return { mock: true, success: true, error: error.message };
  }
}
