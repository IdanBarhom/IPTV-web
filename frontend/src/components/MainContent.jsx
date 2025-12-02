import LiveContent from "./Live/LiveContent";
import MovieContent from "./movies/MovieContent";
import SeriesGrid from "./SeriesGrid";


export default function MainContent({activeTab}){

   return (
    <div className="w-full bg-slate-900/60 rounded-2xl p-4 min-h-[300px] shadow-lg">
      {activeTab === "home" && (
        <div className="text-center text-slate-300">
          <h2 className="text-2xl font-semibold mb-2">Welcome</h2>
          <p className="text-sm text-slate-400">
            בחר Live TV / Movies / Series כדי לראות תוכן
          </p>
        </div>
      )}

      {activeTab === "live" && <LiveContent />}

      {activeTab === "movies" && <MovieContent />}

      {activeTab === "series" && <SeriesGrid />}
    </div>
  );
}