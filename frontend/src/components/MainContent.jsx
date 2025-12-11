import { useState, useEffect } from "react";
import LiveContent from "./Live/LiveContent";
import MovieContent from "./movies/MovieContent";
import SeriesContent from "./series/SeriesContent";
import HomeContent from "./HomeContent";

export default function MainContent({ activeTab, setActiveTab }) {
  return (
    <div className="w-full bg-slate-900/60 rounded-2xl p-4 min-h-[300px] shadow-lg">
      {activeTab === "home" && <HomeContent setActiveTab={setActiveTab}/>}
      {activeTab === "live" && <LiveContent />}
      {activeTab === "movies" && <MovieContent />}
      {activeTab === "series" && <SeriesContent />}
    </div>
  );
}
