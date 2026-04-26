"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { BlurredName } from "@/components/DemoContext";
import { useParams } from "next/navigation";

type Person = { _id: string; name: string; email?: string; interests?: string[] };
type Varo = { _id: string; title: string; assignedPeople?: string[] };
type Gathering = { _id: string; tags?: string[]; date: string; notes?: string; varos: Varo[]; shoeCount: { size: string; qty: number }[] };

const FRIDAY_VAROS = ["1st Dua", "1st Dua Tasbih Farsi", "Standing Tasbih", "Ginan/Qasida", "Farman", "2nd Dua", "2nd Dua Tasbih", "Announcements", "Conclusion Dua"];
const CHANDRAAT_VAROS = ["1st Dua", "1st Dua Tasbih Farsi", "Standing Tasbih", "Ginan/Qasida", "Farman", "2nd Dua", "2nd Dua Tasbih", "Chandraat Ginan", "Article of the Month", "Chandraat Tasbih", "Announcements", "Conclusion Dua"];

const GATHERING_TYPES = [
  "Friday Vaaros",
  "Chandraat Vaaros",
  "Kushali",
  "Eid",
  "Taliqah",
  "Other",
];

const TEMPLATES: { label: string; varos: string[]; border: string; text: string; hover: string }[] = [
  { label: "Friday Vaaros",    varos: FRIDAY_VAROS,    border: "border-green-300",  text: "text-green-700",  hover: "hover:bg-green-50"  },
  { label: "Chandraat Vaaros", varos: CHANDRAAT_VAROS, border: "border-purple-300", text: "text-purple-700", hover: "hover:bg-purple-50" },
  { label: "Kushali",          varos: FRIDAY_VAROS,    border: "border-yellow-300", text: "text-yellow-700", hover: "hover:bg-yellow-50" },
  { label: "Eid",              varos: FRIDAY_VAROS,    border: "border-blue-300",   text: "text-blue-700",   hover: "hover:bg-blue-50"   },
  { label: "Taliqah",          varos: FRIDAY_VAROS,    border: "border-orange-300", text: "text-orange-700", hover: "hover:bg-orange-50" },
];

export default function GatheringDetail() {
  const { id } = useParams<{ id: string }>();
  const [g, setG] = useState<Gathering | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<"varos" | "photos">("varos");

  type Photo = { _id: string; filename: string; contentType: string };
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadPhotos = useCallback(async () => {
    const res = await fetch(`/api/admin/gatherings/${id}/photos`);
    if (res.ok) setPhotos(await res.json());
  }, [id]);

  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/gatherings/${id}/photos`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      await loadPhotos();
    } catch {
      alert("Upload failed.");
    }
    setPhotoUploading(false);
  }

  async function renamePhoto(photoId: string) {
    const name = renameValue.trim();
    if (!name) return;
    const res = await fetch(`/api/admin/gatherings/${id}/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: name }),
    });
    if (res.ok) { setRenamingId(null); await loadPhotos(); }
    else alert("Rename failed.");
  }

  async function deletePhoto(photoId: string, filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return;
    await fetch(`/api/admin/gatherings/${id}/photos/${photoId}`, { method: "DELETE" });
    await loadPhotos();
  }

  const loadGathering = useCallback(async () => {
    const res = await fetch(`/api/admin/gatherings/${id}`);
    if (res.ok) setG(await res.json());
  }, [id]);

  useEffect(() => {
    void loadGathering();
    fetch("/api/admin/people").then(r => r.json()).then(setPeople);
    void loadPhotos();
  }, [loadGathering, loadPhotos]);

  async function deleteVaro(varoId: string) {
    if (!confirm("Delete this Varo?")) return;
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${varoId}`, { method: "DELETE" });
    if (res.ok) await loadGathering(); else alert("Failed to delete");
  }

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  async function loadTemplate(titles: string[]) {
    if (!g) return;
    setLoadingTemplate(true);
    const existing = new Set((g.varos ?? []).map(v => v.title.trim().toLowerCase()));
    const toAdd = titles.filter(t => !existing.has(t.toLowerCase()));
    for (const title of toAdd) {
      await fetch(`/api/admin/gatherings/${id}/varos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }
    setLoadingTemplate(false);
    await loadGathering();
  }

  // ── Varo assignment ────────────────────────────────────────────────────────
  const [tagsOpen, setTagsOpen] = useState(false);
  const [assignOpenFor, setAssignOpenFor] = useState<string | null>(null);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  type VaroHistoryEntry = { date: string; gatheringTitle: string; assigned: { _id: string; name: string }[] };
  const [varoHistory, setVaroHistory] = useState<VaroHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentVaro = useMemo(
    () => g?.varos.find(v => v._id === assignOpenFor) ?? null,
    [assignOpenFor, g]
  );

  const filteredPeople = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    return q ? people.filter(p => p.name.toLowerCase().includes(q)) : people;
  }, [people, peopleSearch]);

  function openAssign(varoId: string) {
    const varo = g?.varos.find(v => v._id === varoId);
    if (!varo) return;
    const initial: Record<string, boolean> = {};
    for (const pid of varo.assignedPeople ?? []) initial[pid] = true;
    setSelected(initial);
    setPeopleSearch("");
    setAddingNew(false);
    setNewName("");
    setVaroHistory([]);
    setAssignOpenFor(varoId);
    setHistoryLoading(true);
    fetch(`/api/admin/varos/history?title=${encodeURIComponent(varo.title)}&limit=8`)
      .then(r => r.json())
      .then((data: VaroHistoryEntry[]) => setVaroHistory(data))
      .finally(() => setHistoryLoading(false));
  }

  async function createAndSelect() {
    const name = newName.trim();
    if (!name) return;
    setAddingLoading(true);
    const res = await fetch("/api/admin/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const created: Person = await res.json();
      setPeople(prev => [...prev, created]);
      setSelected(s => ({ ...s, [created._id]: true }));
      setAddingNew(false);
      setNewName("");
    } else {
      alert("Failed to create person.");
    }
    setAddingLoading(false);
  }

  async function saveAssignment() {
    if (!assignOpenFor) return;
    const personIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    const res = await fetch(`/api/admin/gatherings/${id}/varos/${assignOpenFor}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds, mode: "replace" }),
    });
    if (res.ok) { setAssignOpenFor(null); await loadGathering(); }
    else alert("Failed to save assignment");
  }

  function personName(pid: string) {
    return people.find(p => p._id === pid)?.name ?? pid;
  }

  // ── Shoe count ─────────────────────────────────────────────────────────────
  const [shoeCount, setShoeCount] = useState(0);
  useEffect(() => {
    if (g) setShoeCount((g.shoeCount ?? []).reduce((s, r) => s + (Number(r.qty) || 0), 0));
  }, [g]);

  async function saveShoeCount(val: number) {
    await fetch(`/api/admin/gatherings/${id}/shoecount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ size: "total", qty: val }] }),
    });
  }

  if (!g) return <div className="admin-page text-gray-400">Loading…</div>;

  return (
    <div className="admin-page space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-heading">
            {new Date(g.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </h1>
          <div className="relative">
            {tagsOpen && <div className="fixed inset-0 z-10" onClick={() => setTagsOpen(false)} />}
            <button
              type="button"
              onClick={() => setTagsOpen(o => !o)}
              className="ismaili-input text-sm py-1.5 px-3 flex items-center gap-2 min-w-44 z-20 relative"
            >
              <span className="flex-1 text-left">{(g.tags ?? []).length === 0 ? "Select type…" : (g.tags ?? []).join(", ")}</span>
              <span className="text-gray-400">▾</span>
            </button>
            {tagsOpen && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-44 z-20">
                {GATHERING_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={(g.tags ?? []).includes(type)}
                      onChange={async e => {
                        const newTags = e.target.checked
                          ? [...(g.tags ?? []), type]
                          : (g.tags ?? []).filter(t => t !== type);
                        const res = await fetch(`/api/admin/gatherings/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ tags: newTags }),
                        });
                        if (res.ok) await loadGathering(); else alert("Failed to update type.");
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <input
          id="gathering-notes"
          aria-label="Gathering notes"
          className="mt-2 ismaili-input text-sm text-gray-600 w-full max-w-lg"
          placeholder="Add notes…"
          defaultValue={g.notes ?? ""}
          onBlur={async e => {
            const notes = e.target.value.trim();
            if (notes === (g.notes ?? "")) return;
            const res = await fetch(`/api/admin/gatherings/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notes }),
            });
            if (res.ok) await loadGathering(); else alert("Failed to save notes.");
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" role="tablist" aria-label="Gathering sections">
        {(["varos","photos"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`tabpanel-${t}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t
                ? "border-[#2d5016] text-[#2d5016]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "photos" ? "Jamati Picture" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Varos tab ── */}
      {tab === "varos" && (
        <div id="tabpanel-varos" role="tabpanel" aria-label="Varos" className="space-y-6">
          {/* Template buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium">Load template:</span>
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                disabled={loadingTemplate}
                onClick={() => loadTemplate(t.varos)}
                className={`px-3 py-1 text-xs rounded border ${t.border} ${t.text} ${t.hover} disabled:opacity-50`}
              >
                {t.label}
              </button>
            ))}
            {loadingTemplate && <span className="text-xs text-gray-400">Adding…</span>}
          </div>

          {/* Varos table */}
          <div className="ismaili-card overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Varo</th>
                  <th>Assigned</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {g.varos?.map(v => {
                  const assigned = v.assignedPeople ?? [];
                  const names = assigned.map(pid => personName(pid));
                  const preview = names.length <= 3
                    ? names.join(", ")
                    : names.slice(0, 3).join(", ") + ` +${names.length - 3} more`;
                  return (
                    <tr key={v._id}>
                      <td className="font-medium text-gray-900">{v.title}</td>
                      <td className="text-gray-500 text-sm">
                        {names.length === 0
                          ? <span className="text-gray-300 italic">None</span>
                          : <BlurredName><span title={names.join(", ")}>{preview}</span></BlurredName>
                        }
                      </td>
                      <td>
                        <div className="flex gap-3">
                          <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors" onClick={() => openAssign(v._id)}>Assign</button>
                          <button className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors" onClick={() => deleteVaro(v._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!g.varos || !g.varos.length) && (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={3}>No Varos yet — load a template below.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Shoe count */}
          <div className="flex items-center gap-3">
            <label htmlFor="shoe-count" className="text-sm font-medium text-gray-700">Shoe Count</label>
            <input
              id="shoe-count"
              type="number"
              min={0}
              className="ismaili-input w-28 text-sm py-1.5 px-3"
              value={shoeCount}
              onChange={e => setShoeCount(Number(e.target.value) || 0)}
              onBlur={() => saveShoeCount(shoeCount)}
            />
          </div>
        </div>
      )}

      {/* ── Assign modal ── */}
      {currentVaro && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setAssignOpenFor(null); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 id="assign-modal-title" className="font-semibold text-sm">
                Assign — <span className="text-blue-700">{currentVaro.title}</span>
              </h3>
              <button onClick={() => setAssignOpenFor(null)} aria-label="Close assignment panel" className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            {/* Recent assignment history */}
            {(historyLoading || varoHistory.length > 0) && (
              <div className="px-4 pt-3 pb-2 border-b">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent assignments</p>
                {historyLoading ? (
                  <p className="text-xs text-gray-400">Loading history…</p>
                ) : (
                  <div className="space-y-1">
                    {varoHistory.map((entry, i) => {
                      const dateStr = new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
                      return (
                        <div key={i} className="flex items-baseline gap-2 text-xs">
                          <span className="text-gray-400 shrink-0">{dateStr}</span>
                          {entry.assigned.length === 0
                            ? <span className="text-gray-300 italic">unassigned</span>
                            : <BlurredName><span className="text-gray-700">{entry.assigned.map(p => p.name).join(", ")}</span></BlurredName>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <input
                autoFocus
                className="border p-2 rounded w-full text-sm"
                placeholder="Search people…"
                value={peopleSearch}
                onChange={e => setPeopleSearch(e.target.value)}
              />
            </div>

            {/* People list */}
            <div className="flex-1 overflow-auto px-4 divide-y">
              {filteredPeople.map(p => (
                <label key={p._id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 -mx-4 px-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={!!selected[p._id]}
                    onChange={() => setSelected(s => ({ ...s, [p._id]: !s[p._id] }))}
                  />
                  <span className="text-sm"><BlurredName>{p.name}</BlurredName></span>
                </label>
              ))}
              {!filteredPeople.length && (
                <p className="py-4 text-sm text-gray-400 text-center">No matches</p>
              )}

              {/* Add new person */}
              <div className="py-3 -mx-4 px-4">
                {addingNew ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="border p-1.5 rounded text-sm flex-1"
                      placeholder="Full name…"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") void createAndSelect(); if (e.key === "Escape") { setAddingNew(false); setNewName(""); } }}
                    />
                    <button
                      onClick={() => void createAndSelect()}
                      disabled={!newName.trim() || addingLoading}
                      className="px-3 py-1.5 rounded bg-green-800 text-white text-xs font-semibold disabled:opacity-50 hover:bg-green-900 transition-colors"
                    >
                      {addingLoading ? "Adding…" : "Add & Select"}
                    </button>
                    <button onClick={() => { setAddingNew(false); setNewName(""); }} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    + Add new person
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-lg">
              <span className="text-xs text-gray-500">
                {Object.values(selected).filter(Boolean).length} selected
              </span>
              <div className="flex gap-2">
                <button onClick={() => setAssignOpenFor(null)} className="px-3 py-1.5 rounded border text-sm">Cancel</button>
                <button onClick={saveAssignment} className="px-3 py-1.5 rounded bg-black text-white text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Jamati Picture tab ── */}
      {tab === "photos" && (
        <div id="tabpanel-photos" role="tabpanel" aria-label="Jamati Pictures" className="space-y-4">
          {/* Upload area */}
          <label
            aria-label="Upload photo files. Click or drag and drop images here."
            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              photoUploading
                ? "border-gray-200 bg-gray-50"
                : dragOver
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-green-400 hover:bg-green-50"
            }`}
            onDragOver={e => { e.preventDefault(); if (!photoUploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={async e => {
              e.preventDefault();
              setDragOver(false);
              if (photoUploading) return;
              const files = Array.from(e.dataTransfer.files);
              for (const file of files) await uploadPhoto(file);
            }}
          >
            <input
              type="file"
              className="hidden"
              accept="*/*"
              multiple
              disabled={photoUploading}
              onChange={async e => {
                const files = Array.from(e.target.files ?? []);
                for (const file of files) await uploadPhoto(file);
                e.target.value = "";
              }}
            />
            {photoUploading ? (
              <p className="text-sm text-gray-400">Uploading…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">{dragOver ? "Drop to upload" : "Click or drag & drop to upload"}</p>
                <p className="text-xs text-gray-400 mt-1">Images, videos, PDFs — any file type</p>
              </>
            )}
          </label>

          {/* File list */}
          {photos.length === 0 ? (
            <p className="text-sm text-gray-400">No files uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(p => {
                const isImage = p.contentType.startsWith("image/");
                const src = `/api/admin/gatherings/${id}/photos/${p._id}`;
                return (
                  <div key={p._id} className="ismaili-card p-2 flex flex-col gap-2">
                    {isImage ? (
                      <a href={src} target="_blank" rel="noreferrer">
                        <img src={src} alt={`Photo: ${p.filename}`} className="w-full h-32 object-cover rounded" />
                      </a>
                    ) : (
                      <a href={src} target="_blank" rel="noreferrer" className="flex items-center justify-center h-32 bg-gray-50 rounded text-3xl">
                        📄
                      </a>
                    )}
                    {renamingId === p._id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          autoFocus
                          className="border rounded px-1.5 py-0.5 text-xs flex-1 min-w-0"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") void renamePhoto(p._id); if (e.key === "Escape") setRenamingId(null); }}
                        />
                        <button onClick={() => void renamePhoto(p._id)} className="text-xs font-semibold text-green-800 hover:text-green-900">✓</button>
                        <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 truncate cursor-pointer hover:text-gray-800" title={p.filename} onClick={() => { setRenamingId(p._id); setRenameValue(p.filename); }}>{p.filename}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setRenamingId(p._id); setRenameValue(p.filename); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deletePhoto(p._id, p.filename)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
