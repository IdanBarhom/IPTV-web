// src/components/auth/ConnectScreen.jsx
import { useState } from "react";
import { connectToServer, setAuthToken } from "../../api/client";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:5000";

export default function ConnectScreen({ onConnected }) {
  const [name, setName] = useState("iptv");
  const [url, setBaseUrl] = useState("http://a10.lion.wine:80");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isOver13, setIsOver13] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = agreedToTerms && isOver13 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        type: "xtream",
        name,
        url,
        username,
        password,
        agreedToTerms: true,
        isOver13: true,
      };
      const res = await connectToServer(payload);

      const token = res.data.token;
      const refreshToken = res.data.refreshToken;
      if (!token) throw new Error("No token returned from server");

      setAuthToken(token);
      if (refreshToken) localStorage.setItem("xtream_refresh_token", refreshToken);

      onConnected();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl shadow-xl w-full max-w-md">
      <h1 className="text-2xl font-semibold mb-4 text-center">Connect to IPTV Server</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Playlist Name</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            placeholder="My Playlist"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Base URL</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            placeholder="http://provider.example.com:8080"
            value={url}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* COPPA + Terms consent — required by App Store / COPPA */}
        <div className="space-y-2 pt-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-red-500"
              checked={isOver13}
              onChange={(e) => setIsOver13(e.target.checked)}
            />
            <span className="text-sm text-slate-300">
              I confirm that I am 13 years of age or older
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-red-500"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span className="text-sm text-slate-300">
              I agree to the{" "}
              <a
                href={`${BACKEND_URL}/legal/terms`}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 underline hover:text-red-300"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href={`${BACKEND_URL}/legal/privacy`}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 underline hover:text-red-300"
              >
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md py-2 text-sm font-semibold"
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </form>
    </div>
  );
}
