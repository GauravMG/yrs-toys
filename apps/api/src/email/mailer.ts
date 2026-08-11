import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
