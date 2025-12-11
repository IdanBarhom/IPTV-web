export default function HomeContent({ setActiveTab }) {
  return (
    <div className="relative min-h-[600px] rounded-xl overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[600px] p-8 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
          Welcome Home
        </h1>
        <p className="text-2xl text-slate-200 mb-12 max-w-2xl">
          Stream everything you love - anywhere, anytime
        </p>

        <div
          className="flex flex-wrap gap-4 justify-center"
          onClick={() => {
            setActiveTab("live");
          }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-48 hover:bg-white/20 transition cursor-pointer">
            <div className="text-4xl mb-3">🔴</div>
            <h3 className="text-xl font-semibold text-white">Live</h3>
            <p className="text-sm text-slate-300 mt-1">Now streaming</p>
          </div>

          <div
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-48 hover:bg-white/20 transition cursor-pointer"
            onClick={() => {
              setActiveTab("movies");
            }}
          >
            <div className="text-4xl mb-3">🎬</div>
            <h3 className="text-xl font-semibold text-white">Movies</h3>
            <p className="text-sm text-slate-300 mt-1">Watch instantly</p>
          </div>

          <div
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-48 hover:bg-white/20 transition cursor-pointer"
            onClick={() => {
              setActiveTab("series");
            }}
          >
            <div className="text-4xl mb-3">📺</div>
            <h3 className="text-xl font-semibold text-white">Series</h3>
            <p className="text-sm text-slate-300 mt-1">Binge watching</p>
          </div>
        </div>
      </div>
    </div>
  );
}
