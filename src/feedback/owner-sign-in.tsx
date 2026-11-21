"use client";

import { useRef, useState, type FormEvent } from "react";

async function request(path: string, body: Record<string, string> = {}) {
  return fetch("/api/owner-auth" + path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CRE-Feedback": "1" },
    body: JSON.stringify(body),
  });
}

const field = "mt-1 block min-h-11 w-full rounded-control border border-border-strong bg-elevated px-3 py-2";
const button = "min-h-11 rounded-control bg-accent px-4 py-2 text-on-accent";

export function OwnerSignIn() {
  const [step, setStep] = useState<"password" | "totp" | "backup">("password");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFeedback("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = step === "password"
        ? await request("/sign-in/email", { email: String(data.get("email")), password: String(data.get("password")) })
        : await request(step === "totp" ? "/two-factor/verify-totp" : "/two-factor/verify-backup-code", { code: String(data.get("code")).trim() });
      if (result.ok && step === "password") {
        form.reset();
        setStep("totp");
        setFeedback("Enter the code from your authenticator.");
      } else if (result.ok) {
        window.location.reload();
      } else {
        setFeedback(result.status === 429 ? "Too many attempts. Wait before trying again."
          : step === "password" ? "Sign-in failed. Check your credentials."
            : "Verification failed. Check the code or start sign-in again.");
      }
    } catch {
      setFeedback("Sign-in is temporarily unavailable.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <div className="mt-6 space-y-3">
    <form className="space-y-4" onSubmit={submit} method="post">
      <fieldset className="space-y-4" disabled={busy}>
        <legend>{step === "password" ? "Owner sign-in" : "Second-factor verification"}</legend>
        {step === "password" ? <>
          <label className="block">Owner email<input className={field} name="email" type="email" autoComplete="username" maxLength={254} required /></label>
          <label className="block">Password<input className={field} name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
        </> : <label className="block">{step === "totp" ? "Authenticator code" : "Single-use recovery code"}
          <input key={step} className={field} name="code" inputMode={step === "totp" ? "numeric" : "text"}
            autoComplete="one-time-code" maxLength={step === "totp" ? 6 : 64} required />
        </label>}
        <button type="submit" className={button}>{step === "password" ? "Continue" : "Verify"}</button>
      </fieldset>
    </form>
    {step !== "password" && <div className="flex flex-wrap gap-4">
      <button type="button" className="min-h-11 underline" disabled={busy}
        onClick={() => { setStep(step === "totp" ? "backup" : "totp"); setFeedback(""); }}>
        {step === "totp" ? "Use a recovery code" : "Use the authenticator"}
      </button>
      <button type="button" className="min-h-11 underline" disabled={busy}
        onClick={() => { setStep("password"); setFeedback(""); }}>Start sign-in again</button>
    </div>}
    <p role="status" aria-atomic="true">{busy ? "Verifying…" : feedback}</p>
  </div>;
}

export function OwnerSignOut() {
  const [error, setError] = useState(false);
  return <>
    <button type="button" className={button} onClick={async event => {
      const control = event.currentTarget;
      control.disabled = true;
      try {
        if (!(await request("/sign-out")).ok) throw new Error("Sign-out failed");
        window.location.reload();
      } catch {
        control.disabled = false;
        setError(true);
      }
    }}>Sign out</button>
    {error && <p role="status">Sign-out could not be confirmed. Try again.</p>}
  </>;
}
