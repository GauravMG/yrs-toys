import { emailLayout, emailButton } from "./layout.js";

export function passwordResetEmail(params: { fullName: string; resetUrl: string }): { subject: string; html: string } {
  const html = emailLayout(`
    <p>Hi ${params.fullName},</p>
    <p>We received a request to reset your YRS Toys password. This link is valid for 30 minutes.</p>
    <p style="text-align:center;margin:26px 0;">${emailButton(params.resetUrl, "Reset your password")}</p>
    <p style="color:#5C574C;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `);
  return { subject: "Reset your YRS Toys password", html };
}
