import { useState, useEffect } from "react";
import {
  getSeriesByCategories,
  getSeriesCategories,
  getSeriesStream,
  getSeriesInfo,
} from "../../api/client";
import { IoClose } from "react-icons/io5";

import SeriesCategory from "./SeriesCategory";
import SeriesCard from "./SeriesCard";
import SeriesInfo from "./SeriesInfo";
import { FaArrowLeft } from "react-icons/fa";

export default function SeriesContent() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [series, setSeries] = useState([]);
  const [seriesInfo, setSeriesInfo] = useState([]);
  const [seriesClicked, setSeriesClicked] = useState(null);

  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSeriesInfo, setLoadingSeriesInfo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getSeriesCategories();
        setCategories(res.data.data || []);
        const cats = res.data?.data || [];
        //console.log(cats)
      } catch (err) {
        console.log(err);
        setError("faild to load series categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (seriesClicked) {
      // נשמור את הערך הקודם ליתר ביטחון
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [seriesClicked]);

  const handleCategoryClick = async (categoryId) => {
    try {
      setLoading(true);
      setError("");
      setSelectedCategory(categoryId);

      const res = await getSeriesByCategories(categoryId);
      setSeries(res.data.data);
    } catch (err) {
      console.log(err);
      setError("failed to load this specific Category");
    } finally {
      setLoading(false);
    }
  };
  const handleSeriesClick = async (seriesId) => {
    try {
      setError("");
      setLoadingSeriesInfo(true);
      setSeriesClicked(true);

      const res = await getSeriesInfo(seriesId);
      setSeriesInfo(res.data.data);
    } catch (err) {
      console.log(err);
      setError("failed to load series info");
      setSeriesClicked(false);
    } finally {
      setTimeout(() => {
        setLoadingSeriesInfo(false);
      }, 1000);
      //console.log(seriesInfo);
    }
  };

  const handlePlayEpisode = async (episode) => {
  try {
    setPlayerError("");
    setPlayerLoading(true);
    setPlayerVisible(true);
    setPlayerUrl(null);

    console.log("Episode object:", episode);

    // ברוב השרתים של Xtream:
    // לכל פרק יש stream_id, ולעיתים גם container_extension
    const streamId =
      episode.stream_id || episode.id || episode.streamId;

    const ext =
      episode.container_extension ||
      "m3u8"; 
 
    if (!streamId) {
      throw new Error("Missing stream_id on episode");
    }

    // אם ה־backend שלך מקבל גם extension כפרמטר שני – תשאיר
    const res = await getSeriesStream(streamId, ext);

    // לפי מה שראית אצלך קודם:
    // res.data = { success: true, streamUrl: { url: "http://...m3u8", ... } }
    const url = res.data?.streamUrl?.url || res.data?.streamUrl;

    console.log("Stream URL:", url);

    if (!url) {
      throw new Error("No stream URL returned from server");
    }

    setPlayerUrl(url);
  } catch (err) {
    console.error(err);
    setPlayerError("Failed to start playback");
    setPlayerVisible(false);
  } finally {
    setPlayerLoading(false);
  }
};


  return (
    <div className="space-y-4">
      <h2 className=" text-xl font-semibold ">Series</h2>

      {error && <p className="text-red-500 text-sm"> {error} </p>}

      {loading && <p> Loading... </p>}

      {!selectedCategory && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 pt-1 gap-3">
          {categories.map((cat) => (
            <SeriesCategory
              key={cat.category_id}
              category={cat}
              onClick={() => handleCategoryClick(cat.category_id)}
            />
          ))}
        </div>
      )}
      {selectedCategory && !loading && (
        <div>
          <div className="z-10 pb-2">
            <button
              className="text-sm text-blue-300 hover:text-blue-500"
              onClick={() => {
                setSelectedCategory(null);
                setSeries([]);
              }}
            >
              <FaArrowLeft size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 pt-1 gap-3">
            {series.map((series) => (
              <SeriesCard
                key={series.series_id}
                series={series}
                onClick={() => handleSeriesClick(series.series_id)}
              />
            ))}
          </div>
        </div>
      )}
      {seriesClicked && loadingSeriesInfo && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-10 ">
          <div className=" p-4 rounded-xl shadow-lg w-11/12 md:w-1/2 lg:w-3/5 h-[90vh] ">
            <button
              onClick={() => {
                setSeriesClicked(false);
                setSeriesInfo(null);
              }}
              className="ml-auto mb-2 block text-slate-400 hover:text-slate-200"
            >
              <IoClose size={24} />
            </button>

            <div className="w-10 h-10 border-4 border-slate-600 border-t-slate-100 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {seriesClicked && seriesInfo && !loadingSeriesInfo && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-5">
          <div className="relative w-11/12 md:w-1/2 lg:w-3/5 bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            {/* כפתור X צף מעל הכל */}
            <button
              onClick={() => {
                setSeriesClicked(false);
                setSeriesInfo(null);
              }}
              className="absolute top-4 right-4 z-10 text-slate-300 hover:text-white"
            >
              <IoClose size={24} />
            </button>

            <SeriesInfo
              si={seriesInfo}
              onPlay={handlePlayEpisode}
            />
          </div>
        </div>
      )}
      {playerVisible && (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-black rounded-xl overflow-hidden shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 bg-slate-900 text-xs text-slate-200">
        <span>Now Playing</span>
        <button
          onClick={() => {
            setPlayerVisible(false);
            setPlayerUrl(null);
          }}
          className="text-slate-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 bg-black">
        {playerLoading && !playerUrl && (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
            Loading stream...
          </div>
        )}

        {!playerLoading && playerUrl && (
          <video
            src={playerUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        )}

        {playerError && (
          <div className="w-full h-full flex items-center justify-center text-red-400 text-xs px-2 text-center">
            {playerError}
          </div>
        )}
      </div>
    </div>
    )}
    </div>
  );
}
