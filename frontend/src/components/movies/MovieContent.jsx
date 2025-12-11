// src/components/live/LiveContent.jsx
import { useState, useEffect } from "react";
import { getMoviesCategories, getMoviesByCategory, getMovieInfo } from "../../api/client";
import MovieCategory from "./MovieCategory";
import MovieCard from "./MovieCard";
import MovieInfo from "./MovieInfo";
import { FaArrowLeft } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { getMovieStream } from "../../api/client";



export default function MovieContent() {
  const [categories, setCategories] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [movieClicked, setMovieClicked] = useState(null);
  const [movieInfo, setMovieInfo] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const [loadingMovieInfo, setLoadingMovieInfo] = useState(false);
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

   useEffect(() => {
  if (movieClicked) {
    // נשמור את הערך הקודם ליתר ביטחון
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }
}, [movieClicked]);

  // ---------- טעינת ערוצים לפי קטגוריה ----------
  const handleCategoryClick = async (categoryId) => {
    try {
      setSelectedCategory(categoryId);
      setLoading(true);
      setError("");

      const res = await getMoviesByCategory(categoryId);
      // res.data = { success: true, data: [...] }
      setMovies(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick= async (movieId)=>{
    try{
        setError("");
        setLoadingMovieInfo(true);
        setMovieClicked(true);
        //console.log("Fetching info for movie ID:", movieId);
        


        const res= await getMovieInfo (movieId);
        setMovieInfo(res.data.data);
        

    }catch(err){
        console.log (err);
        setError("failed to load series info")
        setMovieClicked(false);
    }
    finally{
        setTimeout (()=>{
            setLoadingMovieInfo(false);
        }, 1000);
        //console.log(movieInfo);
    }
}

  const handlePlayMovie = async (movie) => {
    try {
      setPlayerError("");
      setPlayerLoading(true);
      setPlayerVisible(true);
      setPlayerUrl(null);
      const ext=movie.movie_data.container_extension
      
      console.log("movieInfo",ext);
      // נניח שלסרט יש stream_id כמו בדוגמה ששלחת:
      const res = await getMovieStream(movie.movie_data.stream_id, ext);

      const url = `${res.data?.streamUrl}`
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

  // ---------- UI ----------
  

  return (
          
    <div className="space-y-4">
    
        <h2 className=" text-xl font-semibold ">Movies</h2>

        {error && <p className= "text-red-500 text-sm"> {error} </p>}

        {loading && <p> Loading... </p>}

        {!selectedCategory && !loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 pt-1 gap-3">
                {categories.map((cat)=>(
                    <MovieCategory
                    key={cat.category_id} 
                    category={cat}
                    onClick={()=> handleCategoryClick(cat.category_id)}
                    />
                ))
                }
            </div>
        )}
        {selectedCategory && !loading &&  (
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
                {movies.map((mv)=>(
                <MovieCard
                    key={mv.movie_id}
                    movie={mv}
                    onClick={()=> handleMovieClick(mv.stream_id)}
                />
                ))
            }

            </div>
            </div>
        )}
        {movieClicked && loadingMovieInfo && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20">
            <div className="bg-slate-800 p-4 rounded-xl shadow-lg w-11/12 md:w-1/2 lg:w-3/5 ">
                <button
                    onClick={() => {
                    setMovieClicked(false);
                    setMovieInfo(null);
                    }}
                    className="ml-auto mb-2 block text-slate-400 hover:text-slate-200"
                >
                    <IoClose  size={24}/>
                </button>

                <div className="w-10 h-10 border-4 border-slate-600 border-t-slate-100 rounded-full animate-spin mx-auto" />
                
            </div>
        </div>
        )}

        {movieClicked && movieInfo && !loadingMovieInfo && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20">
            <div className="relative w-11/12 md:w-1/2 lg:w-3/5 bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            {/* כפתור X צף מעל הכל */}
            <button
                onClick={() => {
                setMovieClicked(false);
                setMovieInfo(null);
                }}
                className="absolute top-4 right-4 z-10 text-slate-300 hover:text-white"
            >
                <IoClose size={24} />
            </button>

            <MovieInfo 
            mi={movieInfo}
            movie={selectedMovie}
            onPlay={handlePlayMovie}
                
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
