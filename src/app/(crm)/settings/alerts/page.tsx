"use client";

import { useEffect, useState } from "react";

type AlertSetting = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  notify_emails: string;
};

export default function AlertsSettingsPage() {
  const [alerts, setAlerts] = useState<AlertSetting[]>([]);
  const [globalEmails, setGlobalEmails] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings/alerts")
      .then((r) => r.json())
      .then((data: AlertSetting[]) => {
        setAlerts(data);
        const emails = data[0]?.notify_emails ?? "";
        setGlobalEmails(emails);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    for (const alert of alerts) {
      await fetch("/api/settings/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: alert.id,
          enabled: alert.enabled,
          notify_emails: globalEmails,
        }),
      });
    }
    setSaving(false);
    setMessage("Alert settings saved. Emails send daily at 8am SA time when enabled.");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading mb-1 text-lg font-bold">Email alerts</h2>
      <p className="mb-4 text-sm text-muted">
        Alerts run once daily. Requires a Resend API key in Vercel (we&apos;ll set this up together).
      </p>

      <div className="mb-6">
        <label className="label">Send alerts to (comma-separated emails)</label>
        <input
          className="input-field w-full"
          placeholder="craig@hambisa.africa, jess@hambisa.africa"
          value={globalEmails}
          onChange={(e) => setGlobalEmails(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((alert, i) => (
          <label
            key={alert.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <input
              type="checkbox"
              checked={alert.enabled}
              onChange={(e) => {
                const next = [...alerts];
                next[i] = { ...alert, enabled: e.target.checked };
                setAlerts(next);
              }}
              className="mt-1"
            />
            <div>
              <p className="font-medium">{alert.label}</p>
              <p className="text-sm text-muted">{alert.description}</p>
            </div>
          </label>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-accent">{message}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
        {saving ? "Saving…" : "Save alert settings"}
      </button>
    </div>
  );
}
