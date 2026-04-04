// src/components/settings/SettingsContent.jsx
import { useState } from "react";
import { disconnectFromServer, deleteAccount, exportData, setAuthToken } from "../../api/client";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:5000";

export default function SettingsContent({ onDisconnected }) {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const handleDisconnect = async () => {
    try {
      await disconnectFromServer();
    } catch {
      // even if the request fails, clear local state
    } finally {
      setAuthToken(null);
      localStorage.removeItem("xtream_refresh_token");
      onDisconnected();
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError("");
    try {
      const res = await exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-iptv-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError("");
    try {
      await deleteAccount();
      setAuthToken(null);
      localStorage.removeItem("xtream_refresh_token");
      onDisconnected();
    } catch {
      setError("Failed to delete account. Please try again.");
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Settings</h2>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>
      )}

      {/* Account section */}
      <section className="bg-slate-800/60 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Account</h3>

        <button
          onClick={handleDisconnect}
          className="w-full text-left px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
        >
          Disconnect
          <p className="text-xs text-slate-400 mt-0.5">Sign out and return to the connect screen</p>
        </button>

        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="w-full text-left px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm transition"
        >
          {exportLoading ? "Exporting..." : "Export My Data"}
          <p className="text-xs text-slate-400 mt-0.5">Download all your data as JSON (GDPR)</p>
        </button>
      </section>

      {/* Legal section */}
      <section className="bg-slate-800/60 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Legal</h3>

        <a
          href={`${BACKEND_URL}/legal/privacy`}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
        >
          Privacy Policy
          <p className="text-xs text-slate-400 mt-0.5">How we handle your data</p>
        </a>

        <a
          href={`${BACKEND_URL}/legal/terms`}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
        >
          Terms of Service
          <p className="text-xs text-slate-400 mt-0.5">Rules for using this app</p>
        </a>

        <a
          href={`${BACKEND_URL}/legal/dmca`}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
        >
          DMCA Policy
          <p className="text-xs text-slate-400 mt-0.5">Copyright safe harbor information</p>
        </a>
      </section>

      {/* Danger zone */}
      <section className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h3>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-left px-4 py-3 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm transition"
          >
            Delete Account
            <p className="text-xs text-red-400/70 mt-0.5">
              Permanently delete all your data (GDPR right to erasure)
            </p>
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-300 px-1">
              This will permanently delete your account, all favorites, history, and profiles. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {deleteLoading ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
