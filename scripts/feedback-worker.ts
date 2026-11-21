import nodemailer from "nodemailer";
import { feedbackRuntime } from "../src/feedback/runtime";
import { notificationStore, runNotifications } from "../src/feedback/outbox";
import { hostingerNotice } from "../src/feedback/smtp";

async function run() {
  const runtime = feedbackRuntime();
  const { FEEDBACK_SMTP_PASSWORD: password, FEEDBACK_OWNER_INBOX: recipient } = process.env;
  if (!runtime || process.env.CRE_FEEDBACK_STAGE_MAIL !== "enabled" || !password || !recipient) {
    throw new Error("Staging worker configuration is incomplete");
  }
  const timeout = setTimeout(() => {
    console.error("The staging feedback worker reached its deadline.");
    process.exit(1);
  }, 100_000);
  const transport = nodemailer.createTransport({
    host: "smtp.hostinger.com", port: 465, secure: true,
    auth: { user: "feedback@thecreledger.com", pass: password },
    tls: { rejectUnauthorized: true }, connectionTimeout: 7000, greetingTimeout: 7000, socketTimeout: 8000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    await runNotifications(notificationStore(runtime.db), hostingerNotice(message => transport.sendMail(message), recipient), runtime.config.origin);
  } finally {
    try {
      transport.close();
      await runtime.close();
    } finally {
      clearTimeout(timeout);
    }
  }
}

run().catch(() => {
  console.error("The staging feedback worker could not complete.");
  process.exitCode = 1;
});
