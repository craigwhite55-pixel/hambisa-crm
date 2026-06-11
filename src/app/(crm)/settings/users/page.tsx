"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { Modal } from "@/components/Modal";
import { ROLE_LABELS, type Profile, type UserRole } from "@/lib/roles";

export default function UsersSettingsPage() {
  const { role, refresh } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "staff" as UserRole,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (role === "super_admin") load();
  }, [role]);

  function openCreate() {
    setEditing(null);
    setForm({ email: "", password: "", full_name: "", role: "staff" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(user: Profile) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      full_name: user.full_name ?? "",
      role: user.role,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = editing
      ? await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            role: form.role,
            full_name: form.full_name,
            ...(form.password ? { password: form.password } : {}),
          }),
        })
      : await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }
    setModalOpen(false);
    load();
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? They will lose access immediately.")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    load();
  }

  if (role !== "super_admin") {
    return <p className="text-muted">Only Super Admins can manage users.</p>;
  }

  if (loading) return <p className="text-muted">Loading users…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold">Users &amp; roles</h2>
          <p className="text-sm text-muted">
            Staff: create &amp; edit · Admin: + delete · Super Admin: + manage users
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add user</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="px-4 py-3">{u.full_name || "—"}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="btn-secondary mr-2 text-xs">Edit</button>
                  <button onClick={() => handleDelete(u.id)} className="btn-danger text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit user" : "Add user"}
        footer={
          <>
            <div className="flex-1" />
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <div className="grid gap-3">
          {!editing && (
            <>
              <div>
                <label className="label">Email *</label>
                <input className="input-field w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input-field w-full" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <label className="label">Full name</label>
            <input className="input-field w-full" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="staff">Staff — create &amp; edit only</option>
              <option value="admin">Admin — can delete records</option>
              <option value="super_admin">Super Admin — full access + users</option>
            </select>
          </div>
          {editing && (
            <div>
              <label className="label">New password (optional)</label>
              <input type="password" className="input-field w-full" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
