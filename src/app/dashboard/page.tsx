
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Lokal = {
  id: string | number;
  name: string;
  description?: string;
  slug: string;
  youtube_url?: string;
  youtube_video_id?: string;
  is_active?: boolean;
  created_at?: string;
  page_visits?: number;
  unique_visitors?: number;
  video_plays?: number;
  progress_25?: number;
  progress_50?: number;
  progress_75?: number;
  video_complete?: number;
};

type Admin = {
  id: string | number;
  name: string;
  email: string;
};

export default function Dashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [lokals, setLokals] = useState<Lokal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lokal | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const base = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard.");
      }

      setAdmin(data.admin);
      setLokals(data.lokals || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => {
      void load(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [load]);

  const totals = useMemo(
    () =>
      lokals.reduce(
        (result, lokal) => ({
          visits: result.visits + Number(lokal.page_visits || 0),
          reached: result.reached + Number(lokal.unique_visitors || 0),
          plays: result.plays + Number(lokal.video_plays || 0),
          completed:
            result.completed + Number(lokal.video_complete || 0),
        }),
        { visits: 0, reached: 0, plays: 0, completed: 0 }
      ),
    [lokals]
  );

  function startNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setYoutubeUrl("");
    setError("");
    setShowForm(true);
  }

  function startEdit(lokal: Lokal) {
    setEditing(lokal);
    setName(lokal.name);
    setDescription(lokal.description || "");
    setYoutubeUrl(lokal.youtube_url || "");
    setError("");
    setShowForm(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editing ? `/api/lokals/${editing.id}` : "/api/lokals",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            youtube_url: youtubeUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save Lokal.");
      }

      setShowForm(false);
      setMessage(editing ? "Lokal updated." : "Lokal created.");
      await load(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Lokal.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(lokal: Lokal) {
    if (
      !window.confirm(
        `Delete ${lokal.name} and its tracking history? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/lokals/${lokal.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete Lokal.");
      }

      setLokals((current) =>
        current.filter((item) => item.id !== lokal.id)
      );
      setMessage("Lokal deleted.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${base}/lokal/${slug}`);
      setMessage("Public link copied.");
      setError("");
    } catch {
      setError("Could not copy the link. Please copy it from the address bar.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brandmark">T</div>
          <span>
            TMCC <span className="muted">VIEWS</span>
          </span>
        </div>
        <div className="actions">
          <span className="muted small">
            {admin ? admin.email : "Loading workspace…"}
          </span>
          <button className="btn secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">Workspace overview</div>
        <h1>{admin ? `Welcome, ${admin.name}.` : "Your dashboard."}</h1>
        <p className="muted">
          Track visits and video engagement across your Lokals.
        </p>
      </section>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="grid" style={{ marginTop: 24 }}>
        <div className="panel stat">
          <div className="label">Your Lokals</div>
          <div className="value">{lokals.length}</div>
        </div>
        <div className="panel stat">
          <div className="label">Lokal Page Views</div>
          <div className="value">{totals.visits.toLocaleString()}</div>
        </div>
        <div className="panel stat">
          <div className="label">People Reached</div>
          <div className="value">
            {lokals.some((lokal) => lokal.unique_visitors !== undefined)
              ? totals.reached.toLocaleString()
              : "—"}
          </div>
        </div>
        <div className="panel stat">
          <div className="label">Video Starts</div>
          <div className="value">{totals.plays.toLocaleString()}</div>
        </div>
        <div className="panel stat">
          <div className="label">Videos Finished</div>
          <div className="value">{totals.completed.toLocaleString()}</div>
        </div>
      </div>

      <div className="contentgrid">
        <section className="panel">
          <div className="row">
            <div>
              <h2 className="sectiontitle">Lokal monitoring</h2>
            </div>
            <button className="btn" onClick={startNew}>
              ＋ Add Lokal
            </button>
          </div>

          {loading ? (
            <div className="empty">Loading your workspace…</div>
          ) : lokals.length === 0 ? (
            <div className="empty">
              <strong>No Lokals yet</strong>
              <p>Create your first Lokal to generate a public video link.</p>
              <button className="btn" onClick={startNew}>
                Create first Lokal
              </button>
            </div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Lokal</th>
                    <th>Lokal Page Views</th>
                    <th>Video Starts</th>
                    <th>Videos Finished</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lokals.map((lokal) => (
                    <tr key={lokal.id}>
                      <td>
                        <strong>{lokal.name}</strong>
                        {lokal.youtube_video_id && (
                          <div className="muted small">
                            {lokal.youtube_video_id}
                          </div>
                        )}
                      </td>
                      <td>
                        {Number(lokal.page_visits || 0).toLocaleString()}
                      </td>
                      <td>
                        {Number(lokal.video_plays || 0).toLocaleString()}
                      </td>
                      <td>
                        {Number(lokal.video_complete || 0).toLocaleString()}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn secondary"
                            onClick={() => startEdit(lokal)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => void copyLink(lokal.slug)}
                          >
                            Copy link
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => void remove(lokal)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div
          className="modalback"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div className="modal">
            <div className="row">
              <h2 className="sectiontitle">
                {editing ? "Edit Lokal" : "Add a Lokal"}
              </h2>
              <button
                className="btn secondary"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={save}>
              <div className="field">
                <label>Lokal name</label>
                <input
                  className="input"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="field">
                <label>Description (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="field">
                <label>YouTube video URL</label>
                <input
                  className="input"
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button className="btn full" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create Lokal and generate link"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="footer">
        TMCC Views Monitoring · Shared storage · Separate admin workspaces
      </div>
    </main>
  );
}
