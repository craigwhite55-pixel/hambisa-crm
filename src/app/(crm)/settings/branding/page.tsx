"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BrandingSettingsPage() {
  const [companyName, setCompanyName] = useState("Hambisa Africa");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings/branding")
      .then((r) => r.json())
      .then((d) => {
        setCompanyName(d.company_name ?? "Hambisa Africa");
        setLogoUrl(d.logo_url);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("branding").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      setMessage(`Upload failed: ${error.message}. Create a public "branding" bucket in Supabase Storage if needed.`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    setMessage("Logo uploaded — click Save to apply.");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: companyName, logo_url: logoUrl }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved! Refresh the page to see your logo in the header." : "Failed to save.");
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-heading mb-4 text-lg font-bold">Branding</h2>

      <div className="mb-4">
        <label className="label">Company name</label>
        <input
          className="input-field w-full"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="label">Logo</label>
        {logoUrl && (
          <div className="mb-3 rounded-lg border border-border bg-surface2 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
          </div>
        )}
        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} />
        <p className="mt-1 text-xs text-muted">PNG, JPG, SVG or WebP. Recommended height ~40px.</p>
      </div>

      {message && <p className="mb-3 text-sm text-accent">{message}</p>}

      <button onClick={handleSave} disabled={saving || uploading} className="btn-primary">
        {saving ? "Saving…" : uploading ? "Uploading…" : "Save branding"}
      </button>
    </div>
  );
}
