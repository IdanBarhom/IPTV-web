import { FaPlay } from "react-icons/fa";
import { useState, useMemo, useEffect } from "react";

export default function SeriesInfo({ si, onPlay }) {
  const seasons = si.seasons || [];
  const episodesBySeason = si.episodes || {};

  // עונה ראשונה כברירת מחדל
  const [selectedSeason, setSelectedSeason] = useState(
    seasons[0]?.season_number ?? null
  );

  const cleanEpisodeTitle = (title) => {
    if (!title) return "Untitled";
    const parts = title.split(" - ");
    return parts.pop().trim();
  };
  const currentEpisodes = useMemo(() => {
    if (selectedSeason == null) return [];
    // episodesBySeason מפתח בד"כ הוא מחרוזת של season_number
    return (
      episodesBySeason[String(selectedSeason)] ||
      episodesBySeason[selectedSeason] ||
      []
    );
  }, [episodesBySeason, selectedSeason]);
  useEffect(() => {
    console.log("Selected Season changed to:", selectedSeason);
    console.log("Current Episodes:", currentEpisodes);
    console.log("Episodes by Season:", episodesBySeason);
  }, [selectedSeason, currentEpisodes, episodesBySeason]);

  return (
    <div className="flex flex-col h-[90vh] overflow-auto">
      {/* 🔼 חלק עליון – תמונה + כותרת (60%) */}
      <div className="relative h-[60%] w-full">
        <img
          src={si.info.backdrop_path[0]}
          alt={si.info.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-x-0 top-0 p-4">
          <h2 className="font-bold text-3xl text-white drop-shadow-lg">
            {si.info.name}
          </h2>
        </div>
      </div>

      {/* 🔽 חלק תחתון – 40% */}
      <div className="h-[40%] gap-6 p-2 grid grid-cols-2 ">
        {/* שמאל – כפתור Play */}
        <div className="flex-shrink-0 flex flex-col items-start justify-start  pt-3 ">
          {seasons.length === 0 && (
            <p className="text-red-400">No seasons available.</p>
          )}
          {seasons.length > 0 && (
            <div className="mb-4">
              <ul className="max-h-48 overflow-y-auto flex gap-2 ">
                {seasons.map((season) => (
                  <button
                    key={season.season_number}
                    className={`font-semibold text-sm rounded-lg p-1 ${
                      season.season_number === selectedSeason
                        ? "bg-slate-200 text-slate-900 shadow-sm border-slate-200"
                        : "bg-slate-700 text-slate-100 border-slate-500 hover:bg-slate-600 "
                    }`}
                    onClick={() => setSelectedSeason(season.season_number)}
                  >
                    Season {season.season_number}
                  </button>
                ))}
              </ul>
            </div>
          )}
          {currentEpisodes.length === 0 && (
            <p className="text-red-400">
              No episodes available for this season.
            </p>
          )}
          {currentEpisodes.length > 0 && (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-64 pr-2">
              {currentEpisodes.map((ep) => (
                <button
                  key={ep.episode_num}
                  onClick={() => onPlay?.(ep)}
                  className="flex flex-col w-40 flex-shrink-0"
                >
                  <img
                    src={ep.info.movie_image}
                    alt=""
                    className="w-40 h-28 object-cover rounded-lg shadow"
                  />

                  <label className="mt-2 block text-left px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-200">
                    Episode {ep.episode_num}: {cleanEpisodeTitle(ep.title)}
                  </label>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* ימין – מידע על הסדרה */}
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-200">
          {/* תיאור */}
          <div className="col-span-2">
            <h3 className="font-semibold mb-1">Overview</h3>
            <p className="text-slate-300 text-xs leading-snug">
              {si.info.plot || "No description available."}
            </p>
          </div>

          {/* ז'אנר */}
          <div>
            <h3 className="font-semibold mb-1">Genre</h3>
            <p className="text-slate-300 text-xs">
              {si.info.genre || si.info.genres?.join(", ") || "Unknown"}
            </p>
          </div>

          {/* אורך */}
          <div>
            <h3 className="font-semibold mb-1">Duration</h3>
            <p className="text-slate-300 text-xs">
              {si.info.duration
                ? `${si.info.duration} min`
                : si.info.runtime
                ? `${si.info.runtime} min`
                : "N/A"}
            </p>
          </div>

          {/* תאריך יציאה */}
          <div>
            <h3 className="font-semibold mb-1">Release Date</h3>
            <p className="text-slate-300 text-xs">
              {si.info.releaseDate || si.info.air_date || "Unknown"}
            </p>
          </div>

          {/* דירוג */}
          <div>
            <h3 className="font-semibold mb-1">Rating</h3>
            <p className="text-slate-300 text-xs">
              {si.info.rating || si.info.vote_average || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
