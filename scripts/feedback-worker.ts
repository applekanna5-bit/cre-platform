import { feedbackRuntime } from "../src/feedback/runtime";
import { notificationStore, runNotifications } from "../src/feedback/outbox";
import { hostingerNotice, hostingerTransport } from "../src/feedback/smtp";

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
  const transport = hostingerTransport(password);
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
