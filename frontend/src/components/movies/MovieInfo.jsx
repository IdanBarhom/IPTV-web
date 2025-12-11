import { FaPlay } from "react-icons/fa";

export default function MovieInfo({mi,movie, onPlay }) {
  return (
    <div className="flex flex-col h-[80vh] overflow-auto">
      {/* 🔼 חלק עליון – תמונה + כותרת (60%) */}
      <div className="relative h-[60%] w-full">
        <img
          src={mi.info.backdrop_path[0]}
          alt={mi.info.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-x-0 top-0 p-4">
          <h2 className="font-bold text-3xl text-white drop-shadow-lg">
            {mi.info.name}
          </h2>
        </div>
      </div>

      {/* 🔽 חלק תחתון – 40% */}
      <div className="h-[40%] flex gap-6 p-4">
        {/* שמאל – כפתור Play */}
        <div className="flex-shrink-0 flex items-center w-[20%]">
          <button
            onClick={() => onPlay?.(mi)} // או כל לוגיקה אחרת שיש לך
            className="px-10 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-md"
          >
            <FaPlay size={16} />
            Play
          </button>
        </div>

        {/* ימין – מידע על הסדרה */}
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-200">
          {/* תיאור */}
          <div className="col-span-2">
            <h3 className="font-semibold mb-1">Overview</h3>
            <p className="text-slate-300 text-xs leading-snug">
              {mi.info.plot || "No description available."}
            </p>
          </div>

          {/* ז'אנר */}
          <div>
            <h3 className="font-semibold mb-1">Genre</h3>
            <p className="text-slate-300 text-xs">
              {mi.info.genre || mi.info.genres?.join(", ") || "Unknown"}
            </p>
          </div>

          {/* אורך */}
          <div>
            <h3 className="font-semibold mb-1">Duration</h3>
            <p className="text-slate-300 text-xs">
              {mi.info.duration
                ? `${mi.info.duration} min`
                : mi.info.runtime
                ? `${mi.info.runtime} min`
                : "N/A"}
            </p>
          </div>

          {/* תאריך יציאה */}
          <div>
            <h3 className="font-semibold mb-1">Release Date</h3>
            <p className="text-slate-300 text-xs">
              {mi.info.releaseDate || mi.info.air_date || "Unknown"}
            </p>
          </div>

          {/* דירוג */}
          <div>
            <h3 className="font-semibold mb-1">Rating</h3>
            <p className="text-slate-300 text-xs">
              {mi.info.rating || mi.info.vote_average || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
