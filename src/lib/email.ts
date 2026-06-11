export type SendEmailResult = { sent: boolean; reason?: string };

export async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL ?? "alerts@hambisa.africa";
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    return { sent: false, reason: await res.text() };
  }
  return { sent: true };
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://hambisa-crm.vercel.app";
}

export async function sendWelcomeEmail(opts: {
  email: string;
  fullName?: string | null;
  role: string;
  password: string;
}): Promise<SendEmailResult> {
  const loginUrl = getAppUrl();
  const name = opts.fullName?.trim() || opts.email.split("@")[0];
  const html = `
    <div style="font-family:sans-serif;max-width:520px;color:#222">
      <h2 style="color:#e8a83e">Welcome to Hambisa CRM</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created with the role <strong>${opts.role.replace("_", " ")}</strong>.</p>
      <p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Email:</strong> ${opts.email}</p>
      <p><strong>Password:</strong> ${opts.password}</p>
      <p style="color:#666;font-size:13px">Please change your password after your first login if possible.</p>
      <p>— Hambisa Africa</p>
    </div>
  `;
  return sendEmail([opts.email], "Your Hambisa CRM account", html);
}
