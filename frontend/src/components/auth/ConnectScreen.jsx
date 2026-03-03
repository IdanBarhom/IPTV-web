// src/components/auth/ConnectScreen.jsx
import { useState } from "react";
import { connectToServer, setAuthToken } from "../../api/client";

export default function ConnectScreen({ onConnected }) {


  const [name, setName] = useState("iptv");
  const [url, setBaseUrl] = useState("http://a10.lion.wine:80");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = { name,url, username, password };
      const res = await connectToServer(payload);
      console.log(payload);

      // נניח שהבקאנד מחזיר token בשדה res.data.token
      const token = res.data.token;
      if (!token) {
        throw new Error("No token returned from server");
      }
      // שומר את הטוקן גם ב-axios וגם ב-localStorage
      setAuthToken(token);

      // אם יש לך גם מידע על החיבור (לדוגמה server_info / user_info),
      // אפשר לשמור אותו ב-localStorage או ב-state גלובלי בעתיד.

      onConnected(); // אומר ל-App שאנחנו מחוברים
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error|| err.response?.data?.message || "Connection failed");
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
            placeholder="http://a10.lion.wine:80"
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

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-md py-2 text-sm font-semibold"
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </form>
    </div>
  );
}
