import { randomInt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { hostingerTransport } from "../src/feedback/smtp";
import { createOwnerAuth } from "../src/feedback/owner-auth-config";
import { feedbackRuntime } from "../src/feedback/runtime";

async function provision() {
  if (!process.stdin.isTTY || !process.stdout.isTTY || process.env.CRE_FEEDBACK_OWNER_BOOTSTRAP !== "enabled") {
    throw new Error("Owner bootstrap requires an attended private staging terminal.");
  }
  const runtime = feedbackRuntime();
  const { FEEDBACK_OWNER_INBOX: email, FEEDBACK_SMTP_PASSWORD: password } = process.env;
  if (!runtime || !email || email.length > 254 || !/^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/.test(email) || !password) {
    throw new Error("Complete the private staging configuration first.");
  }
  const operation = setTimeout(() => process.exit(1), 600_000).unref();
  const output = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const terminal = createInterface({ input: process.stdin, output, terminal: true });
  const transport = hostingerTransport(password);
  async function prompt(text: string) {
    process.stdout.write(text + " ");
    const value = await terminal.question("");
    process.stdout.write("\n");
    return value;
  }
  const connection = await runtime.pool.getConnection();
  let locked = false;
  try {
    const [result] = await connection.query<import("mysql2").RowDataPacket[]>("SELECT GET_LOCK('cre_feedback_stage_owner_v1', 0) AS acquired");
    locked = Number(result[0]?.acquired) === 1;
    if (!locked) throw new Error("Owner bootstrap is already running.");
    const [existing] = await runtime.db.rows<{ count: number }>("SELECT COUNT(*) AS count FROM feedback_auth_user");
    const [binding] = await runtime.db.rows<{ slot: number }>("SELECT slot FROM feedback_auth_owner WHERE slot = 1");
    if (Number(existing.count) !== 0 || binding) throw new Error("An owner or unfinished account already exists.");

    const code = String(randomInt(100_000, 1_000_000));
    const expires = Date.now() + 300_000;
    const delivery = await transport.sendMail({
      from: "feedback@thecreledger.com", to: email, subject: "The CRE Ledger staging owner verification",
      text: `Your staging owner verification code is ${code}. It expires in five minutes.`,
    });
    if (delivery.accepted.length !== 1 || delivery.rejected.length !== 0 ||
        await prompt("Enter the mailbox verification code:") !== code || Date.now() > expires) throw new Error("Mailbox verification failed.");

    const ownerPassword = await prompt("Choose a unique password of at least 16 characters:");
    if (ownerPassword.length < 16 || ownerPassword.length > 128 ||
        ownerPassword !== await prompt("Confirm the owner password:")) throw new Error("Passwords did not match or met no valid length.");

    const sdk = createOwnerAuth({
      database: runtime.pool.pool, origin: runtime.config.origin, secret: runtime.config.secret,
      bootstrap: true,
    });
    const signup = await sdk.api.signUpEmail({
      body: { name: "The CRE Ledger owner", email, password: ownerPassword }, returnHeaders: true,
    });
    const ownerId = signup.response.user.id;
    const cookie = signup.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    const headers = new Headers({ cookie, origin: runtime.config.origin });
    const factor = await sdk.api.enableTwoFactor({ body: { password: ownerPassword }, headers });
    if (factor.method !== "totp") throw new Error("TOTP enrollment did not start.");
    process.stdout.write(`\nScan or import this URI on the owner's authenticator in private:\n${factor.totpURI}\n\n`);
    await sdk.api.verifyTOTP({ body: { code: await prompt("Enter the authenticator code to confirm enrollment:") }, headers });
    await runtime.db.transaction(async sql => {
      const verified = await sql.write(
        "UPDATE feedback_auth_user SET emailVerified = TRUE WHERE id = ? AND twoFactorEnabled = TRUE", [ownerId]);
      if (verified !== 1) throw new Error("Owner verification failed.");
      await sql.write("DELETE FROM feedback_auth_session WHERE userId = ?", [ownerId]);
      await sql.write("INSERT INTO feedback_auth_owner (slot, userId) VALUES (1, ?)", [ownerId]);
    });
    process.stdout.write(`Owner provisioned. Store these single-use codes offline:\n${factor.backupCodes.join("\n")}\n`);
  } finally {
    try {
      if (locked) await connection.query("SELECT RELEASE_LOCK('cre_feedback_stage_owner_v1')");
    } finally {
      connection.release();
      terminal.close();
      transport.close();
      await runtime.close();
      clearTimeout(operation);
    }
  }
}

provision().catch(() => {
  console.error("Owner provisioning did not complete. Review the staging runbook before retrying.");
  process.exitCode = 1;
});
