// src/components/live/LiveContent.jsx
import { useState, useEffect } from "react";
import { getMoviesCategories, getMoviesByCategory } from "../../api/client";
import MovieCategory from "./MovieCategory";
import MovieCard from "./MovieCard";

export default function MovieContent() {
  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- טעינת הקטגוריות פעם אחת ----------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getMoviesCategories(); // axios
        // res.data = { success: true, data: [...] }
        setCategories(res.data.data || []);    // <-- המערך האמיתי
      } catch (err) {
        console.error(err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // ---------- טעינת ערוצים לפי קטגוריה ----------
  const handleCategoryClick = async (categoryId) => {
    try {
      setSelectedCategory(categoryId);
      setLoading(true);
      setError("");

      const res = await getMoviesByCategory(categoryId);
      // res.data = { success: true, data: [...] }
      setChannels(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return <p className="text-slate-300">Loading…</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">Live TV</h2>

      {/* מצב: עדיין בוחרים קטגוריה */}
      {!selectedCategory && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <MovieCategory
              key={cat.category_id}
              category={cat}
              onClick={() => handleCategoryClick(cat.category_id)}
            />
          ))}
        </div>
      )}

      {/* מצב: קטגוריה נבחרה – מציגים ערוצים */}
      {selectedCategory && (
        <div className="space-y-3">
          <button
            className="text-sm text-blue-300 hover:text-blue-500"
            onClick={() => {
              setSelectedCategory(null);
              setChannels([]);
            }}
          >
            ← Back to categories
          </button>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {channels.map((ch) => (
              <MovieCard
                key={ch.stream_id}
                channel={ch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
