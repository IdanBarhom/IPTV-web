// src/components/live/LiveContent.jsx
import { useState, useEffect } from "react";
import {
  getLiveCategories,
  getLiveByCategory,
  getLiveStream,
} from "../../api/client";
import LiveCategoryCard from "./LiveCategoryCard";
import LiveChannelCard from "./LiveChannelCard";
import StreamPlayer from "../player/StreamPlayer";
import { FaArrowLeft } from "react-icons/fa";

export default function LiveContent() {
  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentChannel, setCurrentChannel] = useState(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [loadingStream, setLoadingStream] = useState(false);

  // --- טעינת קטגוריות ---
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getLiveCategories(); // { success, data: [...] }
        setCategories(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // --- טעינת ערוצים לפי קטגוריה ---
  const handleCategoryClick = async (categoryId) => {
    try {
      setSelectedCategory(categoryId);
      setLoading(true);
      setError("");
      setCurrentChannel(null);
      setStreamUrl("");

      const res = await getLiveByCategory(categoryId); // { success, data: [...] }
      setChannels(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  // --- לחיצה על ערוץ -> הבאת streamUrl מהבקאנד ---
  const handleChannelClick = async (channel) => {
    try {
      setCurrentChannel(channel);
      setLoadingStream(true);
      setError("");

      const res = await getLiveStream(channel.stream_id);
      console.log("live stream response:", res.data);

      // לפי מה ששלחת:
      // res.data.streamUrl.url = הכתובת האמיתית
      const url = res.data?.streamUrl?.url;

      if (!url) {
        throw new Error("No stream URL returned from server");
      }

      setStreamUrl(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load stream");
    } finally {
      setLoadingStream(false);
    }
  };

  // --- UI ---
  return (
  <div className="space-y-4">

    <h2 className="text-xl font-semibold mb-2">Live TV</h2>

    {error && <p className="text-red-500 text-sm">{error}</p>}

    {/* Layout ראשי: טור שמאל (רשימה) + טור ימין (נגן) */}
    <div className="flex flex-col md:flex-row gap-6">

      {/* ▬▬▬▬▬▬▬▬▬▬▬▬ טור שמאל: קטגוריות / ערוצים ▬▬▬▬▬▬▬▬▬▬▬▬ */}
      <div className="md:w-1/2 w-full">
        {/* אזור גלילה פנימי */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">

          {/* כפתור Back – דבוק לראש אזור הגלילה */}
          {selectedCategory && (
            <div className="sticky top-0 z-10 bg-slate-900/95 pb-2">
              <button
                className="text-sm text-blue-300 hover:text-blue-500"
                onClick={() => {
                  setSelectedCategory(null);
                  setChannels([]);
                  setCurrentChannel(null);
                  setStreamUrl("");
                }}
              >
                     <FaArrowLeft  />

              </button>
            </div>
          )}

          {/* קטגוריות */}
          {!selectedCategory && !loading && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {categories.map((cat) => (
                <LiveCategoryCard
                  key={cat.category_id}
                  category={cat}
                  onClick={() => handleCategoryClick(cat.category_id)}
                />
              ))}
            </div>
          )}

          {/* ערוצים */}
          {selectedCategory && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {channels.map((ch) => (
                <LiveChannelCard
                  key={ch.stream_id}
                  channel={ch}
                  onClick={() => handleChannelClick(ch)}
                />
              ))}
            </div>
          )}

          {/* מצב Loading */}
          {loading && (
            <p className="text-slate-300 text-sm py-2">Loading…</p>
          )}
        </div>
      </div>

      {/* ▬▬▬▬▬▬▬▬▬▬▬▬ טור ימין: הנגן ▬▬▬▬▬▬▬▬▬▬▬▬ */}
      <div className="md:w-1/2 w-full md:sticky md:top-0 self-start">
        {loadingStream && (
          <p className="text-slate-300 text-sm mb-2">Loading stream…</p>
        )}

        <StreamPlayer
          url={streamUrl}
          title={currentChannel?.name}
        />
      </div>

    </div>
  </div>
);


}
