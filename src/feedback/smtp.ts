import "server-only";
import nodemailer from "nodemailer";
import type { SendNotice } from "./outbox";

export function hostingerTransport(password: string) {
  return nodemailer.createTransport({
    host: "smtp.hostinger.com", port: 465, secure: true,
    auth: { user: "feedback@thecreledger.com", pass: password },
    tls: { rejectUnauthorized: true }, connectionTimeout: 7000, greetingTimeout: 7000, socketTimeout: 8000,
    disableFileAccess: true, disableUrlAccess: true,
  });
}

type SendMail = (message: { from: string; to: string; subject: string; text: string; messageId: string }) =>
  Promise<{ accepted: unknown[]; rejected: unknown[] }>;

export function hostingerNotice(sendMail: SendMail, ownerRecipient: string): SendNotice {
  if (!/^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/.test(ownerRecipient)) {
    throw new Error("A single owner notification recipient is required");
  }
  return async notice => {
    try {
      const result = await sendMail({ ...notice, from: "feedback@thecreledger.com", to: ownerRecipient });
      return result.accepted.length === 1 && result.rejected.length === 0 ? "sent" : "uncertain";
    } catch (error) {
      // Only explicit SMTP rejection before DATA is eligible for automatic retry.
      const reply = error as { command?: string; responseCode?: number } | null;
      const code = reply?.responseCode;
      if (["AUTH", "MAIL FROM", "RCPT TO"].includes(reply?.command ?? "") && Number.isInteger(code)) {
        if (code! >= 400 && code! < 500) return "retry";
        if (code! >= 500 && code! < 600) return "failed";
      }
      return "uncertain";
    }
  };
}
